import OpenAI from 'openai'

let client: OpenAI | null = null

/**
 * Lazily construct the OpenAI client. Done on first use (not at module load)
 * so the app can build and the homepage can render without an API key set —
 * the key is only required when an OpenAI route is actually called.
 */
export function getOpenAI(): OpenAI {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured')
  }
  if (!client) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }
  return client
}
