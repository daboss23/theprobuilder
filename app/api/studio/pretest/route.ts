import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { INTELLIGENCE_MODEL } from '@/lib/models'
import {
  demoNeuroScore,
  NEURO_PRINCIPLES,
  retrieveNeuroPrinciples,
  scoreConceptsNeuro,
} from '@/lib/neuro'
import type { MetaAdPackage } from '@/lib/meta-ads'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Studio pre-test — NEURO's predicted-response read on the ad the user just
 * configured, BEFORE any spend. Same scorer and neuromarketing grounding as the
 * reactor's in-run pre-test, pointed at the edited ad unit. Never throws: with
 * no ANTHROPIC_API_KEY it returns the curated demo estimate so the Studio flow
 * always completes.
 */

interface PretestBody {
  pkg?: MetaAdPackage
  conceptType?: string
}

export async function POST(req: Request) {
  let body: PretestBody
  try {
    body = (await req.json()) as PretestBody
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request body.' }, { status: 400 })
  }

  const pkg = body.pkg
  if (!pkg?.primaryText?.trim()) {
    return NextResponse.json({ ok: false, error: 'Write the ad before pre-testing it.' })
  }
  const conceptType = body.conceptType?.trim() || 'Studio Ad'

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({
      ok: true,
      demo: true,
      neuro: demoNeuroScore(7, conceptType),
    })
  }

  try {
    const anthropic = new Anthropic({ apiKey })
    const principles = await retrieveNeuroPrinciples(conceptType, null).catch(() => NEURO_PRINCIPLES)
    const [neuro] = await scoreConceptsNeuro(
      anthropic,
      INTELLIGENCE_MODEL,
      [
        {
          type: conceptType,
          text: `${pkg.primaryText}\nHeadline: ${pkg.headline}${pkg.description ? `\nDescription: ${pkg.description}` : ''}`,
          adPackage: pkg,
        },
      ],
      principles,
    )
    return NextResponse.json({ ok: true, demo: false, neuro })
  } catch {
    return NextResponse.json({ ok: true, demo: true, neuro: demoNeuroScore(7, conceptType) })
  }
}
