import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'

export const runtime = 'nodejs'
export const maxDuration = 60

// Nano Banana 2 — Google Gemini image generation, ported from the
// nano-banana-2-skill CLI into a Reactor API route so creatives can be
// produced inside the platform. Outputs Meta-ready specs by aspect ratio.
const MODELS = {
  flash: 'gemini-3.1-flash-image-preview', // Nano Banana 2 — fast/cheap
  pro: 'gemini-3-pro-image-preview', // Nano Banana Pro — highest quality
} as const

// Meta placement → aspect ratio.
const META_ASPECTS: Record<string, string> = {
  feed: '1:1',
  portrait: '4:5',
  story: '9:16',
  landscape: '16:9',
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt } = body as { prompt?: string }
    const model = body.model === 'pro' ? MODELS.pro : MODELS.flash
    const aspectRatio = META_ASPECTS[body.placement as string] ?? body.aspectRatio ?? '1:1'

    if (!prompt) {
      return NextResponse.json({ success: false, error: 'prompt is required' }, { status: 400 })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      // Graceful fallback so the UI works before the key is set.
      return NextResponse.json({
        success: false,
        error: 'GEMINI_API_KEY is not configured',
        demo: true,
      })
    }

    const ai = new GoogleGenAI({ apiKey })

    const response = await ai.models.generateContent({
      model,
      config: {
        responseModalities: ['IMAGE', 'TEXT'],
        imageConfig: { aspectRatio },
      },
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    })

    const parts = response.candidates?.[0]?.content?.parts ?? []
    for (const part of parts) {
      if (part.inlineData?.data) {
        const mimeType = part.inlineData.mimeType || 'image/png'
        return NextResponse.json({
          success: true,
          imageUrl: `data:${mimeType};base64,${part.inlineData.data}`,
          model,
          aspectRatio,
        })
      }
    }

    return NextResponse.json(
      { success: false, error: 'Model returned no image' },
      { status: 502 },
    )
  } catch (err) {
    console.error('Creative generation error:', err)
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Generation failed' },
      { status: 500 },
    )
  }
}
