import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { embed } from '@/lib/embeddings'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Read-only health check for the knowledge loop. Reports which env vars the
// running server actually sees (booleans only — never the values) and whether
// Supabase, the schema, and Voyage respond. Safe to expose: leaks no secrets.
export async function GET() {
  const env = {
    NEXT_PUBLIC_SUPABASE_URL: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    SUPABASE_SERVICE_ROLE_KEY: Boolean(
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY,
    ),
    VOYAGE_API_KEY: Boolean(process.env.VOYAGE_API_KEY),
    ANTHROPIC_API_KEY: Boolean(process.env.ANTHROPIC_API_KEY),
  }

  const checks: Record<string, { ok: boolean; detail?: string }> = {}

  // Can we reach the knowledge_chunks table with the admin client?
  try {
    const { count, error } = await getSupabaseAdmin()
      .from('knowledge_chunks')
      .select('id', { count: 'exact', head: true })
    if (error) throw error
    checks.knowledgeChunksTable = { ok: true, detail: `${count ?? 0} rows` }
  } catch (err) {
    checks.knowledgeChunksTable = {
      ok: false,
      detail: err instanceof Error ? err.message : 'unknown error',
    }
  }

  // Does the knowledge_stats() RPC exist + run?
  try {
    const { error } = await getSupabaseAdmin().rpc('knowledge_stats')
    if (error) throw error
    checks.knowledgeStatsRpc = { ok: true }
  } catch (err) {
    checks.knowledgeStatsRpc = {
      ok: false,
      detail: err instanceof Error ? err.message : 'unknown error',
    }
  }

  // Does Voyage return an embedding of the expected dimension?
  try {
    const [vec] = await embed(['reactor health check'], 'query')
    checks.voyageEmbeddings = {
      ok: Array.isArray(vec) && vec.length === 1024,
      detail: `dim ${Array.isArray(vec) ? vec.length : 'n/a'}`,
    }
  } catch (err) {
    checks.voyageEmbeddings = {
      ok: false,
      detail: err instanceof Error ? err.message : 'unknown error',
    }
  }

  const ready =
    env.NEXT_PUBLIC_SUPABASE_URL &&
    env.SUPABASE_SERVICE_ROLE_KEY &&
    env.VOYAGE_API_KEY &&
    checks.knowledgeChunksTable.ok &&
    checks.knowledgeStatsRpc.ok &&
    checks.voyageEmbeddings.ok

  return NextResponse.json({ ready, env, checks })
}
