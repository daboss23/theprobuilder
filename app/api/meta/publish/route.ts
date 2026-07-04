import { NextResponse } from 'next/server'
import { validateAdPackage, type MetaAdPackage } from '@/lib/meta-ads'
import {
  publishCreativeToMeta,
  publishConfigured,
  publishMissingEnv,
} from '@/lib/meta-publish'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Push Creative to Meta.
 *
 * GET  — connection status for the Studio button ({ configured, missing }).
 * POST — validate the configured ad server-side (same launch gate as the
 *        orchestrator), then create the ad creative in the connected account.
 *        Never throws: every failure returns 200 with a structured reason so
 *        the Studio renders it inline.
 */

export async function GET() {
  return NextResponse.json({ configured: publishConfigured(), missing: publishMissingEnv() })
}

interface PublishBody {
  pkg?: MetaAdPackage
  imageUrl?: string
  videoUrl?: string
  name?: string
}

export async function POST(req: Request) {
  let body: PublishBody
  try {
    body = (await req.json()) as PublishBody
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request body.' }, { status: 400 })
  }

  const pkg = body.pkg
  if (!pkg?.primaryText?.trim() || !pkg.headline?.trim()) {
    return NextResponse.json({
      ok: false,
      error: 'The ad needs primary text and a headline before it can be pushed.',
    })
  }

  // Same hard launch gate as the reactor's submit path — compliance errors
  // never ship, warnings pass through (they only truncate, not violate).
  const issues = validateAdPackage(pkg)
  const errors = issues.filter((i) => i.severity === 'error')
  if (errors.length) {
    return NextResponse.json({
      ok: false,
      error: `Fix the compliance issues first: ${errors.map((e) => e.message).join(' ')}`,
      issues: errors,
    })
  }

  const result = await publishCreativeToMeta({
    pkg,
    imageUrl: body.imageUrl,
    videoUrl: body.videoUrl,
    name: body.name,
  })
  return NextResponse.json(result)
}
