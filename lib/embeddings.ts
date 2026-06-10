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

  const res = await fetch(VOYAGE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({ model: VOYAGE_MODEL, input: texts, input_type: inputType }),
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`Voyage embeddings failed (${res.status}): ${detail.slice(0, 200)}`)
  }

  const json = (await res.json()) as VoyageResponse
  return json.data.sort((a, b) => a.index - b.index).map((d) => d.embedding)
}

export async function embedOne(
  text: string,
  inputType: 'document' | 'query' = 'query',
): Promise<number[]> {
  const [vec] = await embed([text], inputType)
  return vec
}
