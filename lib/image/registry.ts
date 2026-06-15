import type { ImageModel } from './types'

/**
 * The image model menu — TPB's still-creative equivalent of the video registry.
 * Each model is a different provider; one key per provider unlocks it.
 */

export const IMAGE_MODELS: ImageModel[] = [
  {
    id: 'nano-banana',
    label: 'Nano Banana 2 (Gemini)',
    provider: 'gemini',
    aspectRatios: ['1:1', '9:16', '16:9'],
    tier: 'flagship',
    notes: 'Fast, high-quality, strong instruction-following — great for rapid creative variants.',
  },
  {
    id: 'openai-gpt-image',
    label: 'OpenAI GPT Image',
    provider: 'openai',
    aspectRatios: ['1:1', '9:16', '16:9'],
    tier: 'flagship',
    notes: 'Best at rendering legible text in the image and precise prompt adherence.',
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

export const DEFAULT_IMAGE_MODEL = 'nano-banana'

export function getImageModel(id: string): ImageModel | undefined {
  return IMAGE_MODELS.find((m) => m.id === id)
}
