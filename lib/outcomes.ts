// Closed-loop learning: log how generated campaigns performed, and feed winners
// back into the knowledge layer as new patterns so future retrieval surfaces
// them. This is the mechanism that makes the Reactor smarter over time.

import { getSupabaseAdmin } from '@/lib/supabase'
import { ingestKnowledge } from '@/lib/knowledge'

export interface OutcomeInput {
  angle: string
  concept: { type: string; text: string; basis?: string }
  metricName?: string
  metricValue?: number
  verdict?: 'pending' | 'winner' | 'loser'
  builderId?: string | null
  notes?: string
}

export interface OutcomeResult {
  ok: boolean
  logged: boolean
  reingested: boolean
  reason?: string
}

function dbConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL)
}

export async function recordOutcome(input: OutcomeInput): Promise<OutcomeResult> {
  const verdict = input.verdict ?? 'pending'

  if (!dbConfigured()) {
    return { ok: true, logged: false, reingested: false, reason: 'Supabase not configured' }
  }

  const { error } = await getSupabaseAdmin().from('campaign_outcomes').insert([
    {
      angle: input.angle,
      concept: input.concept,
      metric_name: input.metricName ?? null,
      metric_value: input.metricValue ?? null,
      verdict,
      builder_id: input.builderId ?? null,
      notes: input.notes ?? null,
    },
  ])
  if (error) throw error

  // Winners become new retrievable knowledge — the smartening loop.
  let reingested = false
  if (verdict === 'winner') {
    try {
      const metric = input.metricName
        ? ` (${input.metricName}: ${input.metricValue ?? '—'})`
        : ''
      await ingestKnowledge({
        system: 'pattern',
        title: `Proven winner — ${input.angle}${metric}`,
        content: `${input.concept.type}: ${input.concept.text}${input.concept.basis ? `\nGrounded in: ${input.concept.basis}` : ''}\nVerified winning campaign for the ${input.angle} angle.`,
        category: input.concept.type,
        builderId: input.builderId ?? null,
        metadata: { source: 'campaign_outcome', verdict, metric: input.metricName },
      })
      reingested = true
    } catch (err) {
      console.error('Winner re-ingest failed:', err)
    }
  }

  return { ok: true, logged: true, reingested }
}
