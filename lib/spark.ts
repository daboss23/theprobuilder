// SPARK — Creative Intelligence. Studies winning creatives (ads, UGC, founder
// videos, testimonials) and extracts repeatable Creative DNA — patterns, not
// files. The DNA is stored back into the knowledge layer as `creative` chunks so
// OPUS can retrieve "what has already worked" on future runs.

import Anthropic from '@anthropic-ai/sdk'
import { ingestKnowledge, type IngestResult } from '@/lib/knowledge'
import { parseModelJson } from '@/lib/parse'
import { INTELLIGENCE_MODEL } from '@/lib/models'

const MODEL = INTELLIGENCE_MODEL

// The repeatable pattern categories SPARK classifies winning creatives into.
export const CREATIVE_PATTERNS = [
  'Member Win',
  'Identity Shift',
  'Profit Leak',
  'Authority Builder',
  'Event Promotion',
  'Founder Story',
  'Problem Agitation',
  'Systems Transformation',
  'Time Freedom',
  'Leadership Evolution',
] as const

export interface CreativeDNA {
  hook: string
  opening: string
  storyStructure: string
  ctaStructure: string
  editingStyle: string
  offerPresentation: string
  visualStyle: string
  patternType: string
  creativeCategory: string
  summary: string
}

export interface SparkSource {
  url?: string
  platform?: string
  title?: string
}

function heuristicDNA(text: string): CreativeDNA {
  const firstLine = text.split('\n').map((l) => l.trim()).find(Boolean)?.slice(0, 140) ?? 'Winning creative'
  const t = text.toLowerCase()
  const patternType =
    /profit|margin|leak/.test(t)
      ? 'Profit Leak'
      : /time|freedom|hours|weekend|family/.test(t)
        ? 'Time Freedom'
        : /system|process|sop|chaos/.test(t)
          ? 'Systems Transformation'
          : /member|client|result|case study/.test(t)
            ? 'Member Win'
            : /founder|story|journey/.test(t)
              ? 'Founder Story'
              : 'Authority Builder'
  return {
    hook: firstLine,
    opening: 'Pattern interrupt → relatable builder scene.',
    storyStructure: 'Problem → turning point → transformation → proof.',
    ctaStructure: 'Soft qualifying CTA to the next step.',
    editingStyle: 'Fast-cut, captioned, mobile-first.',
    offerPresentation: 'Outcome-led, proof-backed.',
    visualStyle: 'On-site, high-contrast, authentic.',
    patternType,
    creativeCategory: patternType,
    summary: firstLine,
  }
}

// Extract Creative DNA from a creative's transcript/description/notes. Never
// throws — falls back to a heuristic read so the platform always works.
export async function extractCreativeDNA(text: string): Promise<CreativeDNA> {
  const trimmed = text.trim()
  if (!process.env.ANTHROPIC_API_KEY || trimmed.length < 40) {
    return heuristicDNA(trimmed)
  }

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 700,
      system: `You are SPARK, the Creative Intelligence layer for The Professional Builder (coaching for trades/construction business owners). Study the winning creative below and extract its repeatable Creative DNA — the structure, not the words. Classify patternType as ONE of: ${CREATIVE_PATTERNS.join(', ')}. Reply with ONLY a JSON object, no prose.`,
      messages: [
        {
          role: 'user',
          content: `Winning creative (transcript / description / notes):\n"""${trimmed.slice(0, 6000)}"""\n\nReturn JSON with exactly these keys, each a tight phrase:\n{"hook":"...","opening":"...","storyStructure":"...","ctaStructure":"...","editingStyle":"...","offerPresentation":"...","visualStyle":"...","patternType":"...","creativeCategory":"...","summary":"..."}`,
        },
      ],
    })
    const out = response.content.find((b): b is Anthropic.TextBlock => b.type === 'text')?.text ?? ''
    const parsed = parseModelJson<Partial<CreativeDNA>>(out)
    const fb = heuristicDNA(trimmed)
    return {
      hook: parsed.hook || fb.hook,
      opening: parsed.opening || fb.opening,
      storyStructure: parsed.storyStructure || fb.storyStructure,
      ctaStructure: parsed.ctaStructure || fb.ctaStructure,
      editingStyle: parsed.editingStyle || fb.editingStyle,
      offerPresentation: parsed.offerPresentation || fb.offerPresentation,
      visualStyle: parsed.visualStyle || fb.visualStyle,
      patternType: parsed.patternType || fb.patternType,
      creativeCategory: parsed.creativeCategory || parsed.patternType || fb.creativeCategory,
      summary: parsed.summary || fb.summary,
    }
  } catch (err) {
    console.error('SPARK DNA extraction failed, using heuristic:', err)
    return heuristicDNA(trimmed)
  }
}

// Persist extracted Creative DNA into the knowledge layer as a `creative` chunk.
export async function storeCreativeDNA(
  dna: CreativeDNA,
  source: SparkSource,
  builderId: string | null = null,
): Promise<IngestResult> {
  const title = source.title?.trim() || dna.summary.slice(0, 80) || `Creative DNA — ${dna.patternType}`
  const content = [
    `Pattern: ${dna.patternType}`,
    `Category: ${dna.creativeCategory}`,
    `Hook: ${dna.hook}`,
    `Opening: ${dna.opening}`,
    `Story structure: ${dna.storyStructure}`,
    `CTA structure: ${dna.ctaStructure}`,
    `Editing style: ${dna.editingStyle}`,
    `Offer presentation: ${dna.offerPresentation}`,
    `Visual style: ${dna.visualStyle}`,
    source.url ? `Source: ${source.url}` : '',
  ]
    .filter(Boolean)
    .join('\n')

  return ingestKnowledge({
    system: 'creative',
    category: dna.patternType,
    title,
    content,
    builderId,
    metadata: { source: 'spark', platform: source.platform ?? null, url: source.url ?? null },
  })
}
