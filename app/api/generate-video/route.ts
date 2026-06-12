import { NextRequest, NextResponse } from 'next/server'
import { startVideo, getVideoStatus, higgsfieldConfigured } from '@/lib/higgsfield'

export const runtime = 'nodejs'
export const maxDuration = 60

// Start an image-to-video render (Higgsfield). Returns a requestId the client
// polls via GET — video renders take minutes, longer than this function runs.
export async function POST(request: NextRequest) {
  try {
    if (!higgsfieldConfigured()) {
      return NextResponse.json({
        success: false,
        demo: true,
        error: 'Add HF_CREDENTIALS to render Higgsfield videos',
      })
    }

    const { prompt, imageUrl } = (await request.json()) as {
      prompt?: string
      imageUrl?: string
    }
    if (!imageUrl) {
      return NextResponse.json({ success: false, error: 'imageUrl is required' }, { status: 400 })
    }

    const started = await startVideo(prompt ?? '', imageUrl)
    if (!started) {
      return NextResponse.json(
        { success: false, error: 'Video render failed to start' },
        { status: 500 },
      )
    }
    return NextResponse.json({ success: true, ...started })
  } catch (error) {
    console.error('Video start error:', error)
    return NextResponse.json({ success: false, error: 'Failed to start video' }, { status: 500 })
  }
}

// Poll a render's status: /api/generate-video?requestId=...
export async function GET(request: NextRequest) {
  const requestId = request.nextUrl.searchParams.get('requestId')
  if (!requestId) {
    return NextResponse.json({ success: false, error: 'requestId is required' }, { status: 400 })
  }
  const state = await getVideoStatus(requestId)
  return NextResponse.json({ success: true, ...state })
}
