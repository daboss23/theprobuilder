import { NextResponse } from 'next/server'
import { extractCreativeDNA } from '@/lib/spark'
import { classifyTaxonomy } from '@/lib/taxonomy-classify'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * Extract a clonable reference from pasted ad copy / a transcript / notes.
 * Reuses SPARK's extractor (no second extractor) + the taxonomy classifier, so
 * an external ad becomes an editable Creative DNA + a comparable taxonomy tag.
 * Never throws — both paths fall back to heuristics with no key.
 *
 * Body: { text: string, sourceLabel?: string }
 */
export async function POST(req: Request) {
  let text = ''
  let sourceLabel = ''
  try {
    const body = (await req.json()) as { text?: string; sourceLabel?: string }
    text = (body.text ?? '').trim()
    sourceLabel = (body.sourceLabel ?? '').trim()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request body.' }, { status: 400 })
  }

  if (text.length < 20) {
    return NextResponse.json({
      ok: false,
      error: 'Paste the ad copy, script, or transcript to clone (at least a sentence or two).',
    })
  }

  const [dna, taxonomy] = await Promise.all([extractCreativeDNA(text), classifyTaxonomy(text)])
  return NextResponse.json({ ok: true, dna, taxonomy, sourceLabel: sourceLabel || undefined })
}
