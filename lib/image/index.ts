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

/**
 * Ordered list of configured model ids to try: the resolved/requested model
 * first, then every other configured model as a fallback. This makes the oven
 * resilient — if the chosen provider is out of credit or rejects, it
 * automatically tries another configured provider before giving up.
 */
function candidateModelIds(requested?: string): string[] {
  const first = resolveModelId(requested)
  const rest = IMAGE_MODELS.filter((m) => providerConfigured(m.provider)).map((m) => m.id)
  return Array.from(new Set([first, ...rest].filter(Boolean) as string[]))
}

/** Render with a single specific model; returns the URL and any failure reason. */
async function renderWithModel(
  id: string,
  prompt: string,
  aspectRatio: AspectRatio,
): Promise<{ url: string | null; error?: string }> {
  const model = getImageModel(id)
  if (!model) return { url: null, error: `Unknown image model "${id}"` }
  if (model.provider === 'gemini') return generateGeminiImage(prompt, aspectRatio)
  if (model.provider === 'openai') return generateOpenAIImage(prompt, aspectRatio)
  if (model.provider === 'fal') return generateFalImage(prompt, aspectRatio, model.endpoint)
  if (model.provider === 'higgsfield') {
    const url = await higgsfieldImage(prompt, aspectRatio)
    return { url, error: url ? undefined : 'Higgsfield returned no image' }
  }
  return { url: null, error: `No renderer for provider "${model.provider}"` }
}

export interface GeneratedImage {
  imageUrl: string
  modelId: string
  provider: string
}

export interface ImageAttempt {
  image: GeneratedImage | null
  /** Human-readable failure reason when image is null (surfaced to the UI). */
  error?: string
}

/**
 * Generate a still and report WHY it failed (provider status/body) so the UI
 * can show an actionable error instead of a generic "rejected" message.
 */
export async function generateImageDetailed(
  modelId: string | undefined,
  prompt: string,
  aspectRatio: AspectRatio = '1:1',
): Promise<ImageAttempt> {
  const candidates = candidateModelIds(modelId)
  if (candidates.length === 0) return { image: null, error: 'No image provider is configured' }

  const errors: string[] = []
  for (const id of candidates) {
    const model = getImageModel(id)
    if (!model) continue
    const { url, error } = await renderWithModel(id, prompt, aspectRatio)
    if (url) {
      return { image: { imageUrl: url, modelId: id, provider: model.provider } }
    }
    errors.push(`${model.label}: ${error ?? 'no image'}`)
  }

  return { image: null, error: errors.join(' · ') || 'All image providers failed' }
}

/** Generate a still with the chosen model (or the best available). */
export async function generateImageWith(
  modelId: string | undefined,
  prompt: string,
  aspectRatio: AspectRatio = '1:1',
): Promise<GeneratedImage | null> {
  return (await generateImageDetailed(modelId, prompt, aspectRatio)).image
}
