// Best-performing taxonomy value per axis — what isolation mode locks the
// non-tested axes to, so a controlled test holds proven values fixed and varies
// only the one under test. Reads tagged outcomes from ORACLE memory, weighting
// by verdict + winner score; falls back to canonical defaults (demo / cold
// start) so the configurator always has sensible locks. Also surfaces the
// real persona/pain values discovered in history so the extensible axes offer
// what TPB actually runs, not just the seed list. Never throws.

import { getSupabaseAdmin } from '@/lib/supabase'
import {
  AXIS_META,
  ITERATION_AXES,
  PAIN_POINT_SEEDS,
  PERSONA_SEEDS,
  defaultLockedTaxonomy,
  type CreativeTaxonomy,
} from '@/lib/taxonomy'

const WIN = new Set(['winner', 'high_performer'])

export interface TaxonomyLocks {
  configured: boolean
  /** Best-known value per axis — the isolation lock defaults. */
  locks: CreativeTaxonomy
  /** Persona labels seen in real outcomes (seed ∪ discovered), for the picker. */
  personaOptions: string[]
  /** Pain-point labels seen in real outcomes (seed ∪ discovered). */
  painOptions: string[]
}

interface OutcomeLite {
  verdict: string
  concept: {
    attributes?: { taxonomy?: CreativeTaxonomy; metrics?: { winnerScore?: number } }
  } | null
}

function uniq(seed: readonly string[], discovered: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const v of seed.concat(discovered)) {
    const k = v.trim().toLowerCase()
    if (!v.trim() || seen.has(k)) continue
    seen.add(k)
    out.push(v)
  }
  return out
}

export async function getTaxonomyLocks(): Promise<TaxonomyLocks> {
  const base: TaxonomyLocks = {
    configured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    locks: defaultLockedTaxonomy(),
    personaOptions: [...PERSONA_SEEDS],
    painOptions: [...PAIN_POINT_SEEDS],
  }
  if (!base.configured) return base

  try {
    const { data, error } = await getSupabaseAdmin()
      .from('campaign_outcomes')
      .select('verdict, concept')
      .limit(1000)
    if (error) throw error

    // Per axis-value tally: win-weighted score so the lock is the value that has
    // actually performed, not merely the most frequent.
    const tally: Record<string, Map<string, { score: number; n: number }>> = {}
    for (const axis of ITERATION_AXES) tally[axis] = new Map()
    const personas = new Set<string>()
    const pains = new Set<string>()

    for (const r of (data ?? []) as OutcomeLite[]) {
      const tax = r.concept?.attributes?.taxonomy
      if (!tax) continue
      const ws = r.concept?.attributes?.metrics?.winnerScore
      const weight = (WIN.has(r.verdict) ? 1 : 0) + (typeof ws === 'number' ? ws : 0)
      if (tax.persona) personas.add(tax.persona)
      if (tax.painPoint) pains.add(tax.painPoint)
      for (const axis of ITERATION_AXES) {
        const v = tax[AXIS_META[axis].key]
        if (!v) continue
        const m = tally[axis]
        const cur = m.get(v) ?? { score: 0, n: 0 }
        cur.score += weight
        cur.n += 1
        m.set(v, cur)
      }
    }

    const locks: CreativeTaxonomy = { ...base.locks }
    for (const axis of ITERATION_AXES) {
      let best: string | undefined
      let bestScore = -1
      for (const [v, s] of Array.from(tally[axis])) {
        // Win-weighted score, with a tiny frequency tiebreak.
        const sc = s.score + s.n * 0.01
        if (sc > bestScore) {
          bestScore = sc
          best = v
        }
      }
      if (best) locks[AXIS_META[axis].key] = best
    }

    return {
      configured: true,
      locks,
      personaOptions: uniq(PERSONA_SEEDS, Array.from(personas)),
      painOptions: uniq(PAIN_POINT_SEEDS, Array.from(pains)),
    }
  } catch (err) {
    console.error('getTaxonomyLocks failed:', err)
    return base
  }
}
