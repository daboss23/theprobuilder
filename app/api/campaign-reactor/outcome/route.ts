import { NextRequest, NextResponse } from 'next/server'
import { recordOutcome } from '@/lib/outcomes'

export const runtime = 'nodejs'

// Log how a generated concept performed. Marking a concept a "winner" feeds it
// back into the knowledge layer as a new pattern (the learning loop).
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { angle, concept } = body as {
      angle?: string
      concept?: { type: string; text: string; basis?: string }
    }

    if (!angle || !concept?.text) {
      return NextResponse.json(
        { success: false, error: 'angle and concept are required' },
        { status: 400 },
      )
    }

    const result = await recordOutcome({
      angle,
      concept,
      metricName: body.metricName,
      metricValue: body.metricValue,
      verdict: body.verdict ?? 'winner',
      builderId: body.builderId ?? null,
      notes: body.notes,
    })

    return NextResponse.json({ success: true, ...result })
  } catch (err) {
    console.error('Outcome logging error:', err)
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to log outcome' },
      { status: 500 },
    )
  }
}
