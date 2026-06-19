import type { ImageModel } from './types'

/**
 * The image model menu — TPB's still-creative equivalent of the video registry.
 * Each model is a different provider; one key per provider unlocks it.
 *
 * Stills run through fal.ai (one FAL_KEY unlocks frontier image models) or
 * Higgsfield. Kie.ai can be added here as a second gateway when wired.
 */

export const IMAGE_MODELS: ImageModel[] = [
  {
    id: 'fal-flux',
    label: 'FLUX.1 (fal)',
    provider: 'fal',
    aspectRatios: ['1:1', '9:16', '16:9'],
    tier: 'flagship',
    notes: 'Photoreal humans and scenes via fal — one FAL_KEY, no per-model subscription. Great for realistic UGC and B-roll stills.',
  },
  {
    id: 'higgsfield-soul',
    label: 'Higgsfield Soul',
    provider: 'higgsfield',
    aspectRatios: ['1:1', '9:16', '16:9'],
    tier: 'flagship',
    notes: 'Photographic, premium ad look — pairs with Higgsfield image-to-video.',
  },
]

export const DEFAULT_IMAGE_MODEL = 'fal-flux'

export function getImageModel(id: string): ImageModel | undefined {
  return IMAGE_MODELS.find((m) => m.id === id)
}
