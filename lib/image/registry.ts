import type { ImageModel } from './types'

/**
 * The image model menu — TPB's still-creative equivalent of the video registry.
 * Each model is a different provider; one key per provider unlocks it.
 */

export const IMAGE_MODELS: ImageModel[] = [
  {
    id: 'fal-flux',
    label: 'FLUX.1 (fal)',
    provider: 'fal',
    endpoint: process.env.FAL_IMAGE_MODEL || 'fal-ai/flux/dev',
    aspectRatios: ['1:1', '9:16', '16:9'],
    tier: 'flagship',
    notes: 'Photoreal humans and scenes via fal — one FAL_KEY, no per-model subscription. Great for realistic UGC and B-roll stills.',
  },
  {
    id: 'fal-nano-banana-pro',
    label: 'Nano Banana Pro (fal)',
    provider: 'fal',
    endpoint: 'fal-ai/nano-banana-pro',
    aspectRatios: ['1:1', '9:16', '16:9'],
    tier: 'flagship',
    notes: 'Google Nano Banana Pro through fal — strong prompt following and premium still variants using FAL_KEY.',
  },
  {
    id: 'fal-gpt-image-2',
    label: 'GPT Image 2 (fal)',
    provider: 'fal',
    endpoint: 'openai/gpt-image-2',
    aspectRatios: ['1:1', '9:16', '16:9'],
    tier: 'flagship',
    notes: 'OpenAI GPT Image 2 through fal — strong text rendering and precise art direction using FAL_KEY.',
  },
  {
    id: 'fal-grok-imagine',
    label: 'Grok Imagine (fal)',
    provider: 'fal',
    endpoint: 'xai/grok-imagine-image/quality/text-to-image',
    aspectRatios: ['1:1', '9:16', '16:9'],
    tier: 'flagship',
    notes: 'xAI Grok Imagine through fal — high-quality text-to-image creative exploration using FAL_KEY.',
  },
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
