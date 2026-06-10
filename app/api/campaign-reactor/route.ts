import Anthropic from '@anthropic-ai/sdk'
import { NextRequest } from 'next/server'
import { searchKnowledge, type KnowledgeSystem } from '@/lib/knowledge'
import { learnings } from '@/lib/reactor-data'

export const runtime = 'nodejs'
export const maxDuration = 60

// The orchestrator brain. Opus for strategy-grade reasoning over the retrieved
// knowledge; high-volume copy can move to Sonnet later.
const ORCHESTRATOR_MODEL = 'claude-opus-4-8'
const MAX_TURNS = 8

interface ReactorRequest {
  angle: string
  inputs?: string[]
  outputs?: string[]
  builderId?: string | null
}

interface Concept {
  type: string
  text: string
  basis?: string
  learningCheck?: string
  score?: number
}

/* ------------------------------ SSE plumbing ------------------------------ */

function sse(controller: ReadableStreamDefaultController, event: unknown) {
  controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(event)}\n\n`))
}

/* --------------------------------- Tools ---------------------------------- */

const tools: Anthropic.Tool[] = [
  {
    name: 'search_knowledge',
    description:
      "Search The Professional Builder's knowledge layer (20+ years of winning ads, hooks, frameworks, member transformations, research, and documented learnings). Call this repeatedly to pull the evidence you need before drafting. Optionally scope to one intelligence system.",
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'What to retrieve, in natural language' },
        system: {
          type: 'string',
          enum: ['research', 'transformation', 'creative', 'copy', 'pattern', 'learning'],
          description: 'Optional: restrict to one intelligence system',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_learnings',
    description:
      'Retrieve the documented Creative Learnings — the rubric of what consistently works for TPB. Call this before submitting so you can self-score each concept against proven principles.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'submit_concepts',
    description:
      'Submit the final campaign concepts once you have gathered evidence AND self-scored each concept against the Creative Learnings rubric (call get_learnings first). Each concept must cite its evidence and pass the rubric check.',
    input_schema: {
      type: 'object',
      properties: {
        concepts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', description: 'Output type, e.g. Hook, Headline, Founder Concept' },
              text: { type: 'string' },
              basis: { type: 'string', description: 'Which winning asset / pattern / learning this draws from' },
              learningCheck: {
                type: 'string',
                description: 'How this concept satisfies the Creative Learnings rubric (e.g. "uses a specific profit figure; founder-led")',
              },
              score: {
                type: 'integer',
                description: 'Self-assessed strength 1-10 against the learnings rubric. Only submit concepts scoring 7+.',
              },
            },
            required: ['type', 'text'],
          },
        },
      },
      required: ['concepts'],
    },
  },
]

function systemPrompt(outputs: string[]): string {
  return `You are the Campaign Reactor — the orchestrator of The Professional Builder's Creative Intelligence Command Center.

Your job: design the next winning campaign based on everything that has already worked for TPB.

Process — follow it like an engineer, not a copywriter guessing:
1. Use search_knowledge to pull the relevant research (pain points, desires, objections), member transformations, winning creatives, top-performing copy, repeatable patterns, and documented learnings for the requested angle. Make several focused searches across systems.
2. Ground every concept in retrieved evidence. Specific member numbers and named patterns beat vague claims.
3. Before submitting, call get_learnings and score every concept against that rubric. Revise or drop anything scoring below 7. Record the rubric check and score on each concept.
4. Call submit_concepts exactly once with concepts ONLY for these requested output types: ${outputs.join(', ')}.

Voice: confident, specific, builder-native. Engineered for performance.`
}

/* --------------------------- Demo fallback flow --------------------------- */

async function runDemo(
  controller: ReadableStreamDefaultController,
  body: ReactorRequest,
) {
  const outputs = body.outputs ?? ['Hook', 'Headline', 'Campaign Concept']
  sse(controller, { type: 'step', text: 'Reactor online (demo mode — no ANTHROPIC_API_KEY set)' })

  const systems: KnowledgeSystem[] = ['research', 'transformation', 'pattern', 'copy', 'learning']
  const gathered: string[] = []
  for (const system of systems) {
    sse(controller, { type: 'step', text: `Retrieving ${system} intelligence for "${body.angle}"…` })
    const hits = await searchKnowledge(body.angle, { system, k: 2 })
    for (const h of hits) {
      gathered.push(`${h.title}: ${h.content}`)
      sse(controller, { type: 'retrieval', system, title: h.title })
    }
  }

  sse(controller, { type: 'step', text: 'Synthesizing concepts from retrieved evidence…' })
  const a = body.angle
  const al = a.toLowerCase()
  const pool: Concept[] = [
    { type: 'Hook', text: `Most builders don't have a ${al} problem. They have a ${al} leak hiding in plain sight.`, basis: 'Profit Pattern + research pain points', learningCheck: 'Specific, contrarian framing', score: 9 },
    { type: 'Headline', text: `From struggling to systemized — how ${a} became TPB's unfair advantage.`, basis: 'Transformation Intelligence (member wins)', learningCheck: 'Transformation arc over feature messaging', score: 8 },
    { type: 'Primary Text', text: `You didn't get into building to babysit jobs. This is the ${a} system that gave 500+ builders their margin — and their weekends — back.`, basis: 'Member transformations + Time Freedom pattern', learningCheck: 'Concrete proof (500+ builders)', score: 8 },
    { type: 'VSL Opener', text: `In the next few minutes I'll show you the exact ${a} mechanism most builders never see until it's too late.`, basis: 'VSL framework', learningCheck: 'Mechanism + curiosity', score: 7 },
    { type: 'Static Concept', text: `Dark background, one bold profit figure, named member underneath, single cyan accent. Angle: ${a}.`, basis: 'Creative Intelligence: Static Proof Ad', learningCheck: 'Specific $ numbers outperform vague claims', score: 9 },
    { type: 'Video Concept', text: `Founder direct-to-camera on-site: 1.5s pattern interrupt, contrarian ${al} belief, member proof, soft CTA.`, basis: 'Creative Intelligence: Founder Video (71% win)', learningCheck: 'Founder videos outperform talking heads', score: 9 },
    { type: 'Founder Concept', text: `Handheld walk-through of a finished site while the founder breaks down the ${a} turning point.`, basis: 'Creative Intelligence: Founder Video (71% win)', learningCheck: 'Founder-led, on-site, real proof', score: 9 },
    { type: 'Testimonial Concept', text: `Member states old hours/margin, the ${al} turning point, then the after. B-roll of their jobs.`, basis: 'Transformation Intelligence', learningCheck: 'Named member win over generic promise', score: 8 },
    { type: 'Event Concept', text: `High-energy room montage tied to one ${a} insight and community proof.`, basis: 'Authority Pattern', learningCheck: 'Community proof', score: 7 },
    { type: 'Campaign Concept', text: `The ${a} Reactor: founder video + static proof ad + member testimonial, sequenced cold → warm → apply.`, basis: 'Strategic Recommendation', learningCheck: 'Stacks the three highest-win formats', score: 9 },
  ]
  sse(controller, { type: 'step', text: 'Scoring concepts against the Creative Learnings rubric…' })
  // Match the plural chip labels (e.g. "Static Concepts") against singular
  // concept types (e.g. "Static Concept").
  const norm = (s: string) => s.toLowerCase().replace(/s$/, '').trim()
  const wanted = outputs.map(norm)
  for (const c of pool.filter((c) => wanted.includes(norm(c.type)) && (c.score ?? 0) >= 7)) {
    sse(controller, { type: 'concept', concept: c })
  }
  sse(controller, { type: 'done' })
}

/* -------------------------------- Handler --------------------------------- */

export async function POST(request: NextRequest) {
  const body = (await request.json()) as ReactorRequest
  const outputs = body.outputs ?? ['Hook', 'Headline', 'Campaign Concept']

  const stream = new ReadableStream({
    async start(controller) {
      try {
        if (!process.env.ANTHROPIC_API_KEY) {
          await runDemo(controller, body)
          controller.close()
          return
        }

        const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
        sse(controller, { type: 'step', text: 'Reactor online. Planning retrieval…' })

        const messages: Anthropic.MessageParam[] = [
          {
            role: 'user',
            content: `Design campaign concepts for the "${body.angle}" angle. Active intelligence inputs: ${(body.inputs ?? []).join(', ') || 'all'}. Requested output types: ${outputs.join(', ')}.`,
          },
        ]

        for (let turn = 0; turn < MAX_TURNS; turn++) {
          const response = await anthropic.messages.create({
            model: ORCHESTRATOR_MODEL,
            max_tokens: 4000,
            system: systemPrompt(outputs),
            tools,
            messages,
          })

          messages.push({ role: 'assistant', content: response.content })

          const toolUses = response.content.filter(
            (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use',
          )

          if (toolUses.length === 0) break

          const submit = toolUses.find((t) => t.name === 'submit_concepts')
          if (submit) {
            const concepts = (submit.input as { concepts?: Concept[] }).concepts ?? []
            for (const c of concepts) sse(controller, { type: 'concept', concept: c })
            sse(controller, { type: 'done' })
            controller.close()
            return
          }

          const results: Anthropic.ToolResultBlockParam[] = []
          for (const tu of toolUses) {
            if (tu.name === 'get_learnings') {
              sse(controller, { type: 'step', text: 'Loading Creative Learnings rubric for self-critique…' })
              results.push({
                type: 'tool_result',
                tool_use_id: tu.id,
                content: learnings
                  .map((l) => `• ${l.insight} — ${l.recommendation} (evidence: ${l.evidence})`)
                  .join('\n'),
              })
            } else if (tu.name === 'search_knowledge') {
              const { query, system } = tu.input as { query: string; system?: KnowledgeSystem }
              sse(controller, { type: 'step', text: `Searching ${system ?? 'all systems'}: "${query}"` })
              const hits = await searchKnowledge(query, { system, k: 6, builderId: body.builderId ?? null })
              for (const h of hits.slice(0, 4)) {
                sse(controller, { type: 'retrieval', system: h.system, title: h.title })
              }
              results.push({
                type: 'tool_result',
                tool_use_id: tu.id,
                content: hits.length
                  ? hits.map((h) => `[${h.system}] ${h.title}: ${h.content}`).join('\n\n')
                  : 'No matching knowledge found.',
              })
            } else {
              results.push({ type: 'tool_result', tool_use_id: tu.id, content: 'Unknown tool', is_error: true })
            }
          }
          messages.push({ role: 'user', content: results })
        }

        sse(controller, { type: 'step', text: 'Reactor reached its turn limit without submitting concepts.' })
        sse(controller, { type: 'done' })
        controller.close()
      } catch (err) {
        console.error('Campaign Reactor error:', err)
        sse(controller, {
          type: 'error',
          message: err instanceof Error ? err.message : 'Reactor failed',
        })
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}
