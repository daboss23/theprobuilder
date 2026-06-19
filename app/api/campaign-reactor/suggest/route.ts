import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import {
  awarenessOptions,
  audienceOptions,
  offerOptions,
  type ReactorSuggestion,
} from '@/lib/reactor-inputs'
import { reactorOutputTypes } from '@/lib/reactor-data'
import { angleEvidence } from '@/lib/outcomes'
import { parseModelJson } from '@/lib/parse'

export const runtime = 'nodejs'

// The Dynamic Strategy Engine — the same coordinator brain as the reactor making
// its strategic call up front. The angle is NOT constrained to the base
// categories: NOVA/ORACLE/OPUS can surface a sharper angle the dropdown adopts.
const MODEL = 'claude-opus-4-8'

// Base strategic categories — a starting vocabulary, not a hard limit.
const angleCategories = ['Profit', 'Systems', 'Time Freedom', 'Leadership', 'Cashflow', 'Growth', 'Team Accountability']
const awarenessLabels = awarenessOptions.slice(1).map((o) => o.label)
const audienceLabels = audienceOptions.slice(1).map((o) => o.label)
const offerLabels = offerOptions.slice(1).map((o) => o.label)
const deliverableLabels = [...reactorOutputTypes]

interface RawSuggestion {
  angle: string
  angleConfidence: number
  angleReason: string
  awareness: string
  audience: string
  offer: string
  deliverables: string[]
  deliverablesReason: string
}

// Heuristic stand-in so the field is always pre-filled — even with no API key or
// a thin brief — keeping the flow unified and never blocking the user.
function fallback(brief: string, angle: string): RawSuggestion {
  const t = brief.toLowerCase()
  const pickAngle =
    angle && !['No Preference', 'Agent decides', ''].includes(angle)
      ? angle
      : /time|freedom|hours|family|weekend/.test(t)
        ? 'Time Freedom'
        : /system|process|sop|chaos|operations?/.test(t)
          ? 'Systems'
          : /scale|grow|growth|lead|pipeline/.test(t)
            ? 'Growth'
            : /profit|margin|keeping nothing|revenue/.test(t)
              ? 'Profit'
              : 'Profit'
  const awareness = /know us|seen|retarget|applied|considered/.test(t)
    ? 'Product-Aware'
    : /compare|coaching|hiring|options?|vs\b/.test(t)
      ? 'Solution-Aware'
      : 'Problem-Aware'
  const audience = /retarget|applied|application|sales page|visited/.test(t)
    ? 'Retargeting — visited sales page'
    : /warm|seen|content|follower/.test(t)
      ? 'Warm — saw content, didn’t convert'
      : 'Cold — new audience'
  const offer = /webinar|masterclass|training/.test(t)
    ? 'Webinar / Masterclass'
    : /event|in person|in-person|live/.test(t)
      ? 'Live Event / In-Person'
      : /download|guide|lead magnet|free|pdf/.test(t)
        ? 'Free Lead Magnet'
        : 'Strategy Call / Application'

  // Deliverables follow the medium implied by the brief.
  const wantsVideo = /video|vsl|ugc|reel|tiktok|spokesperson/.test(t)
  const wantsImage = /image|static|photo|carousel|banner/.test(t)
  const deliverables = wantsVideo && !wantsImage
    ? ['Video Concepts', 'Hooks', 'VSL Openers']
    : wantsImage && !wantsVideo
      ? ['Static Concepts', 'Hooks', 'Headlines', 'Primary Text']
      : ['Hooks', 'Headlines', 'Static Concepts', 'Primary Text']

  return {
    angle: pickAngle,
    angleConfidence: 62,
    angleReason: `Best-fit base angle inferred from the brief${pickAngle ? ` — leads with ${pickAngle}.` : '.'}`,
    awareness,
    audience,
    offer,
    deliverables,
    deliverablesReason: wantsVideo
      ? 'Brief implies motion creative — leading with video deliverables.'
      : wantsImage
        ? 'Brief implies static creative — leading with image deliverables.'
        : 'Balanced starter set across hooks, headlines and static concepts.',
  }
}

function validate(s: Partial<RawSuggestion>, fb: RawSuggestion): RawSuggestion {
  const angle = typeof s.angle === 'string' && s.angle.trim() ? s.angle.trim() : fb.angle
  const conf = Number(s.angleConfidence)
  const deliverables = Array.isArray(s.deliverables)
    ? s.deliverables.filter((d) => deliverableLabels.includes(d))
    : []
  return {
    angle,
    // Angle is intentionally NOT constrained to the base categories.
    angleConfidence: Number.isFinite(conf) ? Math.max(40, Math.min(99, Math.round(conf))) : fb.angleConfidence,
    angleReason: typeof s.angleReason === 'string' && s.angleReason.trim() ? s.angleReason.trim() : fb.angleReason,
    awareness: awarenessLabels.includes(s.awareness ?? '') ? (s.awareness as string) : fb.awareness,
    audience: audienceLabels.includes(s.audience ?? '') ? (s.audience as string) : fb.audience,
    offer: offerLabels.includes(s.offer ?? '') ? (s.offer as string) : fb.offer,
    deliverables: deliverables.length ? deliverables : fb.deliverables,
    deliverablesReason:
      typeof s.deliverablesReason === 'string' && s.deliverablesReason.trim()
        ? s.deliverablesReason.trim()
        : fb.deliverablesReason,
  }
}

async function withEvidence(raw: RawSuggestion, demo: boolean): Promise<NextResponse> {
  // ORACLE strategic memory — cite real history behind the recommended angle.
  const evidence = await angleEvidence(raw.angle).catch(() => null)
  const suggestion: ReactorSuggestion = { ...raw, evidence }
  return NextResponse.json({ suggestion, demo })
}

export async function POST(request: NextRequest) {
  const { brief = '', angle = 'No Preference' } = (await request.json()) as {
    brief?: string
    angle?: string
  }
  const fb = fallback(brief, angle)

  // No key or nothing to reason over → heuristic pick (still concrete), enriched
  // with whatever ORACLE memory exists.
  if (!process.env.ANTHROPIC_API_KEY || brief.trim().length < 12) {
    return withEvidence(fb, !process.env.ANTHROPIC_API_KEY)
  }

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 500,
      system:
        'You are OPUS, the Campaign Reactor strategist for The Professional Builder (a coaching program for trades/construction business owners). Given a brief, name the single strongest campaign ANGLE — a precise, evocative strategic angle that may be sharper than the base categories (e.g. "Profit Leak", "Owner Dependency", "Foreman Trap"). Then choose the best-fit awareness, audience and offer from the provided lists, and the creative deliverables to produce. Reply with ONLY a JSON object, no prose.',
      messages: [
        {
          role: 'user',
          content: `Campaign brief:\n"""${brief.trim()}"""\n\nAngle hint: ${angle}\n\nBase angle categories (you may go sharper than these): ${angleCategories.join(' | ')}\nAWARENESS (pick one exact label): ${awarenessLabels.join(' | ')}\nAUDIENCE (pick one exact label): ${audienceLabels.join(' | ')}\nOFFER (pick one exact label): ${offerLabels.join(' | ')}\nDELIVERABLES (pick the subset that fits the brief's medium): ${deliverableLabels.join(' | ')}\n\nReturn JSON:\n{"angle":"<precise angle name>","angleConfidence":<0-100>,"angleReason":"<one sentence why this angle fits>","awareness":"...","audience":"...","offer":"...","deliverables":["...","..."],"deliverablesReason":"<one sentence why these deliverables>"}`,
        },
      ],
    })
    const text = response.content.find((b): b is Anthropic.TextBlock => b.type === 'text')?.text ?? ''
    const parsed = parseModelJson<Partial<RawSuggestion>>(text)
    return withEvidence(validate(parsed, fb), false)
  } catch (err) {
    console.error('Campaign Reactor suggest error:', err)
    return withEvidence(fb, false)
  }
}
