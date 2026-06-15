import { GoogleGenAI } from '@google/genai'
import type { AspectRatio } from './types'

/**
 * Nano Banana 2 — Google Gemini image generation via the official @google/genai
 * SDK. Returns a data URL (base64) the browser can render directly. Per project
 * rules this NEVER throws on a missing key or failure — returns null so the copy
 * stays usable.
 */

const MODEL = process.env.GEMINI_IMAGE_MODEL || 'gemini-3.1-flash-image-preview'

function geminiKey(): string | undefined {
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY
}

export function geminiConfigured(): boolean {
  return Boolean(geminiKey())
}

export interface GeminiImageResult {
  url: string | null
  error?: string
}

export async function generateGeminiImage(
  prompt: string,
  aspectRatio: AspectRatio = '1:1',
): Promise<GeminiImageResult> {
  if (!geminiConfigured()) return { url: null, error: 'GEMINI_API_KEY is not set' }
  if (!prompt) return { url: null, error: 'Empty prompt' }
  try {
    const ai = new GoogleGenAI({ apiKey: geminiKey() })
    const response = await ai.models.generateContent({
      model: MODEL,
      // Nudge aspect ratio in-prompt — the preview image model honours it.
      contents: `${prompt}\n\n(Render as a ${aspectRatio} aspect ratio image.)`,
      config: { responseModalities: ['IMAGE'] },
    })

    const parts = response.candidates?.[0]?.content?.parts ?? []
    for (const part of parts) {
      const data = part.inlineData?.data
      if (data) {
        const mime = part.inlineData?.mimeType || 'image/png'
        return { url: `data:${mime};base64,${data}` }
      }
    }
    // No image part — often a safety block or quota issue; surface any text back.
    const text = response.candidates?.[0]?.content?.parts?.find((p) => p.text)?.text
    return { url: null, error: text ? `Gemini: ${text.slice(0, 200)}` : 'Gemini returned no image (check quota/billing or safety filters)' }
  } catch (err) {
    console.error('Gemini image error:', err)
    return { url: null, error: `Gemini: ${err instanceof Error ? err.message : 'request failed'}` }
  }
}
