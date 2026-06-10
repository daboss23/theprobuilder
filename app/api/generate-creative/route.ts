import { NextRequest, NextResponse } from 'next/server'
import { getOpenAI } from '@/lib/openai'

export const runtime = 'nodejs'
export const maxDuration = 60

// OpenAI gpt-image-1 — ChatGPT's image generation model, used here for Meta ad
// creatives inside the Reactor. We always run at the highest quality tier.
const IMAGE_MODEL = 'gpt-image-1'

// gpt-image-1 supports a fixed set of sizes, so we map each Meta placement to
// the closest supported aspect: square feed, vertical portrait/story, and the
// wide landscape. Anything else falls back to a square.
type ImageSize = '1024x1024' | '1024x1536' | '1536x1024'

const PLACEMENT_SIZES: Record<string, ImageSize> = {
  feed: '1024x1024', // 1:1
  portrait: '1024x1536', // 4:5 → nearest vertical
  story: '1024x1536', // 9:16 → nearest vertical
  landscape: '1536x1024', // 16:9 → nearest wide
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt } = body as { prompt?: string }
    const size: ImageSize = PLACEMENT_SIZES[body.placement as string] ?? '1024x1024'

    if (!prompt) {
      return NextResponse.json({ success: false, error: 'prompt is required' }, { status: 400 })
    }

    if (!process.env.OPENAI_API_KEY) {
      // Graceful fallback so the UI works before the key is set.
      return NextResponse.json({
        success: false,
        error: 'OPENAI_API_KEY is not configured',
        demo: true,
      })
    }

    const openai = getOpenAI()

    const response = await openai.images.generate({
      model: IMAGE_MODEL,
      prompt,
      size,
      quality: 'high',
      n: 1,
    })

    const image = response.data?.[0]
    const imageUrl =
      image?.url || (image?.b64_json ? `data:image/png;base64,${image.b64_json}` : null)

    if (!imageUrl) {
      return NextResponse.json({ success: false, error: 'Model returned no image' }, { status: 502 })
    }

    return NextResponse.json({ success: true, imageUrl, model: IMAGE_MODEL, size })
  } catch (err) {
    console.error('Creative generation error:', err)
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Generation failed' },
      { status: 500 },
    )
  }
}
