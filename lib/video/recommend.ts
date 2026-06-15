import type { ModelAvailability } from './types'

/**
 * Pick the best video model for a set of requested output types, before the
 * Reactor fires. Pure (types only) so it runs on both client and server.
 *
 * Heuristic, in priority order:
 *  - Anything where a person speaks (Testimonial / UGC / talking-head) → a model
 *    with native audio (Veo 3) so the dialogue is generated, not silent.
 *  - Cinematic action / B-roll (Video / Founder Concept) → a flagship realism
 *    model (Seedance 2.0, then Kling 2.5).
 *  - Otherwise → the cheapest flagship-or-budget option for volume.
 * Prefers configured models; falls back to the ideal pick for display when none
 * of the preferred models have keys yet.
 */

export interface VideoRecommendation {
  modelId: string
  reason: string
  configured: boolean
}

const SPEAKING = ['testimonial', 'ugc', 'talking', 'spokesperson', 'interview']
const CINEMATIC = ['video', 'founder', 'event', 'campaign']

export function recommendVideoModel(
  outputs: string[],
  models: ModelAvailability[],
): VideoRecommendation | null {
  if (models.length === 0) return null

  const lower = outputs.map((o) => o.toLowerCase())
  const wantsSpeech = lower.some((o) => SPEAKING.some((k) => o.includes(k)))
  const wantsCinematic = lower.some((o) => CINEMATIC.some((k) => o.includes(k)))

  // Ordered preference list of (modelId, why) by intent.
  const preference: { id: string; reason: string }[] = wantsSpeech
    ? [
        { id: 'veo-3', reason: 'people speaking with native audio (UGC / testimonials)' },
        { id: 'seedance-2.0', reason: 'cinematic realism with native synchronized audio' },
        { id: 'kling-2.5', reason: 'strong lip-sync-friendly motion for talking-head UGC' },
      ]
    : wantsCinematic
      ? [
          { id: 'seedance-2.0', reason: 'cinematic realism + native audio for on-site builder B-roll' },
          { id: 'kling-2.5', reason: 'high prompt adherence for action scenes' },
          { id: 'veo-3', reason: 'realistic motion with native audio' },
        ]
      : [
          { id: 'seedance-2.0-fast', reason: 'flagship Seedance quality at lower cost for high-volume variants' },
          { id: 'wan-2.5', reason: 'best quality-to-cost for high-volume variants' },
          { id: 'seedance-2.0', reason: 'flagship realism' },
        ]

  // First configured model in the preference order wins.
  for (const p of preference) {
    const m = models.find((mm) => mm.id === p.id)
    if (m?.configured) return { modelId: m.id, reason: p.reason, configured: true }
  }

  // None of the preferred models are configured — recommend the ideal anyway
  // (so the UI can prompt for the key), but flag it as not yet usable.
  const ideal = models.find((mm) => mm.id === preference[0].id) ?? models[0]
  return { modelId: ideal.id, reason: preference[0].reason, configured: ideal.configured }
}
