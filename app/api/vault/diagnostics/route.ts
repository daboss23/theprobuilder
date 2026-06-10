import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { embed } from '@/lib/embeddings'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Surface a useful message from any thrown value. Supabase/PostgREST errors are
// plain objects ({ message, code, hint, details }), not Error instances, so an
// `instanceof Error` check alone loses the real cause.
function describe(err: unknown): string {
  if (!err) return 'unknown error'
  if (err instanceof Error) return err.message
  if (typeof err === 'object') {
    const e = err as Record<string, unknown>
    const parts = [
      e.message,
      e.code ? `code ${e.code}` : null,
      e.hint,
      e.details,
    ].filter(Boolean)
    return parts.length ? parts.join(' | ') : JSON.stringify(err)
  }
  return String(err)
}

// Read-only health check for the knowledge loop. Reports which env vars the
// running server sees (booleans only — never the values) and whether Supabase,
// the schema, and Voyage respond. Safe to expose: leaks no secrets.
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
    checks.knowledgeChunksTable = error
      ? { ok: false, detail: describe(error) }
      : { ok: true, detail: `${count ?? 0} rows` }
  } catch (err) {
    checks.knowledgeChunksTable = { ok: false, detail: describe(err) }
  }

  // Does the knowledge_stats() RPC exist + run?
  try {
    const { error } = await getSupabaseAdmin().rpc('knowledge_stats')
    checks.knowledgeStatsRpc = error
      ? { ok: false, detail: describe(error) }
      : { ok: true }
  } catch (err) {
    checks.knowledgeStatsRpc = { ok: false, detail: describe(err) }
  }

  // Does Voyage return an embedding of the expected dimension?
  try {
    const [vec] = await embed(['reactor health check'], 'query')
    checks.voyageEmbeddings = {
      ok: Array.isArray(vec) && vec.length === 1024,
      detail: `dim ${Array.isArray(vec) ? vec.length : 'n/a'}`,
    }
  } catch (err) {
    checks.voyageEmbeddings = { ok: false, detail: describe(err) }
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
