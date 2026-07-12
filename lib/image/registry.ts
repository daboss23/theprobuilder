import type { ImageModel } from './types'

/**
 * The image model menu — TPB's still-creative equivalent of the video registry.
 * Each model is a different provider; one key per provider unlocks it.
 *
 * Stills run through fal.ai (one FAL_KEY unlocks frontier image models),
 * Higgsfield, or Kie.ai (one KIE_API_KEY unlocks its whole model market — the
 * five flagship image models below). Every provider is one key.
 */

export const IMAGE_MODELS: ImageModel[] = [
  // Kie.ai flagship image market — the most powerful models, one KIE_API_KEY.
  // Listed first so the oven prefers them when Kie is configured.
  {
    id: 'kie-nano-banana-pro',
    label: 'Nano Banana Pro (Kie)',
    provider: 'kie',
    aspectRatios: ['1:1', '16:9', '4:3', '9:16', '3:4'],
    tier: 'flagship',
    notes: 'Google Nano Banana Pro via Kie — top-tier prompt adherence, text rendering, and photoreal detail. Best all-round ad still.',
  },
  {
    id: 'kie-seedream-v4',
    label: 'Seedream 4.0 (Kie)',
    provider: 'kie',
    aspectRatios: ['1:1', '16:9', '4:3', '9:16', '3:4'],
    tier: 'flagship',
    notes: 'ByteDance Seedream 4.0 via Kie — cinematic realism and strong composition for premium proof/founder stills.',
  },
  {
    id: 'kie-flux-kontext-max',
    label: 'FLUX Kontext Max (Kie)',
    provider: 'kie',
    aspectRatios: ['1:1', '16:9', '4:3', '9:16', '3:4'],
    tier: 'flagship',
    notes: 'FLUX.1 Kontext Max via Kie — precise, editable photoreal generation with excellent typography control.',
  },
  {
    id: 'kie-gpt-image',
    label: 'GPT Image (Kie)',
    provider: 'kie',
    aspectRatios: ['1:1', '16:9', '9:16'],
    tier: 'flagship',
    notes: 'OpenAI GPT Image via Kie — instruction-following and clean in-image text for headline/offer creatives.',
  },
  {
    id: 'kie-nano-banana',
    label: 'Nano Banana (Kie)',
    provider: 'kie',
    aspectRatios: ['1:1', '16:9', '4:3', '9:16', '3:4'],
    tier: 'fast',
    notes: 'Google Nano Banana via Kie — fast, high-volume variant for quick creative variations.',
  },
  {
    id: 'fal-flux',
    label: 'FLUX.1 (fal)',
    provider: 'fal',
    aspectRatios: ['1:1', '16:9', '4:3', '9:16', '3:4'],
    tier: 'flagship',
    notes: 'Photoreal humans and scenes via fal — one FAL_KEY, no per-model subscription. Great for realistic UGC and B-roll stills.',
  },
  {
    id: 'higgsfield-soul',
    label: 'Higgsfield Soul',
    provider: 'higgsfield',
    aspectRatios: ['1:1', '16:9', '4:3', '9:16', '3:4'],
    tier: 'flagship',
    notes: 'Photographic, premium ad look — pairs with Higgsfield image-to-video.',
  },
]

// Kept as the demo/fallback default; when Kie is configured the recommender and
// the oven's provider ordering prefer the Kie flagships above.
export const DEFAULT_IMAGE_MODEL = 'kie-nano-banana-pro'

export function getImageModel(id: string): ImageModel | undefined {
  return IMAGE_MODELS.find((m) => m.id === id)
}
