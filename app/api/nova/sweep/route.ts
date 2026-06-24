import { NextRequest, NextResponse } from 'next/server'
import { runNovaSweep } from '@/lib/market-intelligence'

export const runtime = 'nodejs'
export const maxDuration = 300
export const dynamic = 'force-dynamic'

// NOVA's always-on memory. Vercel Cron hits this weekly (GET) to sweep her core
// subreddits for the past week's signal and embed anything new — deduped — so
// every campaign fire retrieves fresh intelligence with zero added latency.
// Also callable via POST for a manual full sweep.
//
// Auth: when CRON_SECRET is configured, Vercel attaches it as a Bearer token and
// we require a match. With no secret set, the endpoint is open (local/manual).
function authorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return true
  return request.headers.get('authorization') === `Bearer ${secret}`
}

async function handle(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const result = await runNovaSweep()
    return NextResponse.json({ success: true, ...result })
  } catch (err) {
    console.error('NOVA sweep error:', err)
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Sweep failed' },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  return handle(request)
}

export async function POST(request: NextRequest) {
  return handle(request)
}
