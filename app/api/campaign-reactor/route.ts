import Anthropic from '@anthropic-ai/sdk'
import { NextRequest } from 'next/server'
import { searchKnowledge } from '@/lib/knowledge'
import { learnings } from '@/lib/reactor-data'
import { INTELLIGENCE, INTELLIGENCE_IDS, isIntelligenceId, type IntelligenceId } from '@/lib/agents'
import { generateImageWith, imageConfigured, listImageModels, type AspectRatio } from '@/lib/image'
import {
  startVideoJob,
  listVideoModels,
  videoConfigured,
  type GenMode,
} from '@/lib/video'
import { logGeneration } from '@/lib/video/persistence'
import { outputTypeOptions, type ReactorInputs, type ProductionBrief } from '@/lib/reactor-inputs'

export const runtime = 'nodejs'
export const maxDuration = 300

// OPUS — the Master Strategist brain (strategy + synthesis) — and the cheaper
// model the intelligence layers (ATLAS/NOVA/SPARK/ECHO/ORACLE) run on.
const OPUS_MODEL = 'claude-opus-4-8'
const INTELLIGENCE_MODEL = 'claude-sonnet-4-6'
const MAX_TURNS = 12

// MCP connector (Messages API) beta — lets the coordinator call remote MCP
// tools (Meta Ads) that Anthropic executes server-side.
const MCP_BETA = 'mcp-client-2025-11-20'
const META_ADS_MCP_NAME = 'meta_ads'

interface ReactorRequest {
  angle: string
  inputs?: string[]
  outputs?: string[]
  builderId?: string | null
  videoModel?: string | null
  imageModel?: string | null
  reactorInputs?: ReactorInputs
}

interface Concept {
  type: string
  text: string
  basis?: string
  learningCheck?: string
  score?: number
  imageUrl?: string
  productionBrief?: ProductionBrief
}

/* ------------------------------ Meta Ads MCP ------------------------------ */

// Pipeboard's hosted Meta Ads MCP. Token auth via the documented `?token=`
// query param. Returns null (Meta Ads simply unavailable) when unconfigured.
function metaAdsServer(): Anthropic.Beta.Messages.BetaRequestMCPServerURLDefinition | null {
  const token = process.env.PIPEBOARD_API_TOKEN
  const baseUrl = process.env.META_ADS_MCP_URL || 'https://meta-ads.mcp.pipeboard.co/'
  if (!token && !process.env.META_ADS_MCP_URL) return null
  const url = token
    ? `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}token=${encodeURIComponent(token)}`
    : baseUrl
  return { type: 'url', name: META_ADS_MCP_NAME, url }
}

/* ------------------------------ SSE plumbing ------------------------------ */

function sse(controller: ReadableStreamDefaultController, event: unknown) {
  controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(event)}\n\n`))
}

/* ------------------------------ Resilience -------------------------------- */

// Anthropic occasionally returns 429 (rate limit) or 529 (overloaded). These are
// transient — retry with exponential backoff instead of failing the whole run.
async function withRetry<T>(
  fn: () => Promise<T>,
  onRetry?: (attempt: number, waitMs: number) => void,
): Promise<T> {
  const MAX = 4
  let lastErr: unknown
  for (let attempt = 0; attempt <= MAX; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastErr = err
      const status = (err as { status?: number })?.status
      const retriable = status === 429 || status === 500 || status === 503 || status === 529
      if (!retriable || attempt === MAX) throw err
      const wait = 1000 * 2 ** attempt // 1s, 2s, 4s, 8s
      onRetry?.(attempt + 1, wait)
      await new Promise((r) => setTimeout(r, wait))
    }
  }
  throw lastErr
}

/* --------------------------------- Tools ---------------------------------- */

function buildTools(
  useImage: boolean,
  useVideo: boolean,
  useMetaAds: boolean,
): Anthropic.Beta.Messages.BetaToolUnion[] {
  const videoModelIds = listVideoModels()
    .filter((m) => m.configured)
    .map((m) => m.id)
  const imageModelIds = listImageModels()
    .filter((m) => m.configured)
    .map((m) => m.id)
  const tools: Anthropic.Beta.Messages.BetaToolUnion[] = [
    {
      name: 'consult_intelligence',
      description:
        'Delegate a focused question to one of your intelligence layers. Each one searches its slice of the knowledge layer and reports findings. Always consult nova (market) and oracle (pattern), plus at least one of spark/echo, before drafting concepts.',
      input_schema: {
        type: 'object',
        properties: {
          layer: {
            type: 'string',
            enum: INTELLIGENCE_IDS,
            description:
              'atlas = frameworks/SOPs/knowledge assets; nova = market pains/desires/objections/transformations; spark = winning creative structures & Creative DNA; echo = hooks/headlines/offers & Copy DNA; oracle = winning/losing patterns & strategic memory',
          },
          question: { type: 'string', description: 'The focused question for that intelligence layer' },
        },
        required: ['layer', 'question'],
      },
    },
    {
      name: 'get_learnings',
      description:
        'Retrieve the documented Creative Learnings rubric. Call this before submitting so you can self-score each concept against proven principles.',
      input_schema: { type: 'object', properties: {} },
    },
  ]

  if (useImage) {
    tools.push({
      name: 'generate_image',
      description:
        'Generate a still ad creative for a visual concept (e.g. Static Concept, Founder Concept, Campaign Concept). Returns the image URL, which also appears on the concept card in the Reactor. Call this for visual concepts before submitting them, and pass the imageUrl into that concept.',
      input_schema: {
        type: 'object',
        properties: {
          prompt: { type: 'string', description: 'A vivid, specific image prompt for the creative.' },
          conceptType: { type: 'string', description: 'The output type this image is for (must match the concept type you will submit).' },
          model: {
            type: 'string',
            enum: imageModelIds.length ? imageModelIds : ['fal-flux'],
            description:
              'Image model: fal-flux = photoreal humans/scenes in-house via fal; higgsfield-soul = premium photographic ad look.',
          },
          aspectRatio: { type: 'string', enum: ['1:1', '9:16', '16:9'], description: 'Defaults to 1:1.' },
        },
        required: ['prompt', 'conceptType'],
      },
    })
  }

  if (useVideo) {
    tools.push({
      name: 'generate_video',
      description:
        'Generate a high-quality video clip for a visual concept (Video Concept, Founder Concept, Testimonial Concept). Two modes: text-to-video (describe the full scene — e.g. a real builder on-site, a person speaking to camera) needs only a prompt; image-to-video animates a still from generate_image (pass its imageUrl). Choose the model best suited to the shot. The clip renders asynchronously and appears on the concept card when ready.',
      input_schema: {
        type: 'object',
        properties: {
          mode: {
            type: 'string',
            enum: ['text-to-video', 'image-to-video'],
            description: 'text-to-video for a described scene; image-to-video to animate a generated still.',
          },
          prompt: { type: 'string', description: 'Scene or motion direction. Required for text-to-video.' },
          imageUrl: { type: 'string', description: 'Source still from generate_image. Required for image-to-video.' },
          model: {
            type: 'string',
            enum: videoModelIds.length ? videoModelIds : ['seedance-2.0'],
            description:
              'Model to render with. seedance-2.0 = cinematic realism/B-roll with native synchronized audio (up to 15s); seedance-2.0-fast = same with lower latency/cost for volume; kling-2.5 = UGC motion; veo-3 = people speaking with native audio; wan-2.5 = high-volume/budget; higgsfield-dop = animate a still.',
          },
          aspectRatio: { type: 'string', enum: ['1:1', '9:16', '16:9'], description: 'Defaults to 9:16.' },
          conceptType: { type: 'string', description: 'The output type this video is for (must match the concept type you will submit).' },
        },
        required: ['mode', 'conceptType'],
      },
    })
  }

  tools.push({
    name: 'submit_concepts',
    description:
      'Submit the final campaign concepts once your intelligence network has reported AND you have self-scored each concept against the Creative Learnings rubric. Each concept must cite its evidence and pass the rubric. Include imageUrl for any concept you generated a creative for.',
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
              basis: { type: 'string', description: 'Which intelligence layer / asset / pattern this draws from' },
              learningCheck: { type: 'string', description: 'How it satisfies the rubric' },
              score: { type: 'integer', description: 'Self-assessed 1-10. Only submit 7+.' },
              imageUrl: { type: 'string', description: 'The Higgsfield image URL for this concept, if one was generated.' },
              productionBrief: {
                type: 'object',
                description:
                  'REQUIRED for visual concepts (Static/Video/Founder/Testimonial/Event/Campaign Concept): a frame-by-frame production plan. Image and video are generated from this brief.',
                properties: {
                  creativeType: { type: 'string' },
                  pattern: { type: 'string', description: 'e.g. Member Win, Profit Leak, Time Freedom' },
                  audience: { type: 'string' },
                  awareness: { type: 'string' },
                  frames: {
                    type: 'array',
                    description: '4-6 frames, each a beat of the creative.',
                    items: {
                      type: 'object',
                      properties: {
                        label: { type: 'string', description: 'e.g. "Frame 1", "Hook", "CTA"' },
                        description: { type: 'string', description: 'What is on screen / said in this beat.' },
                      },
                      required: ['label', 'description'],
                    },
                  },
                },
                required: ['creativeType', 'frames'],
              },
            },
            required: ['type', 'text'],
          },
        },
      },
      required: ['concepts'],
    },
  })

  if (useMetaAds) {
    tools.push({ type: 'mcp_toolset', mcp_server_name: META_ADS_MCP_NAME })
  }

  return tools
}

function coordinatorPrompt(
  outputs: string[],
  caps: {
    metaAds: boolean
    image: boolean
    video: boolean
    videoModels: string[]
    imageModels: string[]
    preferredVideoModel?: string | null
    preferredImageModel?: string | null
  },
): string {
  const metaAdsLine = caps.metaAds
    ? '\n- You also have live Meta Ads tools (meta_ads). Use them to ground concepts in what is actually performing — pull recent campaign/ad performance, top creatives, and spend before drafting.'
    : ''
  const preferredImageLine =
    caps.preferredImageModel && caps.imageModels.includes(caps.preferredImageModel)
      ? ` The user has selected the "${caps.preferredImageModel}" image model — use it unless a concept clearly needs a different one.`
      : ''
  const imageLine = caps.image
    ? `\n- For visual output types (Static Concept, Founder Concept, Campaign Concept): FIRST write a frame-by-frame production brief for the concept, THEN build the generate_image prompt FROM that brief. Available models: ${caps.imageModels.join(', ')}. Pass the concept type as conceptType, include the returned imageUrl, and attach the productionBrief to the submitted concept.${preferredImageLine}`
    : ''
  const preferredLine =
    caps.preferredVideoModel && caps.videoModels.includes(caps.preferredVideoModel)
      ? ` The user has selected the "${caps.preferredVideoModel}" model — use it for every generate_video call unless a shot clearly needs a different capability.`
      : ''
  const videoLine = caps.video
    ? `\n- For video output types (Video Concept, Founder Concept, Testimonial Concept): FIRST write a frame-by-frame production brief, THEN build the generate_video prompt FROM that brief, and attach the productionBrief to the submitted concept. Available models: ${caps.videoModels.join(', ')}. Use text-to-video to direct a full scene (e.g. a real builder on-site, a member speaking to camera — use veo-3 when they speak so it has audio; seedance-2.0 or kling-2.5 for cinematic action). Use image-to-video to animate a still from generate_image. Match conceptType to the concept you submit.${preferredLine}`
    : ''

  return `You are OPUS — the Master Strategist of The Professional Builder's Creative Intelligence Command Center. You direct an intelligence network and synthesize it into launch-ready creative.

Your intelligence network:
- ATLAS — Knowledge Intelligence: frameworks, SOPs, calls, and uploaded assets.
- NOVA — Market Intelligence: pains, desires, objections, beliefs, and member transformations.
- SPARK — Creative Intelligence: winning creative structures, openings, and Creative DNA.
- ECHO — Copy Intelligence: high-performing hooks, headlines, offers, and Copy DNA.
- ORACLE — Strategic Memory: the memory of every winning strategic configuration (angle, audience, offer, awareness, creative + copy structure) — which patterns win, which lose, and what is most likely to work next.

Process:
1. Consult your network with consult_intelligence. Always consult NOVA and ORACLE, plus at least one of SPARK/ECHO. Use their findings as evidence — don't guess.${metaAdsLine}
2. Call get_learnings and self-score every concept against that rubric. Revise or drop anything below 7.${imageLine}${videoLine}
3. Call submit_concepts exactly once, with concepts ONLY for these requested output types: ${outputs.join(', ')}. Each concept cites which intelligence layer its evidence came from.

Voice: confident, specific, builder-native. Engineered for performance.`
}

/* --------------------- Reactor modal input → prompt ----------------------- */

const SOPHISTICATION_BLOCK =
  'MARKET SOPHISTICATION: This is a highly sophisticated market. Direct claims and basic mechanism claims are exhausted. Differentiate through a named proprietary mechanism, a contrarian angle, or identification so precise the prospect feels seen. Avoid generic claims any competitor could make. If the Vault contains Unique Mechanism documents, retrieve the most relevant one for this angle and awareness stage and anchor the concept on it.'

const INTELLIGENCE_BLOCK =
  'INTELLIGENCE NETWORK: Use your judgment to select which intelligence layers to consult (via consult_intelligence) based on the campaign angle, audience type, and brief. You are not restricted to specific layers — query whichever will give you the most relevant evidence for this run.'

const COMPLIANCE_BLOCK = `HARD COMPLIANCE CONSTRAINTS — these override all creative instructions:
- Attribute every income or results figure to a named individual as THEIR result. Never imply typical or guaranteed outcomes for the viewer.
- Never use: "guaranteed", "you will make", "passive income", "get rich", "earn from home".
- Where a concept references a member result, it must carry: "Results are individual and not typical. Building a business involves risk."
- Reject and rewrite any concept of your own that violates these constraints before calling submit_concepts.`

const BLOCK_SEP = '\n\n─────────────────────────────────────────────\n\n'

// Build the ordered injection blocks from the modal inputs. Order is fixed:
// brief → angle → awareness → audience → sophistication → offer → outputs →
// intelligence systems → on-brand → compliance (always last, overrides all).
function buildInputBlocks(inputs: ReactorInputs | undefined): string {
  // No guided inputs → classic left-panel run: leave the prompt exactly as it
  // was so the existing agent behaviour is untouched.
  if (!inputs) return ''

  const parts: string[] = []

  if (inputs) {
    // Block 1 — Campaign Brief (only when provided)
    if (inputs.brief?.trim()) {
      parts.push(
        `CAMPAIGN BRIEF (human director's intent — read this first and let it shape every creative decision):\n${inputs.brief.trim()}`,
      )
    }

    // Block 2 — Angle
    parts.push(
      `Campaign angle: ${inputs.angle}${
        inputs.angleIsAgentDecided
          ? '\nSelect the strongest angle based on the brief and available intelligence.'
          : ''
      }`,
    )

    // Block 3 — Awareness Stage
    if (inputs.awarenessDirective) parts.push(`AWARENESS STAGE: ${inputs.awarenessDirective}`)

    // Block 4 — Audience Type
    if (inputs.audienceDirective) parts.push(`AUDIENCE TYPE: ${inputs.audienceDirective}`)
  }

  // Block 5 — Market sophistication (every run)
  parts.push(SOPHISTICATION_BLOCK)

  if (inputs) {
    // Block 6 — Offer
    let offer = `OFFER: ${inputs.offerTypeDirective}`
    if (inputs.offerName?.trim()) {
      offer += `\nThe campaign drives to: ${inputs.offerName.trim()}. Use this exact name in all CTAs.`
    }
    parts.push(offer)

    // Block 7 — Output Types
    if (inputs.outputTypesAgentDecided) {
      parts.push(
        `Select the most appropriate output types for this campaign angle, awareness stage, and audience type. Available types: ${outputTypeOptions.join(
          ', ',
        )}. Choose what will perform best for this specific brief.`,
      )
    } else {
      parts.push(`Generate the following output types: ${inputs.outputTypes.join(', ')}.`)
    }
  }

  // Block 8 — Intelligence systems (every run)
  parts.push(INTELLIGENCE_BLOCK)

  if (inputs) {
    // Block 9 — On Brand
    if (inputs.onBrandEnabled) {
      parts.push(
        `ON BRAND SETTINGS ACTIVE:\n${inputs.brandSettings.voiceGuidelines}\n${inputs.brandSettings.toneRules}\nStrictly apply these brand settings to every concept generated.`,
      )
    } else {
      parts.push('ON BRAND is disabled. Generate without brand anchoring.')
    }
  }

  // Block 10 — Compliance (every run, always last, overrides everything)
  parts.push(COMPLIANCE_BLOCK)

  return BLOCK_SEP + parts.join(BLOCK_SEP)
}

/* ------------------------- Intelligence-layer runner ----------------------- */

// Map hit volume to a builder-facing confidence band for the telemetry feed.
function confidenceBand(hits: number): 'High' | 'Medium' | 'Exploratory' {
  return hits >= 4 ? 'High' : hits >= 1 ? 'Medium' : 'Exploratory'
}

async function runIntelligence(
  anthropic: Anthropic,
  controller: ReadableStreamDefaultController,
  id: IntelligenceId,
  question: string,
  builderId: string | null,
): Promise<string> {
  const agent = INTELLIGENCE[id]
  sse(controller, {
    type: 'delegate',
    agent: agent.codename,
    label: agent.intelligenceLabel,
    status: 'start',
  })

  // Gather scoped evidence across this layer's knowledge systems.
  const hits = (
    await Promise.all(
      agent.systems.map((system) => searchKnowledge(question, { system, k: 4, builderId })),
    )
  ).flat()
  for (const h of hits.slice(0, 5)) {
    sse(controller, { type: 'retrieval', system: h.system, title: h.title })
  }

  const evidence = hits.length
    ? hits.map((h) => `[${h.system}] ${h.title}: ${h.content}`).join('\n\n')
    : 'No stored knowledge yet — reason from builder-industry first principles.'

  const response = await withRetry(
    () =>
      anthropic.messages.create({
        model: INTELLIGENCE_MODEL,
        max_tokens: 700,
        system: `You are ${agent.codename}, the ${agent.role} layer for The Professional Builder. Your mission: ${agent.mission} Given retrieved evidence, return 3-5 tight, specific bullet findings OPUS can build a campaign on. Cite the asset/pattern names. No preamble.`,
        messages: [
          { role: 'user', content: `Question: ${question}\n\nRetrieved evidence:\n${evidence}` },
        ],
      }),
    (n, w) =>
      sse(controller, {
        type: 'step',
        text: `${agent.intelligenceLabel}: model busy — retrying (${n}/4) in ${w / 1000}s…`,
      }),
  )

  const block = response.content.find((b): b is Anthropic.TextBlock => b.type === 'text')
  const findings = block?.text ?? 'No findings.'
  const summary = findings.split('\n').find((l) => l.trim())?.replace(/^[-•*\s]+/, '').slice(0, 90) ?? 'findings ready'
  sse(controller, {
    type: 'delegate',
    agent: agent.codename,
    label: agent.intelligenceLabel,
    status: 'done',
    summary,
    confidence: confidenceBand(hits.length),
  })

  return findings
}

/* --------------------------- Demo fallback flow --------------------------- */

// A frame-by-frame production brief for a visual demo concept, so demo mode also
// shows the production-brief-driven workflow.
function demoBrief(creativeType: string, angle: string): ProductionBrief {
  const al = angle.toLowerCase()
  return {
    creativeType,
    pattern: angle === 'Profit' ? 'Profit Leak' : angle,
    audience: 'Builders $1M–$3M',
    awareness: 'Problem-Aware',
    frames: [
      { label: 'Frame 1', description: 'Builder overwhelmed on a chaotic job site.' },
      { label: 'Frame 2', description: `The hidden ${al} problem exposed with one stark figure.` },
      { label: 'Frame 3', description: 'The system / turning point introduced.' },
      { label: 'Frame 4', description: 'The after — margin, time, and control restored.' },
      { label: 'Frame 5', description: 'Soft, qualifying call to action to the next step.' },
    ],
  }
}

async function runDemo(controller: ReadableStreamDefaultController, body: ReactorRequest) {
  const outputs = body.outputs ?? ['Hook', 'Headline', 'Campaign Concept']
  sse(controller, { type: 'step', text: 'OPUS online (demo mode — set ANTHROPIC_API_KEY for the live network)' })

  const demoSummaries: Partial<Record<IntelligenceId, string>> = {
    nova: 'Builders fear margin erosion despite record revenue; "profit leak" language resonates',
    spark: 'Founder videos (71% win) + static proof ads outperform; specific figures beat claims',
    echo: 'Top hook: "Most builders don\'t have a revenue problem. They have a profit leak."',
    oracle: 'Dominant winning pattern: Time Freedom — owner-dependency relief beats raw growth claims',
  }

  for (const id of ['nova', 'spark', 'echo', 'oracle'] as IntelligenceId[]) {
    const agent = INTELLIGENCE[id]
    sse(controller, { type: 'delegate', agent: agent.codename, label: agent.intelligenceLabel, status: 'start' })
    const hits = (
      await Promise.all(agent.systems.map((s) => searchKnowledge(body.angle, { system: s, k: 2 })))
    ).flat()
    for (const h of hits.slice(0, 3)) sse(controller, { type: 'retrieval', system: h.system, title: h.title })
    sse(controller, {
      type: 'delegate',
      agent: agent.codename,
      label: agent.intelligenceLabel,
      status: 'done',
      summary: demoSummaries[id],
      confidence: confidenceBand(hits.length || 2),
    })
  }

  sse(controller, { type: 'step', text: 'ORACLE — loading the Creative Learnings rubric for self-critique…' })
  sse(controller, { type: 'step', text: 'OPUS synthesizing strategy + scoring concepts…' })
  sse(controller, {
    type: 'step',
    text: 'Live Meta Ads performance + Higgsfield image/video creatives activate with API keys.',
  })

  const angleIsSentinel = !body.angle || body.angle === 'Agent decides' || body.angle === 'No Preference'
  const a = angleIsSentinel ? 'Profit' : (body.angle as string)
  const al = a.toLowerCase()
  const pool: Concept[] = [
    { type: 'Hook', text: `Most builders don't have a ${al} problem. They have a ${al} leak hiding in plain sight.`, basis: 'ECHO + NOVA', learningCheck: 'Specific, contrarian framing', score: 9 },
    { type: 'Headline', text: `From struggling to systemized — how ${a} became TPB's unfair advantage.`, basis: 'NOVA (member transformations)', learningCheck: 'Transformation arc over features', score: 8 },
    { type: 'Primary Text', text: `You didn't get into building to babysit jobs. This is the ${a} system that gave 500+ builders their margin — and their weekends — back.`, basis: 'NOVA + ECHO', learningCheck: 'Concrete proof (500+ builders)', score: 8 },
    { type: 'VSL Opener', text: `In the next few minutes I'll show you the exact ${a} mechanism most builders never see until it's too late.`, basis: 'ECHO (VSL openers)', learningCheck: 'Mechanism + curiosity', score: 7 },
    { type: 'Static Concept', text: `Dark background, one bold profit figure, named member underneath, single cyan accent. Angle: ${a}.`, basis: 'SPARK (static proof ad)', learningCheck: 'Specific $ numbers beat vague claims', score: 9 },
    { type: 'Video Concept', text: `Founder direct-to-camera on-site: 1.5s pattern interrupt, contrarian ${al} belief, member proof, soft CTA.`, basis: 'SPARK (Founder Video, 71% win)', learningCheck: 'Founder videos beat talking heads', score: 9 },
    { type: 'Founder Concept', text: `Handheld walk-through of a finished site while the founder breaks down the ${a} turning point.`, basis: 'SPARK (Founder Video, 71% win)', learningCheck: 'Founder-led, on-site, real proof', score: 9 },
    { type: 'Testimonial Concept', text: `Member states old hours/margin, the ${al} turning point, then the after. B-roll of their jobs.`, basis: 'NOVA (transformations)', learningCheck: 'Named member win over generic promise', score: 8 },
    { type: 'Event Concept', text: `High-energy room montage tied to one ${a} insight and community proof.`, basis: 'SPARK (Authority Pattern)', learningCheck: 'Community proof', score: 7 },
    { type: 'Campaign Concept', text: `The ${a} Reactor: founder video + static proof ad + member testimonial, sequenced cold → warm → apply.`, basis: 'OPUS (stacks highest-win formats)', learningCheck: 'Stacks the three highest-win formats', score: 9 },
  ]
  // Visual concepts carry a production brief — the platform plans before it renders.
  for (const c of pool) {
    if (/static|video|founder|testimonial|event|campaign/i.test(c.type) && /concept/i.test(c.type)) {
      c.productionBrief = demoBrief(c.type, a)
    }
  }
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
        const mcpServer = metaAdsServer()
        const useImage = imageConfigured()
        const useVideo = videoConfigured()
        const availableVideoModels = listVideoModels().filter((m) => m.configured).map((m) => m.id)
        const availableImageModels = listImageModels().filter((m) => m.configured).map((m) => m.id)
        const tools = buildTools(useImage, useVideo, Boolean(mcpServer))
        const inputBlocks = buildInputBlocks(body.reactorInputs)

        sse(controller, { type: 'step', text: 'OPUS online. Directing the intelligence network…' })
        if (mcpServer) sse(controller, { type: 'step', text: 'Live Meta Ads performance feed connected.' })
        if (useImage) sse(controller, { type: 'step', text: `Image engine ready · models: ${availableImageModels.join(', ')}` })
        if (useVideo) sse(controller, { type: 'step', text: `Video engine ready · models: ${availableVideoModels.join(', ')}` })

        const angleClause =
          !body.angle || body.angle === 'Agent decides' || body.angle === 'No Preference'
            ? 'Select the strongest campaign angle from the brief and intelligence'
            : `Design campaign concepts for the "${body.angle}" angle`
        const messages: Anthropic.Beta.Messages.BetaMessageParam[] = [
          {
            role: 'user',
            content: `${angleClause}. Active intelligence inputs: ${(body.inputs ?? []).join(', ') || 'all'}. Requested output types: ${outputs.join(', ')}.`,
          },
        ]

        for (let turn = 0; turn < MAX_TURNS; turn++) {
          const params: Anthropic.Beta.Messages.MessageCreateParamsNonStreaming = {
            model: OPUS_MODEL,
            max_tokens: 4000,
            system:
              coordinatorPrompt(outputs, {
                metaAds: Boolean(mcpServer),
                image: useImage,
                video: useVideo,
                videoModels: availableVideoModels,
                imageModels: availableImageModels,
                preferredVideoModel: body.videoModel ?? null,
                preferredImageModel: body.imageModel ?? null,
              }) + inputBlocks,
            tools,
            messages,
          }
          if (mcpServer) {
            params.mcp_servers = [mcpServer]
            params.betas = [MCP_BETA]
          }

          const response = await withRetry(
            () => anthropic.beta.messages.create(params),
            (n, w) =>
              sse(controller, {
                type: 'step',
                text: `Claude is busy (overloaded) — retrying (${n}/4) in ${w / 1000}s…`,
              }),
          )
          messages.push({ role: 'assistant', content: response.content })

          // Surface server-side Meta Ads (MCP) tool activity in the telemetry feed.
          for (const block of response.content) {
            if (block.type === 'mcp_tool_use') {
              sse(controller, { type: 'retrieval', system: 'meta-ads', title: block.name })
            }
          }

          // Server-side tool loop paused — re-send to let it resume.
          if (response.stop_reason === 'pause_turn') continue

          const toolUses = response.content.filter(
            (b): b is Anthropic.Beta.Messages.BetaToolUseBlock => b.type === 'tool_use',
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

          const results: Anthropic.Beta.Messages.BetaToolResultBlockParam[] = []
          for (const tu of toolUses) {
            if (tu.name === 'consult_intelligence') {
              const { layer, question } = tu.input as { layer: string; question: string }
              if (!isIntelligenceId(layer)) {
                results.push({ type: 'tool_result', tool_use_id: tu.id, content: 'Unknown intelligence layer', is_error: true })
                continue
              }
              const findings = await runIntelligence(
                anthropic,
                controller,
                layer,
                question,
                body.builderId ?? null,
              )
              results.push({ type: 'tool_result', tool_use_id: tu.id, content: findings })
            } else if (tu.name === 'get_learnings') {
              sse(controller, { type: 'step', text: 'ORACLE — loading the Creative Learnings rubric for self-critique…' })
              results.push({
                type: 'tool_result',
                tool_use_id: tu.id,
                content: learnings.map((l) => `• ${l.insight} — ${l.recommendation} (evidence: ${l.evidence})`).join('\n'),
              })
            } else if (tu.name === 'generate_image') {
              const { prompt, conceptType, aspectRatio, model } = tu.input as {
                prompt: string
                conceptType?: string
                aspectRatio?: AspectRatio
                model?: string
              }
              sse(controller, {
                type: 'step',
                text: `Generating still creative via ${model ?? 'default model'}${conceptType ? ` · ${conceptType}` : ''}…`,
              })
              const result = await generateImageWith(model, prompt, aspectRatio ?? '1:1')
              if (result) {
                sse(controller, {
                  type: 'media',
                  mediaType: 'image',
                  conceptType: conceptType ?? '',
                  model: result.modelId,
                  provider: result.provider,
                  url: result.imageUrl,
                })
                results.push({
                  type: 'tool_result',
                  tool_use_id: tu.id,
                  content: JSON.stringify({ imageUrl: result.imageUrl, model: result.modelId }),
                })
              } else {
                results.push({
                  type: 'tool_result',
                  tool_use_id: tu.id,
                  content: JSON.stringify({ imageUrl: null, note: 'image generation unavailable' }),
                })
              }
            } else if (tu.name === 'generate_video') {
              const { mode, prompt, imageUrl, model, aspectRatio, conceptType } = tu.input as {
                mode: GenMode
                prompt?: string
                imageUrl?: string
                model?: string
                aspectRatio?: AspectRatio
                conceptType?: string
              }
              sse(controller, {
                type: 'step',
                text: `Rendering ${mode} via ${model ?? 'default model'}${conceptType ? ` · ${conceptType}` : ''}…`,
              })
              const started = await startVideoJob(model, {
                mode,
                prompt,
                imageUrl,
                aspectRatio,
              })
              if (started) {
                await logGeneration({
                  builder_id: body.builderId ?? null,
                  model_id: started.modelId,
                  provider: started.provider,
                  mode,
                  prompt: prompt ?? null,
                  image_url: imageUrl ?? null,
                  request_id: started.requestId,
                  status: started.status,
                })
                sse(controller, {
                  type: 'media',
                  mediaType: 'video',
                  conceptType: conceptType ?? '',
                  model: started.modelId,
                  provider: started.provider,
                  requestId: started.requestId,
                  status: started.status,
                  responseUrl: started.responseUrl,
                })
                results.push({
                  type: 'tool_result',
                  tool_use_id: tu.id,
                  content: JSON.stringify({
                    requestId: started.requestId,
                    model: started.modelId,
                    status: started.status,
                    note: 'video is rendering; it will appear on the concept card when ready',
                  }),
                })
              } else {
                results.push({
                  type: 'tool_result',
                  tool_use_id: tu.id,
                  content: JSON.stringify({ requestId: null, note: 'video generation unavailable' }),
                })
              }
            } else {
              results.push({ type: 'tool_result', tool_use_id: tu.id, content: 'Unknown tool', is_error: true })
            }
          }
          messages.push({ role: 'user', content: results })
        }

        sse(controller, { type: 'step', text: 'Coordinator reached its turn limit without submitting concepts.' })
        sse(controller, { type: 'done' })
        controller.close()
      } catch (err) {
        console.error('Campaign Reactor error:', err)
        const status = (err as { status?: number })?.status
        const message =
          status === 529 || status === 503
            ? 'Claude is temporarily overloaded. Please fire the reactor again in a moment.'
            : status === 429
              ? 'Rate limit reached. Wait a few seconds and fire the reactor again.'
              : err instanceof Error
                ? err.message
                : 'Reactor failed'
        sse(controller, { type: 'error', message })
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
