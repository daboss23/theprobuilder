import { NextRequest, NextResponse } from 'next/server'

// Higgsfield — motion / cinematic still creative.
//
// NOTE: Verify the endpoint URL and response schema against the live
// Higgsfield API docs before the demo. The imageUrl extraction below checks
// the most common shapes (url / image_url / output[0]) and returns null if
// none are present so the copy remains usable even when an image fails.
export async function POST(request: NextRequest) {
  try {
    if (!process.env.HIGGSFIELD_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'HIGGSFIELD_API_KEY is not configured' },
        { status: 500 }
      )
    }

    const { prompt } = await request.json()

    const response = await fetch('https://api.higgsfield.ai/v1/image/generate', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.HIGGSFIELD_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        model: 'flux-1.1-pro',
        width: 1080,
        height: 1080,
        quality: 'high',
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Higgsfield error:', errorText)
      return NextResponse.json(
        { success: false, error: 'Image generation failed' },
        { status: 500 }
      )
    }

    const data = await response.json()
    const imageUrl = data.url || data.image_url || data.output?.[0] || null

    return NextResponse.json({ success: true, imageUrl })
  } catch (error) {
    console.error('Image generation error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate image' },
      { status: 500 }
    )
  }
}
