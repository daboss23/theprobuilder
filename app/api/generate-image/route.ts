import { NextRequest, NextResponse } from 'next/server'
import { generateImageDetailed, imageConfigured, type AspectRatio } from '@/lib/image'

export const runtime = 'nodejs'
export const maxDuration = 60

// Multi-model still creative (FLUX / fal, Higgsfield Soul).
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
        error: 'Add FAL_KEY or HF_CREDENTIALS to generate creatives',
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

    const { image, error } = await generateImageDetailed(model, prompt, aspectRatio ?? '1:1')
    if (!image) {
      return NextResponse.json({
        success: false,
        imageUrl: null,
        model: null,
        error: `Image render failed${model ? ` for "${model}"` : ''}. ${
          error ?? 'The provider rejected the request.'
        } (Keys: FLUX → FAL_KEY, Higgsfield → HF_CREDENTIALS as "KEY_ID:KEY_SECRET".)`,
      })
    }
    return NextResponse.json({
      success: true,
      imageUrl: image.imageUrl,
      model: image.modelId,
      provider: image.provider,
    })
  } catch (error) {
    console.error('Image generation error:', error)
    return NextResponse.json(
      { success: false, imageUrl: null, error: 'Failed to generate image' },
      { status: 500 },
    )
  }
}
