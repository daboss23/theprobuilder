// Shared YouTube transcript fetcher. Pulls captions via YouTube's internal
// "innertube" player API (posing as the Android client, which still returns
// caption metadata reliably), with a watch-page scrape fallback when that call
// is throttled. Used by the Knowledge Vault YouTube ingest (ATLAS) and by
// NOVA's market-intelligence research. Never throws — returns a result union.

export interface TranscriptResult {
  ok: boolean
  content: string
  videoId?: string
  error?: string
}

export function extractVideoId(url: string): string | null {
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
  // Bare 11-char id
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url
  return null
}

interface CaptionTrack {
  baseUrl: string
  languageCode?: string
  kind?: string
}

// Ask YouTube's internal "innertube" player API for the video's caption tracks.
// We pose as the Android client, which still returns caption metadata reliably
// without the page-scraping the youtube-transcript package depends on.
async function fetchCaptionTracks(videoId: string): Promise<CaptionTrack[]> {
  // Long-lived public innertube key used by the YouTube web client.
  const INNERTUBE_KEY = 'AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8'
  try {
    const res = await fetch(
      `https://www.youtube.com/youtubei/v1/player?key=${INNERTUBE_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'com.google.android.youtube/20.10.38 (Linux; U; Android 13) gzip',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        body: JSON.stringify({
          videoId,
          context: {
            client: {
              clientName: 'ANDROID',
              clientVersion: '20.10.38',
              androidSdkVersion: 33,
              hl: 'en',
              gl: 'US',
            },
          },
        }),
        signal: AbortSignal.timeout(15000),
      },
    )
    if (!res.ok) return []
    const data = await res.json()
    return data?.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? []
  } catch {
    return []
  }
}

// Fallback: scrape the watch page and pull caption tracks out of the embedded
// ytInitialPlayerResponse JSON. Useful when the innertube call is throttled.
async function fetchCaptionTracksFromWatchPage(videoId: string): Promise<CaptionTrack[]> {
  try {
    const res = await fetch(`https://www.youtube.com/watch?v=${videoId}&hl=en`, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) return []
    const html = await res.text()
    const match = html.match(/"captionTracks":(\[.*?\])/)
    if (!match) return []
    return JSON.parse(match[1]) as CaptionTrack[]
  } catch {
    return []
  }
}

// Prefer a manually-authored English track, then any English, then any track at
// all — auto-generated captions are better than nothing.
function pickTrack(tracks: CaptionTrack[]): CaptionTrack | null {
  if (tracks.length === 0) return null
  const english = tracks.filter((t) => t.languageCode?.startsWith('en'))
  const manualEnglish = english.find((t) => t.kind !== 'asr')
  return manualEnglish ?? english[0] ?? tracks[0]
}

// Fetch a caption track as json3 and flatten it into plain transcript text.
async function fetchTranscriptText(track: CaptionTrack): Promise<string> {
  try {
    const sep = track.baseUrl.includes('?') ? '&' : '?'
    const res = await fetch(`${track.baseUrl}${sep}fmt=json3`, {
      headers: { 'Accept-Language': 'en-US,en;q=0.9' },
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) return ''
    const data = await res.json()
    const events: { segs?: { utf8?: string }[] }[] = data?.events ?? []
    return events
      .flatMap((e) => (e.segs ?? []).map((s) => s.utf8 ?? ''))
      .join('')
      .replace(/\n/g, ' ')
      .replace(/\[.*?\]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  } catch {
    return ''
  }
}

/**
 * Fetch a video's transcript from its URL or bare id. Returns the full
 * transcript text — callers truncate to their own budget. Best-effort: any
 * failure resolves to `{ ok: false, error }` rather than throwing.
 */
export async function fetchYouTubeTranscript(url: string): Promise<TranscriptResult> {
  const videoId = extractVideoId(url.trim())
  if (!videoId) {
    return { ok: false, content: '', error: 'Could not find a video ID in that URL' }
  }

  let tracks = await fetchCaptionTracks(videoId)
  if (tracks.length === 0) {
    tracks = await fetchCaptionTracksFromWatchPage(videoId)
  }
  const track = pickTrack(tracks)
  if (!track) {
    return {
      ok: false,
      content: '',
      videoId,
      error: 'No transcript found. This video has no captions (or they are disabled).',
    }
  }

  const raw = await fetchTranscriptText(track)
  if (!raw || raw.length < 5) {
    return { ok: false, content: '', videoId, error: 'The transcript came back empty for this video.' }
  }

  return { ok: true, content: raw, videoId }
}
