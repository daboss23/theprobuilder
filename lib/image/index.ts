import { generateImage as higgsfieldImage, higgsfieldConfigured } from '@/lib/higgsfield'
import { generateGeminiImage, geminiConfigured } from './gemini'
import { generateOpenAIImage, openaiImageConfigured } from './openai'
import { generateFalImage, falImageConfigured } from './fal'
import { DEFAULT_IMAGE_MODEL, IMAGE_MODELS, getImageModel } from './registry'
import type { AspectRatio, ImageModelAvailability } from './types'

export * from './types'
export { IMAGE_MODELS, DEFAULT_IMAGE_MODEL, getImageModel } from './registry'

/**
 * Unified image "oven" — dispatches a still render to whichever provider backs
 * the requested model (Nano Banana / Gemini, OpenAI, Higgsfield). Callers never
 * branch on provider. Never throws on missing keys — returns null.
 */

export function providerConfigured(provider: string): boolean {
  if (provider === 'gemini') return geminiConfigured()
  if (provider === 'openai') return openaiImageConfigured()
  if (provider === 'higgsfield') return higgsfieldConfigured()
  if (provider === 'fal') return falImageConfigured()
  return false
}

/** True if ANY image provider is configured. */
export function imageConfigured(): boolean {
  return (
    geminiConfigured() || openaiImageConfigured() || higgsfieldConfigured() || falImageConfigured()
  )
}

/** The image model menu annotated with whether each model's key is present. */
export function listImageModels(): ImageModelAvailability[] {
  return IMAGE_MODELS.map((m) => ({ ...m, configured: providerConfigured(m.provider) }))
}

/** Pick a usable model: the requested one if configured, else first configured. */
function resolveModelId(requested?: string): string | null {
  const tryIds = [requested, DEFAULT_IMAGE_MODEL].filter(Boolean) as string[]
  for (const id of tryIds) {
    const m = getImageModel(id)
    if (m && providerConfigured(m.provider)) return id
  }
  return IMAGE_MODELS.find((m) => providerConfigured(m.provider))?.id ?? null
}

export interface GeneratedImage {
  imageUrl: string
  modelId: string
  provider: string
}

/** Generate a still with the chosen model (or the best available). */
export async function generateImageWith(
  modelId: string | undefined,
  prompt: string,
  aspectRatio: AspectRatio = '1:1',
): Promise<GeneratedImage | null> {
  const id = resolveModelId(modelId)
  if (!id) return null
  const model = getImageModel(id)
  if (!model) return null

  let imageUrl: string | null = null
  if (model.provider === 'gemini') imageUrl = await generateGeminiImage(prompt, aspectRatio)
  else if (model.provider === 'openai') imageUrl = await generateOpenAIImage(prompt, aspectRatio)
  else if (model.provider === 'higgsfield') imageUrl = await higgsfieldImage(prompt, aspectRatio)
  else if (model.provider === 'fal') imageUrl = await generateFalImage(prompt, aspectRatio)

  if (!imageUrl) return null
  return { imageUrl, modelId: id, provider: model.provider }
}
