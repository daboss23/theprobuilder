import { getOpenAI } from '@/lib/openai'
import type { AspectRatio } from './types'

/**
 * OpenAI GPT Image still creative. Returns a URL or base64 data URL. Never
 * throws on a missing key / failure — returns null so the copy stays usable.
 */

export function openaiImageConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY)
}

// GPT Image accepts square / portrait / landscape sizes — map our aspect ratios.
const SIZE: Record<AspectRatio, '1024x1024' | '1024x1536' | '1536x1024'> = {
  '1:1': '1024x1024',
  '9:16': '1024x1536',
  '16:9': '1536x1024',
}

export interface OpenAIImageResult {
  url: string | null
  error?: string
}

export async function generateOpenAIImage(
  prompt: string,
  aspectRatio: AspectRatio = '1:1',
): Promise<OpenAIImageResult> {
  if (!openaiImageConfigured()) return { url: null, error: 'OPENAI_API_KEY is not set' }
  if (!prompt) return { url: null, error: 'Empty prompt' }
  try {
    const response = await getOpenAI().images.generate({
      model: 'gpt-image-1',
      prompt,
      size: SIZE[aspectRatio] ?? SIZE['1:1'],
      quality: 'high',
      n: 1,
    })
    const data = response.data?.[0]
    const url = data?.url || (data?.b64_json ? `data:image/png;base64,${data.b64_json}` : null)
    return { url, error: url ? undefined : 'OpenAI returned no image' }
  } catch (err) {
    console.error('OpenAI image error:', err)
    return { url: null, error: `OpenAI: ${err instanceof Error ? err.message : 'request failed'}` }
  }
}
