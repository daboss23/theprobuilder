// Voyage AI embeddings — Anthropic's recommended pairing for retrieval.
// `voyage-3` returns 1024-dimensional vectors (matches the pgvector schema).

const VOYAGE_URL = 'https://api.voyageai.com/v1/embeddings'
const VOYAGE_MODEL = 'voyage-3'

export const EMBED_DIM = 1024

export function hasEmbeddings(): boolean {
  return Boolean(process.env.VOYAGE_API_KEY)
}

interface VoyageResponse {
  data: { embedding: number[]; index: number }[]
}

/**
 * Embed one or more texts. `inputType` lets Voyage optimise differently for the
 * stored documents vs the live search query.
 */
export async function embed(
  texts: string[],
  inputType: 'document' | 'query' = 'document',
): Promise<number[][]> {
  const key = process.env.VOYAGE_API_KEY
  if (!key) throw new Error('VOYAGE_API_KEY is not configured')
  if (texts.length === 0) return []

  // Voyage's free tier is rate-limited (3 RPM / 10K TPM). Retry a couple of
  // times on 429 / 5xx with a short backoff so a transient burst doesn't fail
  // the whole request. Kept short to stay within the serverless time budget.
  const maxAttempts = 3
  let lastDetail = ''
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const res = await fetch(VOYAGE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({ model: VOYAGE_MODEL, input: texts, input_type: inputType }),
    })

    if (res.ok) {
      const json = (await res.json()) as VoyageResponse
      return json.data.sort((a, b) => a.index - b.index).map((d) => d.embedding)
    }

    lastDetail = await res.text().catch(() => '')
    const retryable = res.status === 429 || res.status >= 500
    if (!retryable || attempt === maxAttempts) {
      throw new Error(`Voyage embeddings failed (${res.status}): ${lastDetail.slice(0, 200)}`)
    }
    // Backoff: 1.5s, then 3s.
    await new Promise((r) => setTimeout(r, attempt * 1500))
  }

  // Unreachable, but keeps TypeScript's control-flow analysis happy.
  throw new Error(`Voyage embeddings failed: ${lastDetail.slice(0, 200)}`)
}

export async function embedOne(
  text: string,
  inputType: 'document' | 'query' = 'query',
): Promise<number[]> {
  const [vec] = await embed([text], inputType)
  return vec
}
