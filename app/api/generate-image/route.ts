import { NextRequest, NextResponse } from 'next/server'
import { generateImageWith, imageConfigured, type AspectRatio } from '@/lib/image'

export const runtime = 'nodejs'
export const maxDuration = 60

// Multi-model still creative (Nano Banana / Gemini, OpenAI, Higgsfield).
// Returns null imageUrl on failure (never throws) so the copy stays usable;
// signals demo mode when no image provider key is set. Backward compatible:
// a request with just a prompt renders on the default/best-available model.
export async function POST(request: NextRequest) {
  try {
    if (!imageConfigured()) {
      return NextResponse.json({
        success: false,
        demo: true,
        imageUrl: null,
        error: 'Add GEMINI_API_KEY, OPENAI_API_KEY, or HF_CREDENTIALS to generate creatives',
      })
    }

    const { prompt, aspectRatio, model } = (await request.json()) as {
      prompt?: string
      aspectRatio?: AspectRatio
      model?: string
    }
    if (!prompt) {
      return NextResponse.json({ success: false, error: 'prompt is required' }, { status: 400 })
    }

    const result = await generateImageWith(model, prompt, aspectRatio ?? '1:1')
    return NextResponse.json({
      success: Boolean(result),
      imageUrl: result?.imageUrl ?? null,
      model: result?.modelId ?? null,
    })
  } catch (error) {
    console.error('Image generation error:', error)
    return NextResponse.json(
      { success: false, imageUrl: null, error: 'Failed to generate image' },
      { status: 500 },
    )
  }
}
