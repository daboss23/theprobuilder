import { NextResponse } from 'next/server'
import { vaultStats } from '@/lib/knowledge'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Live counts of what's stored in the knowledge layer (falls back to the curated
// demo map when Supabase isn't configured).
export async function GET() {
  try {
    const stats = await vaultStats()
    return NextResponse.json({ success: true, ...stats })
  } catch (err) {
    console.error('Vault stats error:', err)
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Stats failed' },
      { status: 500 },
    )
  }
}
