import { NextRequest, NextResponse } from 'next/server'
import { getOpenAI } from '@/lib/openai'

// OpenAI gpt-image-1 — static ad creative. Returns base64 by default, which
// we convert to a data URL the browser can render directly.
export async function POST(request: NextRequest) {
  try {
    const openai = getOpenAI()
    const { prompt } = await request.json()

    const response = await openai.images.generate({
      model: 'gpt-image-1',
      prompt,
      size: '1024x1024',
      quality: 'high',
      n: 1,
    })

    const imageData = response.data?.[0]
    const imageUrl =
      imageData?.url ||
      (imageData?.b64_json ? `data:image/png;base64,${imageData.b64_json}` : null)

    return NextResponse.json({ success: true, imageUrl })
  } catch (error) {
    console.error('OpenAI image generation error:', error)
    return NextResponse.json(
      { success: false, error: 'OpenAI image generation failed' },
      { status: 500 }
    )
  }
}
