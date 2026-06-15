/**
 * Unified image-generation types — the multi-model still-creative layer.
 * Mirrors lib/video so the agent, routes, and UI treat every image model
 * (Nano Banana / Gemini, OpenAI, Higgsfield) the same way.
 */

export type AspectRatio = '1:1' | '9:16' | '16:9'

export type ImageProvider = 'gemini' | 'openai' | 'higgsfield' | 'fal'

export type ModelTier = 'flagship' | 'fast' | 'budget'

export interface ImageModel {
  id: string
  label: string
  provider: ImageProvider
  aspectRatios: AspectRatio[]
  tier: ModelTier
  notes: string
}

/** Model entry plus whether its provider key is present in this environment. */
export interface ImageModelAvailability extends ImageModel {
  configured: boolean
}
