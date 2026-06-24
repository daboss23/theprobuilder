import { NextRequest, NextResponse } from 'next/server'
import { fetchYouTubeTranscript } from '@/lib/youtube'

export const runtime = 'nodejs'
export const maxDuration = 30

// Transcribe a YouTube video for the Knowledge Vault. The transcript-fetching
// logic lives in lib/youtube.ts so NOVA's market research can reuse it.
export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()
    if (!url?.trim()) {
      return NextResponse.json({ success: false, error: 'YouTube URL is required' }, { status: 400 })
    }

    const result = await fetchYouTubeTranscript(url.trim())
    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }

    const raw = result.content
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
      { status: 500 },
    )
  }
}
