import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Meta Ad Library search (`ads_archive`). Progressive enhancement over the
 * primary paste-to-clone path: full commercial-ad search via this API is only
 * broadly available for EU-targeted ads (DSA transparency) and needs Ad Library
 * API access — elsewhere it commonly returns political/issue ads only or nothing.
 * So this route is deliberately best-effort: it returns a structured result with
 * a `note` explaining availability rather than pretending. Never throws.
 *
 * Query: q (search term), country (ISO, default AU), limit.
 */

const GRAPH_BASE = 'https://graph.facebook.com'
const FETCH_TIMEOUT_MS = 15000

interface ArchiveAd {
  id?: string
  page_name?: string
  ad_creative_bodies?: string[]
  ad_creative_link_titles?: string[]
  ad_snapshot_url?: string
  ad_delivery_start_time?: string
}

function daysActive(start?: string): number | undefined {
  if (!start) return undefined
  const t = Date.parse(start)
  if (Number.isNaN(t)) return undefined
  return Math.max(0, Math.round((Date.now() - t) / 86_400_000))
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = (searchParams.get('q') ?? '').trim()
  const country = (searchParams.get('country') ?? 'AU').trim().toUpperCase()
  const limit = Math.min(Number(searchParams.get('limit')) || 24, 50)

  const token = process.env.META_ACCESS_TOKEN
  if (!token) {
    return NextResponse.json({
      configured: false,
      ads: [],
      note: 'Meta Ad Library search needs META_ACCESS_TOKEN with Ad Library API access. Paste an ad below to clone it in the meantime.',
    })
  }
  if (!q) {
    return NextResponse.json({ configured: true, ads: [], note: 'Enter a search term.' })
  }

  const version = process.env.META_API_VERSION || 'v19.0'
  const params = new URLSearchParams({
    search_terms: q,
    ad_reached_countries: JSON.stringify([country]),
    ad_type: 'ALL',
    ad_active_status: 'ACTIVE',
    fields:
      'id,page_name,ad_creative_bodies,ad_creative_link_titles,ad_snapshot_url,ad_delivery_start_time',
    limit: String(limit),
    access_token: token,
  })

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    const res = await fetch(`${GRAPH_BASE}/${version}/ads_archive?${params.toString()}`, {
      signal: controller.signal,
    })
    const json = (await res.json()) as { data?: ArchiveAd[]; error?: { message?: string } }
    if (!res.ok || json.error) {
      return NextResponse.json({
        configured: true,
        ads: [],
        note:
          json.error?.message ||
          `Ad Library API returned ${res.status}. Commercial-ad search is limited outside the EU — paste an ad below to clone it.`,
      })
    }
    const ads = (json.data ?? []).map((a) => ({
      id: a.id ?? crypto.randomUUID(),
      pageName: a.page_name ?? 'Advertiser',
      body: (a.ad_creative_bodies ?? []).join('\n').trim(),
      title: (a.ad_creative_link_titles ?? [])[0] ?? '',
      snapshotUrl: a.ad_snapshot_url,
      daysActive: daysActive(a.ad_delivery_start_time),
    }))
    return NextResponse.json({
      configured: true,
      ads,
      note: ads.length
        ? undefined
        : `No ads returned for "${q}" in ${country}. Commercial-ad search via the API is limited outside the EU — paste an ad below to clone it.`,
    })
  } catch (err) {
    return NextResponse.json({
      configured: true,
      ads: [],
      note:
        err instanceof Error && err.name === 'AbortError'
          ? 'Ad Library search timed out. Paste an ad below to clone it instead.'
          : 'Ad Library search is unavailable right now. Paste an ad below to clone it instead.',
    })
  } finally {
    clearTimeout(timer)
  }
}
