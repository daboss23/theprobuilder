import { NextRequest, NextResponse } from 'next/server'
import { generateImage, higgsfieldConfigured, type AspectRatio } from '@/lib/higgsfield'

export const runtime = 'nodejs'
export const maxDuration = 60

// Higgsfield still creative via the official SDK. Returns null imageUrl on
// failure (never throws) so the copy stays usable; signals demo mode when the
// HF_CREDENTIALS key is absent.
export async function POST(request: NextRequest) {
  try {
    if (!higgsfieldConfigured()) {
      return NextResponse.json({
        success: false,
        demo: true,
        imageUrl: null,
        error: 'Add HF_CREDENTIALS to generate Higgsfield creatives',
      })
    }

    const { prompt, aspectRatio } = (await request.json()) as {
      prompt?: string
      aspectRatio?: AspectRatio
    }
    if (!prompt) {
      return NextResponse.json({ success: false, error: 'prompt is required' }, { status: 400 })
    }

    const imageUrl = await generateImage(prompt, aspectRatio ?? '1:1')
    return NextResponse.json({ success: Boolean(imageUrl), imageUrl })
  } catch (error) {
    console.error('Image generation error:', error)
    return NextResponse.json(
      { success: false, imageUrl: null, error: 'Failed to generate image' },
      { status: 500 },
    )
  }
}
