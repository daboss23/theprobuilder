import Anthropic from '@anthropic-ai/sdk'
import { NextRequest } from 'next/server'
import { searchKnowledge, type KnowledgeSystem } from '@/lib/knowledge'
import { learnings } from '@/lib/reactor-data'
import { generateImageWith, imageConfigured, listImageModels, type AspectRatio } from '@/lib/image'
import {
  startVideoJob,
  listVideoModels,
  videoConfigured,
  type GenMode,
} from '@/lib/video'
import { logGeneration } from '@/lib/video/persistence'

export const runtime = 'nodejs'
export const maxDuration = 300

// Coordinator brain (strategy + synthesis) and the cheaper specialists it
// delegates to. Single source of truth for both models.
const COORDINATOR_MODEL = 'claude-opus-4-8'
const SPECIALIST_MODEL = 'claude-sonnet-4-6'
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
}

interface Concept {
  type: string
  text: string
  basis?: string
  learningCheck?: string
  score?: number
  imageUrl?: string
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

/* ----------------------------- Specialists -------------------------------- */

type SpecialistId = 'research' | 'creative' | 'copy'

const SPECIALISTS: Record<
  SpecialistId,
  { name: string; systems: KnowledgeSystem[]; focus: string }
> = {
  research: {
    name: 'Research Analyst',
    systems: ['research', 'transformation'],
    focus:
      'market pains, desires, objections, beliefs, and the member transformations that prove change is possible',
  },
  creative: {
    name: 'Creative Strategist',
    systems: ['creative', 'pattern'],
    focus: 'winning creative structures, formats, opening patterns, and repeatable winning patterns',
  },
  copy: {
    name: 'Copy Specialist',
    systems: ['copy'],
    focus: 'high-performing hooks, headlines, primary text, and offers',
  },
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
      name: 'consult_specialist',
      description:
        'Delegate a focused question to a specialist sub-agent who searches their slice of the knowledge layer and reports findings. Consult the research specialist plus at least one of creative/copy before drafting.',
      input_schema: {
        type: 'object',
        properties: {
          specialist: {
            type: 'string',
            enum: ['research', 'creative', 'copy'],
            description: 'research = pains/desires/transformations; creative = formats/patterns; copy = hooks/headlines/offers',
          },
          question: { type: 'string', description: 'The focused question for the specialist' },
        },
        required: ['specialist', 'question'],
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
            enum: imageModelIds.length ? imageModelIds : ['nano-banana'],
            description:
              'Image model: fal-flux = photoreal humans/scenes in-house via fal; nano-banana = fast high-quality variants; openai-gpt-image = best legible text-in-image; higgsfield-soul = premium photographic ad look.',
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
              'Model to render with. seedance-2.0 = cinematic realism/B-roll; kling-2.5 = UGC motion; veo-3 = people speaking with native audio; wan-2.5 = high-volume/budget; higgsfield-dop = animate a still.',
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
      'Submit the final campaign concepts once specialists have reported AND you have self-scored each concept against the Creative Learnings rubric. Each concept must cite its evidence and pass the rubric. Include imageUrl for any concept you generated a creative for.',
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
              basis: { type: 'string', description: 'Which specialist finding / asset / pattern this draws from' },
              learningCheck: { type: 'string', description: 'How it satisfies the rubric' },
              score: { type: 'integer', description: 'Self-assessed 1-10. Only submit 7+.' },
              imageUrl: { type: 'string', description: 'The Higgsfield image URL for this concept, if one was generated.' },
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
    ? `\n- For visual output types (Static Concept, Founder Concept, Campaign Concept), call generate_image to produce a still creative. Available models: ${caps.imageModels.join(', ')}. Pass the concept type as conceptType and include the returned imageUrl in the matching concept.${preferredImageLine}`
    : ''
  const preferredLine =
    caps.preferredVideoModel && caps.videoModels.includes(caps.preferredVideoModel)
      ? ` The user has selected the "${caps.preferredVideoModel}" model — use it for every generate_video call unless a shot clearly needs a different capability.`
      : ''
  const videoLine = caps.video
    ? `\n- For video output types (Video Concept, Founder Concept, Testimonial Concept), call generate_video. Available models: ${caps.videoModels.join(', ')}. Use text-to-video to direct a full scene (e.g. a real builder on-site, a member speaking to camera — use veo-3 when they speak so it has audio; seedance-2.0 or kling-2.5 for cinematic action). Use image-to-video to animate a still from generate_image. Match conceptType to the concept you submit.${preferredLine}`
    : ''

  return `You are the Campaign Reactor Coordinator — the lead strategist of The Professional Builder's Creative Intelligence Command Center. You direct a team of specialist sub-agents.

Your team:
- Research Analyst — market pains, desires, objections, and member transformations.
- Creative Strategist — winning creative structures, formats, and repeatable patterns.
- Copy Specialist — high-performing hooks, headlines, and offers.

Process:
1. Delegate focused questions to your specialists with consult_specialist. Always consult the Research Analyst plus at least one of Creative/Copy. Use their findings as evidence — don't guess.${metaAdsLine}
2. Call get_learnings and self-score every concept against that rubric. Revise or drop anything below 7.${imageLine}${videoLine}
3. Call submit_concepts exactly once, with concepts ONLY for these requested output types: ${outputs.join(', ')}. Each concept cites which specialist finding it came from.

Voice: confident, specific, builder-native. Engineered for performance.`
}

/* --------------------------- Specialist runner ---------------------------- */

async function runSpecialist(
  anthropic: Anthropic,
  controller: ReadableStreamDefaultController,
  id: SpecialistId,
  question: string,
  builderId: string | null,
): Promise<string> {
  const spec = SPECIALISTS[id]
  sse(controller, { type: 'delegate', specialist: spec.name, status: 'start' })

  // Gather scoped evidence across the specialist's systems.
  const hits = (
    await Promise.all(
      spec.systems.map((system) => searchKnowledge(question, { system, k: 4, builderId })),
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
        model: SPECIALIST_MODEL,
        max_tokens: 700,
        system: `You are the ${spec.name} for The Professional Builder. You specialise in ${spec.focus}. Given retrieved evidence, return 3-5 tight, specific bullet findings the strategist can build a campaign on. Cite the asset/pattern names. No preamble.`,
        messages: [
          { role: 'user', content: `Question: ${question}\n\nRetrieved evidence:\n${evidence}` },
        ],
      }),
    (n, w) =>
      sse(controller, {
        type: 'step',
        text: `${spec.name}: model busy — retrying (${n}/4) in ${w / 1000}s…`,
      }),
  )

  const block = response.content.find((b): b is Anthropic.TextBlock => b.type === 'text')
  const findings = block?.text ?? 'No findings.'
  const summary = findings.split('\n').find((l) => l.trim())?.replace(/^[-•*\s]+/, '').slice(0, 80) ?? 'findings ready'
  sse(controller, { type: 'delegate', specialist: spec.name, status: 'done', summary })

  return findings
}

/* --------------------------- Demo fallback flow --------------------------- */

async function runDemo(controller: ReadableStreamDefaultController, body: ReactorRequest) {
  const outputs = body.outputs ?? ['Hook', 'Headline', 'Campaign Concept']
  sse(controller, { type: 'step', text: 'Coordinator online (demo mode — set ANTHROPIC_API_KEY for the live team)' })

  const demoSummaries: Record<SpecialistId, string> = {
    research: 'Builders fear margin erosion despite record revenue; "profit leak" language resonates',
    creative: 'Founder videos (71% win) + static proof ads outperform; specific figures beat claims',
    copy: 'Top hook: "Most builders don\'t have a revenue problem. They have a profit leak."',
  }

  for (const id of ['research', 'creative', 'copy'] as SpecialistId[]) {
    const spec = SPECIALISTS[id]
    sse(controller, { type: 'delegate', specialist: spec.name, status: 'start' })
    const hits = (
      await Promise.all(spec.systems.map((s) => searchKnowledge(body.angle, { system: s, k: 2 })))
    ).flat()
    for (const h of hits.slice(0, 3)) sse(controller, { type: 'retrieval', system: h.system, title: h.title })
    sse(controller, { type: 'delegate', specialist: spec.name, status: 'done', summary: demoSummaries[id] })
  }

  sse(controller, { type: 'step', text: 'Loading Creative Learnings rubric for self-critique…' })
  sse(controller, { type: 'step', text: 'Coordinator synthesizing + scoring concepts…' })
  sse(controller, {
    type: 'step',
    text: 'Live Meta Ads performance + Higgsfield image/video creatives activate with API keys.',
  })

  const a = body.angle
  const al = a.toLowerCase()
  const pool: Concept[] = [
    { type: 'Hook', text: `Most builders don't have a ${al} problem. They have a ${al} leak hiding in plain sight.`, basis: 'Copy Specialist + Research Analyst', learningCheck: 'Specific, contrarian framing', score: 9 },
    { type: 'Headline', text: `From struggling to systemized — how ${a} became TPB's unfair advantage.`, basis: 'Research Analyst (member transformations)', learningCheck: 'Transformation arc over features', score: 8 },
    { type: 'Primary Text', text: `You didn't get into building to babysit jobs. This is the ${a} system that gave 500+ builders their margin — and their weekends — back.`, basis: 'Research Analyst + Copy Specialist', learningCheck: 'Concrete proof (500+ builders)', score: 8 },
    { type: 'VSL Opener', text: `In the next few minutes I'll show you the exact ${a} mechanism most builders never see until it's too late.`, basis: 'Copy Specialist (VSL openers)', learningCheck: 'Mechanism + curiosity', score: 7 },
    { type: 'Static Concept', text: `Dark background, one bold profit figure, named member underneath, single cyan accent. Angle: ${a}.`, basis: 'Creative Strategist (static proof ad)', learningCheck: 'Specific $ numbers beat vague claims', score: 9 },
    { type: 'Video Concept', text: `Founder direct-to-camera on-site: 1.5s pattern interrupt, contrarian ${al} belief, member proof, soft CTA.`, basis: 'Creative Strategist (Founder Video, 71% win)', learningCheck: 'Founder videos beat talking heads', score: 9 },
    { type: 'Founder Concept', text: `Handheld walk-through of a finished site while the founder breaks down the ${a} turning point.`, basis: 'Creative Strategist (Founder Video, 71% win)', learningCheck: 'Founder-led, on-site, real proof', score: 9 },
    { type: 'Testimonial Concept', text: `Member states old hours/margin, the ${al} turning point, then the after. B-roll of their jobs.`, basis: 'Research Analyst (transformations)', learningCheck: 'Named member win over generic promise', score: 8 },
    { type: 'Event Concept', text: `High-energy room montage tied to one ${a} insight and community proof.`, basis: 'Creative Strategist (Authority Pattern)', learningCheck: 'Community proof', score: 7 },
    { type: 'Campaign Concept', text: `The ${a} Reactor: founder video + static proof ad + member testimonial, sequenced cold → warm → apply.`, basis: 'Coordinator (stacks highest-win formats)', learningCheck: 'Stacks the three highest-win formats', score: 9 },
  ]
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

        sse(controller, { type: 'step', text: 'Coordinator online. Briefing the specialist team…' })
        if (mcpServer) sse(controller, { type: 'step', text: 'Live Meta Ads performance feed connected.' })
        if (useImage) sse(controller, { type: 'step', text: `Image engine ready · models: ${availableImageModels.join(', ')}` })
        if (useVideo) sse(controller, { type: 'step', text: `Video engine ready · models: ${availableVideoModels.join(', ')}` })

        const messages: Anthropic.Beta.Messages.BetaMessageParam[] = [
          {
            role: 'user',
            content: `Design campaign concepts for the "${body.angle}" angle. Active intelligence inputs: ${(body.inputs ?? []).join(', ') || 'all'}. Requested output types: ${outputs.join(', ')}.`,
          },
        ]

        for (let turn = 0; turn < MAX_TURNS; turn++) {
          const params: Anthropic.Beta.Messages.MessageCreateParamsNonStreaming = {
            model: COORDINATOR_MODEL,
            max_tokens: 4000,
            system: coordinatorPrompt(outputs, {
              metaAds: Boolean(mcpServer),
              image: useImage,
              video: useVideo,
              videoModels: availableVideoModels,
              imageModels: availableImageModels,
              preferredVideoModel: body.videoModel ?? null,
              preferredImageModel: body.imageModel ?? null,
            }),
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
            if (tu.name === 'consult_specialist') {
              const { specialist, question } = tu.input as { specialist: SpecialistId; question: string }
              const findings = await runSpecialist(
                anthropic,
                controller,
                specialist,
                question,
                body.builderId ?? null,
              )
              results.push({ type: 'tool_result', tool_use_id: tu.id, content: findings })
            } else if (tu.name === 'get_learnings') {
              sse(controller, { type: 'step', text: 'Loading Creative Learnings rubric for self-critique…' })
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
                  requestId: started.requestId,
                  status: started.status,
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
