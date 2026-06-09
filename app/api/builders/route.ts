import { NextRequest, NextResponse } from 'next/server'
import { createBuilder, listBuilders } from '@/lib/supabase'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const data = await listBuilders()
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('List builders error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to load builders. Is Supabase configured?' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body?.name || !String(body.name).trim()) {
      return NextResponse.json(
        { success: false, error: 'Builder name is required' },
        { status: 400 }
      )
    }

    const proofPoints = Array.isArray(body.proof_points)
      ? body.proof_points.map((p: unknown) => String(p).trim()).filter(Boolean)
      : null

    const data = await createBuilder({
      name: String(body.name).trim(),
      website: body.website?.trim() || null,
      region: body.region?.trim() || null,
      brand_voice: body.brand_voice?.trim() || null,
      serves: body.serves?.trim() || null,
      offer: body.offer?.trim() || null,
      proof_points: proofPoints,
      visual_style: body.visual_style?.trim() || null,
    })

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Create builder error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create builder' },
      { status: 500 }
    )
  }
}
