import { NextRequest, NextResponse } from 'next/server'
import { YoutubeTranscript } from 'youtube-transcript'

export const runtime = 'nodejs'

function extractVideoId(url: string): string | null {
  const patterns = [
    /[?&]v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /\/embed\/([a-zA-Z0-9_-]{11})/,
    /\/shorts\/([a-zA-Z0-9_-]{11})/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
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

    const transcript = await YoutubeTranscript.fetchTranscript(videoId)

    if (!transcript || transcript.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No transcript found. The video may not have captions enabled.',
        },
        { status: 400 }
      )
    }

    const raw = transcript
      .map((t) => t.text)
      .join(' ')
      .replace(/\[.*?\]/g, '')
      .replace(/\s+/g, ' ')
      .trim()

    const content =
      raw.length > 8000 ? raw.slice(0, 8000) + '\n\n[transcript truncated at 8000 chars]' : raw

    return NextResponse.json({ success: true, content })
  } catch (error) {
    console.error('YouTube transcript error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch transcript. Video may be private or have no captions.' },
      { status: 500 }
    )
  }
}
