import type { ImageModelAvailability } from './types'

/**
 * Recommend an image model before the Reactor fires. Pure (types only) so it
 * runs on client and server.
 *
 * Heuristic:
 *  - Photographic founder / testimonial creative → Higgsfield Soul (premium ad
 *    look, pairs with its image-to-video).
 *  - Otherwise → FLUX.1 via fal (photoreal stills in-house on one fal key).
 * Prefers configured models; falls back to the ideal for display when none have
 * keys yet.
 */

export interface ImageRecommendation {
  modelId: string
  reason: string
  configured: boolean
}

const TEXT_HEAVY = ['static', 'campaign', 'headline', 'banner']
const PHOTO = ['founder', 'testimonial', 'event']

export function recommendImageModel(
  outputs: string[],
  models: ImageModelAvailability[],
): ImageRecommendation | null {
  if (models.length === 0) return null

  const lower = outputs.map((o) => o.toLowerCase())
  const wantsText = lower.some((o) => TEXT_HEAVY.some((k) => o.includes(k)))
  const wantsPhoto = lower.some((o) => PHOTO.some((k) => o.includes(k)))

  const preference: { id: string; reason: string }[] = wantsText
    ? [
        { id: 'fal-flux', reason: 'photoreal stills with strong prompt adherence via one fal key' },
        { id: 'higgsfield-soul', reason: 'premium photographic look' },
      ]
    : wantsPhoto
      ? [
          { id: 'higgsfield-soul', reason: 'premium photographic look for founder/testimonial ads' },
          { id: 'fal-flux', reason: 'photoreal founder/testimonial stills in-house via one fal key' },
        ]
      : [
          { id: 'fal-flux', reason: 'photoreal variants in-house via one fal key' },
          { id: 'higgsfield-soul', reason: 'premium photographic look' },
        ]

  for (const p of preference) {
    const m = models.find((mm) => mm.id === p.id)
    if (m?.configured) return { modelId: m.id, reason: p.reason, configured: true }
  }

  const ideal = models.find((mm) => mm.id === preference[0].id) ?? models[0]
  return { modelId: ideal.id, reason: preference[0].reason, configured: ideal.configured }
}
