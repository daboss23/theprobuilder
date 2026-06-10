import { NextRequest, NextResponse } from 'next/server'
import { ingestKnowledge, type KnowledgeSystem } from '@/lib/knowledge'

export const runtime = 'nodejs'
export const maxDuration = 60

const VALID_SYSTEMS: KnowledgeSystem[] = [
  'vault',
  'research',
  'transformation',
  'creative',
  'copy',
  'pattern',
  'learning',
]

// Ingest a piece of Knowledge Vault content: chunk it, embed each chunk via
// Voyage, and store the vectors in Supabase for retrieval by the Reactor.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, content } = body as { title?: string; content?: string }
    const system = (body.system as KnowledgeSystem) ?? 'vault'

    if (!title || !content) {
      return NextResponse.json(
        { success: false, error: 'title and content are required' },
        { status: 400 },
      )
    }
    if (!VALID_SYSTEMS.includes(system)) {
      return NextResponse.json(
        { success: false, error: `system must be one of: ${VALID_SYSTEMS.join(', ')}` },
        { status: 400 },
      )
    }

    const result = await ingestKnowledge({
      system,
      title,
      content,
      category: body.category ?? null,
      builderId: body.builderId ?? null,
      metadata: body.metadata ?? {},
    })

    return NextResponse.json({ success: true, ...result })
  } catch (err) {
    console.error('Vault ingest error:', err)
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Ingest failed' },
      { status: 500 },
    )
  }
}
