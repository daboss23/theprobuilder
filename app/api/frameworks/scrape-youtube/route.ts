import { NextRequest, NextResponse } from 'next/server'
import { fetch as undiciFetch, ProxyAgent } from 'undici'

export const runtime = 'nodejs'
export const maxDuration = 30

// Optional outbound proxy. YouTube blocks transcript requests from datacenter
// IPs (Vercel/AWS), so set PROXY_URL to a residential/rotating proxy
// (e.g. http://user:pass@host:port) to route these requests through it. When
// unset, requests go out directly — best-effort, often blocked from the server.
const proxyAgent = process.env.PROXY_URL ? new ProxyAgent(process.env.PROXY_URL) : null

// fetch wrapper that routes through the proxy when one is configured.
async function pfetch(url: string, opts: Record<string, unknown>) {
  if (proxyAgent) {
    return undiciFetch(url, { ...opts, dispatcher: proxyAgent } as never)
  }
  return fetch(url, opts as RequestInit)
}

function extractVideoId(url: string): string | null {
  const patterns = [
    /[?&]v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /\/embed\/([a-zA-Z0-9_-]{11})/,
    /\/shorts\/([a-zA-Z0-9_-]{11})/,
    /\/live\/([a-zA-Z0-9_-]{11})/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url
  return null
}

interface CaptionTrack {
  baseUrl: string
  languageCode?: string
  kind?: string
}

// Long-lived public innertube key used by YouTube's own clients.
const INNERTUBE_KEY = 'AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8'

// Consent cookies that skip the EU consent wall and reduce bot-check redirects
// when requests originate from a datacenter IP.
const CONSENT_COOKIE = 'CONSENT=YES+cb; SOCS=CAI'

// Several client identities to try in order. YouTube's bot-checks treat each
// client differently from a server IP, so if one returns no captions we fall
// through to the next instead of giving up.
const CLIENTS: { name: string; body: Record<string, unknown>; userAgent: string }[] = [
  {
    name: 'IOS',
    userAgent: 'com.google.ios.youtube/19.45.4 (iPhone16,2; U; CPU iOS 18_1_0 like Mac OS X)',
    body: {
      client: {
        clientName: 'IOS',
        clientVersion: '19.45.4',
        deviceModel: 'iPhone16,2',
        hl: 'en',
        gl: 'US',
      },
    },
  },
  {
    name: 'TVHTML5',
    userAgent:
      'Mozilla/5.0 (PlayStation; PlayStation 4/12.00) AppleWebKit/605.1.15 (KHTML, like Gecko)',
    body: {
      client: {
        clientName: 'TVHTML5_SIMPLY_EMBEDDED_PLAYER',
        clientVersion: '2.0',
        hl: 'en',
        gl: 'US',
      },
    },
  },
  {
    name: 'ANDROID',
    userAgent: 'com.google.android.youtube/19.44.38 (Linux; U; Android 14) gzip',
    body: {
      client: {
        clientName: 'ANDROID',
        clientVersion: '19.44.38',
        androidSdkVersion: 34,
        hl: 'en',
        gl: 'US',
      },
    },
  },
  {
    name: 'WEB',
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
    body: {
      client: {
        clientName: 'WEB',
        clientVersion: '2.20240101.00.00',
        hl: 'en',
        gl: 'US',
      },
    },
  },
]

// Ask one innertube client for the video's caption tracks.
async function tracksViaClient(
  videoId: string,
  client: (typeof CLIENTS)[number]
): Promise<CaptionTrack[]> {
  try {
    const res = await pfetch(`https://www.youtube.com/youtubei/v1/player?key=${INNERTUBE_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': client.userAgent,
        'Accept-Language': 'en-US,en;q=0.9',
        Cookie: CONSENT_COOKIE,
        Origin: 'https://www.youtube.com',
      },
      body: JSON.stringify({ videoId, context: client.body }),
      signal: AbortSignal.timeout(12000),
    })
    if (!res.ok) return []
    const data = await res.json()
    return data?.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? []
  } catch {
    return []
  }
}

// Fallback: scrape the watch page (with consent cookie) and pull caption tracks
// out of the embedded ytInitialPlayerResponse JSON.
async function tracksViaWatchPage(videoId: string): Promise<CaptionTrack[]> {
  try {
    const res = await pfetch(
      `https://www.youtube.com/watch?v=${videoId}&hl=en&bpctr=9999999999&has_verified=1`,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
          Cookie: CONSENT_COOKIE,
        },
        signal: AbortSignal.timeout(12000),
      }
    )
    if (!res.ok) return []
    const html = await res.text()
    const match = html.match(/"captionTracks":(\[.*?\])/)
    if (!match) return []
    return JSON.parse(match[1]) as CaptionTrack[]
  } catch {
    return []
  }
}

// Try every strategy in turn; return the first that yields caption tracks.
async function findCaptionTracks(videoId: string): Promise<CaptionTrack[]> {
  for (const client of CLIENTS) {
    const tracks = await tracksViaClient(videoId, client)
    if (tracks.length > 0) return tracks
  }
  return tracksViaWatchPage(videoId)
}

// Prefer a manually-authored English track, then any English, then any track —
// auto-generated captions ('asr') are better than nothing.
function pickTrack(tracks: CaptionTrack[]): CaptionTrack | null {
  if (tracks.length === 0) return null
  const english = tracks.filter((t) => t.languageCode?.startsWith('en'))
  const manualEnglish = english.find((t) => t.kind !== 'asr')
  return manualEnglish ?? english[0] ?? tracks[0]
}

// Fetch a caption track and flatten it into plain transcript text. Tries the
// json3 format first, then falls back to parsing the default XML format.
async function fetchTranscriptText(track: CaptionTrack): Promise<string> {
  const sep = track.baseUrl.includes('?') ? '&' : '?'
  const headers = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9',
    Cookie: CONSENT_COOKIE,
  }

  // json3
  try {
    const res = await pfetch(`${track.baseUrl}${sep}fmt=json3`, {
      headers,
      signal: AbortSignal.timeout(12000),
    })
    if (res.ok) {
      const data = await res.json()
      const events: { segs?: { utf8?: string }[] }[] = data?.events ?? []
      const text = events
        .flatMap((e) => (e.segs ?? []).map((s) => s.utf8 ?? ''))
        .join('')
      const cleaned = cleanTranscript(text)
      if (cleaned) return cleaned
    }
  } catch {
    /* fall through to XML */
  }

  // XML fallback
  try {
    const res = await pfetch(track.baseUrl, { headers, signal: AbortSignal.timeout(12000) })
    if (res.ok) {
      const xml = await res.text()
      const text = (xml.match(/<text[^>]*>([\s\S]*?)<\/text>/g) ?? [])
        .map((t) => t.replace(/<[^>]+>/g, ''))
        .join(' ')
        .replace(/&amp;/g, '&')
        .replace(/&#39;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
      return cleanTranscript(text)
    }
  } catch {
    /* give up */
  }

  return ''
}

function cleanTranscript(text: string): string {
  return text
    .replace(/\n/g, ' ')
    .replace(/\[.*?\]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()
    if (!url?.trim()) {
      return NextResponse.json({ success: false, error: 'YouTube URL is required' }, { status: 400 })
    }

    const videoId = extractVideoId(url.trim())
    if (!videoId) {
      return NextResponse.json(
        { success: false, error: 'Could not find a video ID in that URL' },
        { status: 400 }
      )
    }

    const tracks = await findCaptionTracks(videoId)
    const track = pickTrack(tracks)
    if (!track) {
      return NextResponse.json(
        {
          success: false,
          error:
            'No transcript found. YouTube may be blocking the request from the server, or this video has no captions. Try another video, or paste the transcript into the text box.',
        },
        { status: 400 }
      )
    }

    const raw = await fetchTranscriptText(track)
    if (!raw || raw.length < 5) {
      return NextResponse.json(
        { success: false, error: 'The transcript came back empty for this video.' },
        { status: 400 }
      )
    }

    const content =
      raw.length > 8000 ? raw.slice(0, 8000) + '\n\n[transcript truncated at 8000 chars]' : raw

    return NextResponse.json({ success: true, content })
  } catch (error) {
    console.error('YouTube transcript error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch transcript. The video may be private, age-restricted, or region-locked.',
      },
      { status: 500 }
    )
  }
}
