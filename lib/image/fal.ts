import type { AspectRatio } from './types'

/**
 * fal.ai still-image provider — the same single gateway that backs the video
 * models, reused for stills. One FAL_KEY unlocks frontier image models
 * (FLUX, etc.). Uses fal's synchronous run endpoint: stills render in seconds,
 * well inside one serverless function, so we block and return the URL inline
 * (unlike video, which must be polled).
 *
 * Per project rules this NEVER throws on a missing key or a failed render —
 * it returns null so the copy stays usable.
 */

const RUN_BASE = 'https://fal.run'

// Env-overridable so a fal model rename is a variable change, not a code change.
const FAL_IMAGE_MODEL = process.env.FAL_IMAGE_MODEL || 'fal-ai/flux/dev'

function falKey(): string | undefined {
  return process.env.FAL_KEY || process.env.FAL_API_KEY
}

export function falImageConfigured(): boolean {
  return Boolean(falKey())
}

// fal image models take a named size rather than a ratio string.
const FAL_SIZE: Record<AspectRatio, string> = {
  '1:1': 'square_hd',
  '9:16': 'portrait_16_9',
  '16:9': 'landscape_16_9',
}

export async function generateFalImage(
  prompt: string,
  aspectRatio: AspectRatio = '1:1',
): Promise<string | null> {
  if (!falImageConfigured() || !prompt) return null
  try {
    const res = await fetch(`${RUN_BASE}/${FAL_IMAGE_MODEL}`, {
      method: 'POST',
      headers: {
        Authorization: `Key ${falKey()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        image_size: FAL_SIZE[aspectRatio] ?? FAL_SIZE['1:1'],
        num_images: 1,
      }),
      cache: 'no-store',
    })
    if (!res.ok) {
      console.error('fal image failed:', res.status, await res.text())
      return null
    }
    const data = (await res.json()) as {
      images?: { url?: string }[]
      image?: { url?: string }
    }
    return data.images?.[0]?.url ?? data.image?.url ?? null
  } catch (err) {
    console.error('fal image error:', err)
    return null
  }
}
