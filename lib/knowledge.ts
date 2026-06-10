// Knowledge layer for the Reactor: chunk + ingest Vault content into the
// pgvector store, and retrieve it for the agent. Everything degrades gracefully —
// if Supabase or Voyage isn't configured, retrieval falls back to the curated
// demo intelligence so the platform still works end to end.

import { getSupabaseAdmin } from '@/lib/supabase'
import { embed, embedOne, hasEmbeddings } from '@/lib/embeddings'
import {
  patterns,
  topHooks,
  topHeadlines,
  topOffers,
  transformations,
  learnings,
  researchOutputs,
  creativeAnalyses,
} from '@/lib/reactor-data'

export type KnowledgeSystem =
  | 'vault'
  | 'research'
  | 'transformation'
  | 'creative'
  | 'copy'
  | 'pattern'
  | 'learning'

export interface KnowledgeHit {
  system: string
  category: string | null
  title: string
  content: string
  similarity: number
}

/* -------------------------------- Chunking -------------------------------- */

// Split long text into ~1,000-char chunks on paragraph boundaries.
export function chunkText(text: string, maxChars = 1000): string[] {
  const paras = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
  const chunks: string[] = []
  let current = ''
  for (const p of paras) {
    if ((current + '\n\n' + p).length > maxChars && current) {
      chunks.push(current)
      current = p
    } else {
      current = current ? `${current}\n\n${p}` : p
    }
  }
  if (current) chunks.push(current)
  return chunks.length ? chunks : [text.slice(0, maxChars)]
}

function dbReady(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) && hasEmbeddings()
}

/* -------------------------------- Ingest ---------------------------------- */

export interface IngestInput {
  system: KnowledgeSystem
  title: string
  content: string
  category?: string | null
  builderId?: string | null
  metadata?: Record<string, unknown>
}

export interface IngestResult {
  ok: boolean
  chunks: number
  stored: boolean
  reason?: string
}

export async function ingestKnowledge(input: IngestInput): Promise<IngestResult> {
  const chunks = chunkText(input.content)

  if (!dbReady()) {
    return { ok: true, chunks: chunks.length, stored: false, reason: 'Vector store not configured' }
  }

  const vectors = await embed(chunks, 'document')
  const rows = chunks.map((content, i) => ({
    system: input.system,
    category: input.category ?? null,
    title: input.title,
    content,
    builder_id: input.builderId ?? null,
    metadata: input.metadata ?? {},
    embedding: vectors[i],
  }))

  const { error } = await getSupabaseAdmin().from('knowledge_chunks').insert(rows)
  if (error) throw error

  return { ok: true, chunks: chunks.length, stored: true }
}

/* ------------------------------- Retrieval -------------------------------- */

export async function searchKnowledge(
  query: string,
  opts: { k?: number; system?: KnowledgeSystem; builderId?: string | null } = {},
): Promise<KnowledgeHit[]> {
  const k = opts.k ?? 8

  if (dbReady()) {
    try {
      const queryEmbedding = await embedOne(query, 'query')
      const { data, error } = await getSupabaseAdmin().rpc('match_knowledge', {
        query_embedding: queryEmbedding,
        match_count: k,
        filter_system: opts.system ?? null,
        filter_builder: opts.builderId ?? null,
      })
      if (error) throw error
      if (data && data.length) {
        return (data as KnowledgeHit[]).map((d) => ({
          system: d.system,
          category: d.category ?? null,
          title: d.title,
          content: d.content,
          similarity: d.similarity,
        }))
      }
    } catch (err) {
      console.error('Vector search failed, using demo knowledge:', err)
    }
  }

  return demoSearch(query, k, opts.system)
}

/* ----------------------- Demo fallback knowledge -------------------------- */
// Builds a corpus from the curated intelligence so retrieval works without a DB.

interface Doc {
  system: string
  category: string
  title: string
  content: string
}

let demoCorpus: Doc[] | null = null

function buildDemoCorpus(): Doc[] {
  if (demoCorpus) return demoCorpus
  const docs: Doc[] = []

  for (const p of patterns) {
    docs.push({
      system: 'pattern',
      category: p.name,
      title: p.name,
      content: `Hook: ${p.hook}. Headline: ${p.headline}. Creative style: ${p.creativeStyle}. Transformation: ${p.transformation}. Offer: ${p.offer}. CTA: ${p.cta}. Notes: ${p.notes}`,
    })
  }
  for (const h of [...topHooks, ...topHeadlines, ...topOffers]) {
    docs.push({ system: 'copy', category: h.angle, title: h.text, content: `${h.text} (${h.metric}, angle: ${h.angle})` })
  }
  for (const t of transformations) {
    docs.push({
      system: 'transformation',
      category: t.type,
      title: t.member,
      content: `${t.member} — ${t.type}. Emotional: ${t.emotional}. Financial: ${t.financial}. Identity: ${t.identity}. Angles: ${t.angles.join(', ')}`,
    })
  }
  for (const l of learnings) {
    docs.push({ system: 'learning', category: 'Creative Learning', title: l.insight, content: `${l.insight} Evidence: ${l.evidence} Recommendation: ${l.recommendation}` })
  }
  for (const r of researchOutputs) {
    docs.push({ system: 'research', category: r.type, title: r.type, content: `${r.type}: ${r.items.join('; ')}` })
  }
  for (const c of creativeAnalyses) {
    docs.push({
      system: 'creative',
      category: c.type,
      title: c.type,
      content: `${c.type} (${c.winRate}% win). Structure: ${c.structure}. Visual: ${c.visualStyle}. Opening: ${c.opening}. CTA: ${c.cta}`,
    })
  }

  demoCorpus = docs
  return docs
}

function demoSearch(query: string, k: number, system?: KnowledgeSystem): KnowledgeHit[] {
  const terms = query.toLowerCase().split(/\W+/).filter((t) => t.length > 2)
  const corpus = buildDemoCorpus().filter((d) => !system || d.system === system)

  const scored = corpus.map((d) => {
    const hay = `${d.title} ${d.content} ${d.category}`.toLowerCase()
    let score = 0
    for (const t of terms) if (hay.includes(t)) score += 1
    return { d, score }
  })

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map(({ d, score }) => ({
      system: d.system,
      category: d.category,
      title: d.title,
      content: d.content,
      similarity: terms.length ? score / terms.length : 0,
    }))
}
