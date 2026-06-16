import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { awarenessOptions, audienceOptions, offerOptions } from '@/lib/reactor-inputs'
import { winningAngles } from '@/lib/reactor-data'
import { parseModelJson } from '@/lib/parse'

export const runtime = 'nodejs'

// Same coordinator brain as the reactor — this is the agent making its strategic
// call up front so the modal shows a real choice the moment it has enough info.
const MODEL = 'claude-opus-4-8'

const angleLabels = winningAngles.map((a) => a.name)
const awarenessLabels = awarenessOptions.slice(1).map((o) => o.label)
const audienceLabels = audienceOptions.slice(1).map((o) => o.label)
const offerLabels = offerOptions.slice(1).map((o) => o.label)

interface Suggestion {
  angle: string
  awareness: string
  audience: string
  offer: string
}

// Heuristic stand-in so the field is always pre-filled — even with no API key or
// a thin brief — keeping the flow unified and never blocking the user.
function fallback(brief: string, angle: string): Suggestion {
  const t = brief.toLowerCase()
  const pickAngle =
    angle && angle !== 'Agent decides' && angleLabels.includes(angle)
      ? angle
      : /time|freedom|hours|family|weekend/.test(t)
        ? 'Time Freedom'
        : /system|process|sop|chaos|operations?/.test(t)
          ? 'Systems'
          : /scale|grow|growth|lead|pipeline/.test(t)
            ? 'Growth'
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
      : /download|guide|lead magnet|free/.test(t)
        ? 'Free Lead Magnet'
        : 'Strategy Call / Application'
  return { angle: pickAngle, awareness, audience, offer }
}

function validate(s: Partial<Suggestion>, fb: Suggestion): Suggestion {
  return {
    angle: angleLabels.includes(s.angle ?? '') ? (s.angle as string) : fb.angle,
    awareness: awarenessLabels.includes(s.awareness ?? '') ? (s.awareness as string) : fb.awareness,
    audience: audienceLabels.includes(s.audience ?? '') ? (s.audience as string) : fb.audience,
    offer: offerLabels.includes(s.offer ?? '') ? (s.offer as string) : fb.offer,
  }
}

export async function POST(request: NextRequest) {
  const { brief = '', angle = 'Agent decides' } = (await request.json()) as {
    brief?: string
    angle?: string
  }
  const fb = fallback(brief, angle)

  // No key or nothing to reason over → return the heuristic pick (still concrete).
  if (!process.env.ANTHROPIC_API_KEY || brief.trim().length < 12) {
    return NextResponse.json({ suggestion: fb, demo: !process.env.ANTHROPIC_API_KEY })
  }

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 300,
      system:
        'You are the Campaign Reactor strategist for The Professional Builder, a coaching program for trades/construction business owners. Given a campaign brief, pick the single best-fit option from each list — the strategic starting point a senior media buyer would choose. Reply with ONLY a JSON object, exact labels, no prose.',
      messages: [
        {
          role: 'user',
          content: `Campaign brief:\n"""${brief.trim()}"""\n\nAngle hint: ${angle}\n\nChoose exactly one label from each list:\nANGLE: ${angleLabels.join(' | ')}\nAWARENESS: ${awarenessLabels.join(' | ')}\nAUDIENCE: ${audienceLabels.join(' | ')}\nOFFER: ${offerLabels.join(' | ')}\n\nReturn JSON: {"angle":"...","awareness":"...","audience":"...","offer":"..."}`,
        },
      ],
    })
    const text = response.content.find((b): b is Anthropic.TextBlock => b.type === 'text')?.text ?? ''
    const parsed = parseModelJson<Partial<Suggestion>>(text)
    return NextResponse.json({ suggestion: validate(parsed, fb) })
  } catch (err) {
    console.error('Campaign Reactor suggest error:', err)
    return NextResponse.json({ suggestion: fb })
  }
}
