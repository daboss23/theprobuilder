import crypto from 'crypto'
import {
  metaHeroKpis,
  metaMetrics,
  metaTopAds,
  metaSpendTrend,
  metaAudienceBreakdown,
  metaPlacementBreakdown,
  metaAgentInsights,
  metaLearningStats,
  metaResultMix,
  metaPrimaryResultType,
  metaRevenueConnected,
  metaThresholds,
  metaSpendTotal,
  money,
  type MetaKpi,
  type MetaMetric,
  type MetaAd,
  type SpendWeek,
  type BreakdownRow,
  type AgentInsight,
  type ResultSlice,
  type CreativeTrend,
} from '@/lib/meta-data'
import {
  RESULT_LABELS,
  costLabel,
  evaluateStatus,
  type PrimaryResultType,
  type StatusThresholds,
} from '@/lib/creative-status'

/**
 * Meta Marketing API client (direct Graph API).
 *
 * This is the production path for live ad performance — a System User access
 * token calling graph.facebook.com directly, independent of the MCP connector
 * the Campaign Reactor agent uses. It powers the /meta dashboard.
 *
 * Per CLAUDE.md it NEVER throws on missing keys or API errors — every public
 * function degrades to the curated demo intelligence so the dashboard always
 * renders. The dashboard only swaps to live numbers once real spend crosses
 * META_LIVE_MIN_SPEND, so a freshly connected account keeps showing the demo
 * (a strong sales surface) until there is genuine performance worth displaying.
 *
 * Required env: META_ACCESS_TOKEN. Optional: META_APP_SECRET (adds
 * appsecret_proof), META_API_VERSION (default v19.0), META_LIVE_MIN_SPEND
 * (default 1000, in the account currency).
 */

const GRAPH_BASE = 'https://graph.facebook.com'
const FETCH_TIMEOUT_MS = 6000

export function metaApiConfigured(): boolean {
  return Boolean(process.env.META_ACCESS_TOKEN)
}

function apiVersion(): string {
  return process.env.META_API_VERSION || 'v19.0'
}

function liveMinSpend(): number {
  const raw = Number(process.env.META_LIVE_MIN_SPEND)
  return Number.isFinite(raw) && raw >= 0 ? raw : 1000
}

// Meta's recommended request signing: HMAC-SHA256 of the access token keyed by
// the app secret. Only added when META_APP_SECRET is configured.
function appSecretProof(token: string): string | null {
  const secret = process.env.META_APP_SECRET
  if (!secret) return null
  return crypto.createHmac('sha256', secret).update(token).digest('hex')
}

// Exported so the performance-ingest layer (lib/meta-ingest.ts) reuses the same
// signed, timeout-guarded Graph plumbing instead of duplicating it.
export async function graphGet(path: string, params: Record<string, string>): Promise<unknown> {
  const token = process.env.META_ACCESS_TOKEN
  if (!token) throw new Error('META_ACCESS_TOKEN not configured')

  const url = new URL(`${GRAPH_BASE}/${apiVersion()}/${path}`)
  url.searchParams.set('access_token', token)
  const proof = appSecretProof(token)
  if (proof) url.searchParams.set('appsecret_proof', proof)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    const res = await fetch(url.toString(), { signal: controller.signal })
    const json = (await res.json()) as { error?: { message?: string } }
    if (!res.ok || json.error) {
      throw new Error(json.error?.message || `Graph API ${res.status}`)
    }
    return json
  } finally {
    clearTimeout(timer)
  }
}

/* ------------------------------- parsing ---------------------------------- */

export type InsightRow = {
  spend?: string
  impressions?: string
  clicks?: string
  ctr?: string
  cpc?: string
  cpm?: string
  reach?: string
  frequency?: string
  ad_id?: string
  ad_name?: string
  campaign_name?: string
  date_start?: string
  date_stop?: string
  actions?: { action_type: string; value: string }[]
  purchase_roas?: { action_type: string; value: string }[]
  video_3_sec_watched_actions?: { action_type: string; value: string }[]
  outbound_clicks_ctr?: { action_type: string; value: string }[]
}

/**
 * Meta action types mapped onto the result vocabulary the platform speaks.
 * Deliberately explicit: a booked call is not a lead, a registration is not an
 * application, and nothing here rolls them into one "conversions" number.
 */
const RESULT_ACTION_TYPES: Record<PrimaryResultType, string[]> = {
  lead: ['lead', 'offsite_conversion.fb_pixel_lead', 'onsite_conversion.lead_grouped'],
  application: ['submit_application', 'offsite_conversion.fb_pixel_submit_application'],
  booked_call: ['schedule', 'offsite_conversion.fb_pixel_schedule', 'onsite_conversion.schedule'],
  registration: ['complete_registration', 'offsite_conversion.fb_pixel_complete_registration'],
  purchase: ['purchase', 'offsite_conversion.fb_pixel_purchase'],
  custom: ['offsite_conversion.fb_pixel_custom'],
}

/** Count one result type on an insight row. */
export function resultCount(row: InsightRow, type: PrimaryResultType): number {
  const wanted = new Set(RESULT_ACTION_TYPES[type])
  return (row.actions ?? [])
    .filter((a) => wanted.has(a.action_type))
    .reduce((sum, a) => sum + num(a.value), 0)
}

/** The full result mix on a row — every type counted separately. */
export function resultMix(row: InsightRow): ResultSlice[] {
  return (Object.keys(RESULT_ACTION_TYPES) as PrimaryResultType[])
    .map((type) => ({ type, count: Math.round(resultCount(row, type)) }))
    .filter((s) => s.count > 0)
    .sort((a, b) => b.count - a.count)
}

/** The dominant result type — what an account-wide cost figure is the cost OF. */
export function dominantResult(mix: ResultSlice[]): PrimaryResultType {
  return mix[0]?.type ?? 'lead'
}

const CONVERSION_ACTIONS = new Set([
  'lead',
  'purchase',
  'offsite_conversion.fb_pixel_lead',
  'offsite_conversion.fb_pixel_purchase',
  'onsite_conversion.lead_grouped',
])

export function num(v: unknown): number {
  const n = parseFloat(String(v ?? '').replace(/[^0-9.\-]/g, ''))
  return Number.isFinite(n) ? n : 0
}

export function conversions(row: InsightRow): number {
  return (row.actions ?? [])
    .filter((a) => CONVERSION_ACTIONS.has(a.action_type))
    .reduce((sum, a) => sum + num(a.value), 0)
}

export function roas(row: InsightRow): number {
  return num(row.purchase_roas?.[0]?.value)
}

/* ------------------------------ live pulls -------------------------------- */

export async function listAccountIds(): Promise<string[]> {
  const json = (await graphGet('me/adaccounts', { fields: 'account_id', limit: '50' })) as {
    data?: { account_id?: string }[]
  }
  return (json.data ?? []).map((d) => d.account_id).filter((id): id is string => Boolean(id))
}

async function accountInsights(accountId: string): Promise<InsightRow | null> {
  const json = (await graphGet(`act_${accountId}/insights`, {
    fields: 'spend,impressions,clicks,ctr,cpc,cpm,reach,frequency,actions,purchase_roas',
    date_preset: 'maximum',
  })) as { data?: InsightRow[] }
  return json.data?.[0] ?? null
}

async function topAds(accountId: string): Promise<InsightRow[]> {
  const json = (await graphGet(`act_${accountId}/insights`, {
    level: 'ad',
    fields:
      'ad_id,ad_name,spend,ctr,impressions,frequency,actions,purchase_roas,video_3_sec_watched_actions,outbound_clicks_ctr,date_start,date_stop',
    sort: 'spend_descending',
    limit: '6',
  })) as { data?: InsightRow[] }
  return json.data ?? []
}

/**
 * Creative thumbnails for the ads we are about to render. The insights edge
 * carries no imagery, so the ad objects are pulled separately and joined by id.
 * A miss is not an error — the table falls back to a format tile.
 */
async function adThumbnails(accountId: string): Promise<Record<string, string>> {
  const json = (await graphGet(`act_${accountId}/ads`, {
    fields: 'id,creative{thumbnail_url,object_story_spec}',
    limit: '50',
  })) as { data?: { id?: string; creative?: { thumbnail_url?: string } }[] }
  const map: Record<string, string> = {}
  for (const ad of json.data ?? []) {
    if (ad.id && ad.creative?.thumbnail_url) map[ad.id] = ad.creative.thumbnail_url
  }
  return map
}

async function monthlySpend(
  accountId: string,
): Promise<{ month: string; spend: number; results: number; roas: number }[]> {
  const json = (await graphGet(`act_${accountId}/insights`, {
    fields: 'spend,purchase_roas,actions',
    date_preset: 'last_year',
    time_increment: 'monthly',
  })) as { data?: InsightRow[] }
  return (json.data ?? []).map((r) => ({
    month: (r.date_start ?? '').slice(0, 7),
    spend: num(r.spend),
    results: resultMix(r).reduce((s, x) => s + x.count, 0),
    roas: roas(r),
  }))
}

/* ------------------------------ live mapping ------------------------------ */

const metricAccents = metaMetrics.map((m) => m.accent)
const heroAccents = metaHeroKpis.map((k) => k.accent)

/** Live thresholds. Env-overridable so a brand can set its own evaluation gates. */
function liveThresholds(costPerResult: number): StatusThresholds {
  const target = Number(process.env.META_TARGET_COST_PER_RESULT)
  return {
    ...metaThresholds,
    targetCostPerResult:
      Number.isFinite(target) && target > 0
        ? target
        : costPerResult > 0
          ? Math.round(costPerResult) // no configured target → the account's own average
          : undefined,
  }
}

function buildHeroKpis(
  totals: InsightRow,
  mix: ResultSlice[],
  blendedRoas: number,
  thresholds: StatusThresholds,
): MetaKpi[] {
  const spend = num(totals.spend)
  const results = mix.reduce((s, r) => s + r.count, 0)
  const type = dominantResult(mix)
  const cpr = results > 0 ? spend / results : 0
  const target = thresholds.targetCostPerResult
  const mixed = mix.length > 1

  const efficiency: MetaKpi =
    blendedRoas > 0
      ? {
          label: 'ROAS',
          value: `${blendedRoas.toFixed(1)}x`,
          sub: 'revenue connected via purchase value',
          delta: '',
          trend: 'flat',
          accent: heroAccents[3],
          definition: 'Purchase ROAS reported by Meta. Shown because real revenue is connected.',
        }
      : {
          label: 'Result Efficiency',
          value:
            target && cpr > 0
              ? `${Math.abs(Math.round(((cpr - target) / target) * 100))}% ${cpr <= target ? 'under' : 'over'} target`
              : 'Insufficient data',
          sub: target ? `$${cpr.toFixed(2)} vs $${target} ${costLabel(type)} target` : 'no target set',
          delta: '',
          trend: 'flat',
          accent: heroAccents[3],
          definition:
            'Cost per result against target. ROAS is hidden because no revenue or defensible conversion value is connected to this account.',
        }

  return [
    {
      label: 'Ad Spend',
      value: money(spend),
      sub: 'all-time',
      delta: '',
      trend: 'flat',
      accent: heroAccents[0],
      definition: 'Total amount spent across the connected ad accounts.',
    },
    {
      label: 'Primary Results',
      value: results > 0 ? results.toLocaleString() : 'Insufficient data',
      sub: mixed ? 'mixed result types — see the split' : RESULT_LABELS[type].many,
      delta: '',
      trend: 'flat',
      accent: heroAccents[1],
      definition:
        'The optimisation result each campaign was buying, counted per type. Leads, registrations, applications, booked calls and purchases are never blended.',
      breakdown: mix,
    },
    {
      label: 'Cost per Result',
      value: cpr > 0 ? `$${cpr.toFixed(2)}` : 'Insufficient data',
      sub: `Current result: ${RESULT_LABELS[type].one}`,
      delta: '',
      trend: 'flat',
      accent: heroAccents[2],
      definition: mixed
        ? 'Spend over the dominant result type. The account mixes result types — use the split rather than reading this as one blended cost.'
        : `Spend divided by ${RESULT_LABELS[type].many}.`,
    },
    efficiency,
  ]
}

function buildMetrics(totals: InsightRow, mix: ResultSlice[]): MetaMetric[] {
  const results = mix.reduce((s, r) => s + r.count, 0)
  const cpr = results > 0 ? num(totals.spend) / results : 0
  const type = dominantResult(mix)
  const rows: { label: string; value: string; metric: string; pct: number; definition: string }[] = [
    { label: 'CPC', value: `$${num(totals.cpc).toFixed(2)}`, metric: 'cost per link click', pct: 70, definition: 'Spend divided by link clicks.' },
    { label: 'CPM', value: `$${num(totals.cpm).toFixed(2)}`, metric: 'cost per 1k impressions', pct: 60, definition: 'Delivery cost, not a performance verdict.' },
    {
      label: costLabel(type),
      value: cpr > 0 ? `$${cpr.toFixed(2)}` : 'N/A',
      metric: `cost per ${RESULT_LABELS[type].one.toLowerCase()}`,
      pct: 65,
      definition: `Spend divided by ${RESULT_LABELS[type].many} — the result this account optimises for.`,
    },
    { label: 'Reach', value: Math.round(num(totals.reach)).toLocaleString(), metric: 'unique people', pct: 80, definition: 'Unique people who saw an ad at least once.' },
    { label: 'Frequency', value: num(totals.frequency).toFixed(1), metric: 'avg impressions / person', pct: 45, definition: 'Rising frequency alongside falling CTR is the primary fatigue signal.' },
    { label: 'Impressions', value: Math.round(num(totals.impressions)).toLocaleString(), metric: 'total served', pct: 62, definition: 'Times an ad was rendered, including repeats to the same person.' },
    { label: 'Clicks', value: Math.round(num(totals.clicks)).toLocaleString(), metric: 'link + post clicks', pct: 54, definition: 'All clicks, including engagement clicks that never leave Meta.' },
    { label: 'Outbound CTR', value: `${num(totals.ctr).toFixed(2)}%`, metric: 'clicks over impressions', pct: 71, definition: 'Click-through rate. Never proof of a commercial winner on its own.' },
  ]
  return rows.map((r, i) => ({ ...r, accent: metricAccents[i] ?? 'blue' }))
}

/** Hook rate from real 3-sec views. `null` when the ad carries no video data. */
function hookRateFrom(row: InsightRow): number | null {
  const views = num(row.video_3_sec_watched_actions?.[0]?.value)
  const impressions = num(row.impressions)
  if (views <= 0 || impressions <= 0) return null
  return Number(((views / impressions) * 100).toFixed(1))
}

function daysBetween(start?: string, stop?: string): number {
  if (!start) return 0
  const a = new Date(start).getTime()
  const b = stop ? new Date(stop).getTime() : Date.now()
  return Math.max(1, Math.round((b - a) / 86_400_000))
}

function buildTopAds(
  rows: InsightRow[],
  thumbs: Record<string, string>,
  thresholds: StatusThresholds,
): MetaAd[] {
  return rows.map((r) => {
    const mix = resultMix(r)
    const type = dominantResult(mix)
    const results = mix.reduce((s, x) => s + x.count, 0)
    const spend = num(r.spend)
    const cpr = results > 0 ? spend / results : 0
    const frequency = num(r.frequency)
    const purchaseRoas = roas(r)
    const daysLive = daysBetween(r.date_start, r.date_stop)
    // Without a stored prior period, movement is unknown — the evaluator is
    // handed zeros rather than an invented trend, so it can only conclude
    // fatigue from evidence we actually have.
    const verdict = evaluateStatus(
      {
        spend,
        results,
        daysLive,
        costPerResult: cpr,
        frequency,
        costTrendPct: 0,
        ctrTrendPct: 0,
      },
      thresholds,
    )
    return {
      id: r.ad_id || r.ad_name || 'ad',
      name: r.ad_name || 'Untitled ad',
      format: 'Meta Ad',
      thumbnailUrl: r.ad_id ? thumbs[r.ad_id] : undefined,
      spend,
      primaryResults: results,
      resultType: type,
      costPerResult: Number(cpr.toFixed(2)),
      hookRate: hookRateFrom(r),
      ctr: Number(num(r.ctr).toFixed(2)),
      frequency: Number(frequency.toFixed(1)),
      trend: 'Stable' as CreativeTrend,
      roas: purchaseRoas > 0 ? Number(purchaseRoas.toFixed(1)) : null,
      status: verdict.status,
      statusReason: verdict.reason,
      daysLive,
    }
  })
}

function buildSpendTrend(
  months: { month: string; spend: number; results: number; roas: number }[],
  revenueConnected: boolean,
): SpendWeek[] {
  return months.slice(-8).map((m) => ({
    week: m.month.slice(5) || m.month,
    spend: Math.round(m.spend),
    costPerResult: m.results > 0 ? Number((m.spend / m.results).toFixed(2)) : 0,
    roas: revenueConnected ? Number(m.roas.toFixed(1)) : null,
  }))
}

/* ------------------------------ public API -------------------------------- */

export interface MetaDashboard {
  source: 'live' | 'demo'
  heroKpis: MetaKpi[]
  metrics: MetaMetric[]
  topAds: MetaAd[]
  spendTrend: SpendWeek[]
  audienceBreakdown: BreakdownRow[]
  placementBreakdown: BreakdownRow[]
  agentInsights: AgentInsight[]
  learningStats: typeof metaLearningStats
  /** Every result type counted separately — never one blended "conversions". */
  resultMix: ResultSlice[]
  /** The dominant result type an account-wide cost figure refers to. */
  primaryResultType: PrimaryResultType
  /** ROAS is only shown when this is true. */
  revenueConnected: boolean
  /** The evaluation gates every status on this account was assigned under. */
  thresholds: StatusThresholds
  /** Total spend in the window, for evidence lines. */
  spendTotal: number
}

const DEMO_DASHBOARD: MetaDashboard = {
  source: 'demo',
  heroKpis: metaHeroKpis,
  metrics: metaMetrics,
  topAds: metaTopAds,
  spendTrend: metaSpendTrend,
  audienceBreakdown: metaAudienceBreakdown,
  placementBreakdown: metaPlacementBreakdown,
  agentInsights: metaAgentInsights,
  learningStats: metaLearningStats,
  resultMix: metaResultMix,
  primaryResultType: metaPrimaryResultType,
  revenueConnected: metaRevenueConnected,
  thresholds: metaThresholds,
  spendTotal: metaSpendTotal,
}

/**
 * Resolves the dataset the /meta dashboard renders. Returns live numbers only
 * when the API is configured AND aggregate spend clears META_LIVE_MIN_SPEND —
 * otherwise the curated demo set. Audience/placement breakdowns and the agent
 * learning insights stay curated for now (they're agent-derived, not a single
 * Graph call); the headline KPIs, efficiency metrics, top ads and spend trend
 * go live. Any failure silently falls back to demo.
 */
export async function resolveMetaDashboard(): Promise<MetaDashboard> {
  if (!metaApiConfigured()) return DEMO_DASHBOARD

  try {
    const accountIds = await listAccountIds()
    if (accountIds.length === 0) return DEMO_DASHBOARD

    const insights = await Promise.all(
      accountIds.map((id) => accountInsights(id).catch(() => null)),
    )
    const present = insights.filter((r): r is InsightRow => r !== null)
    const totalSpend = present.reduce((sum, r) => sum + num(r.spend), 0)
    if (totalSpend < liveMinSpend()) return DEMO_DASHBOARD

    // Aggregate account-level totals across every account.
    const totals: InsightRow = {
      spend: String(totalSpend),
      impressions: String(present.reduce((s, r) => s + num(r.impressions), 0)),
      clicks: String(present.reduce((s, r) => s + num(r.clicks), 0)),
      reach: String(present.reduce((s, r) => s + num(r.reach), 0)),
      cpc: String(present.reduce((s, r) => s + num(r.cpc), 0) / present.length),
      cpm: String(present.reduce((s, r) => s + num(r.cpm), 0) / present.length),
      frequency: String(present.reduce((s, r) => s + num(r.frequency), 0) / present.length),
      ctr: String(present.reduce((s, r) => s + num(r.ctr), 0) / present.length),
      actions: present.flatMap((r) => r.actions ?? []),
    }
    const roasValues = present.map(roas).filter((v) => v > 0)
    const blendedRoas = roasValues.length ? roasValues.reduce((a, b) => a + b, 0) / roasValues.length : 0

    const allAds = (await Promise.all(accountIds.map((id) => topAds(id).catch(() => []))))
      .flat()
      .sort((a, b) => num(b.spend) - num(a.spend))
      .slice(0, 6)

    const allMonths = (await Promise.all(accountIds.map((id) => monthlySpend(id).catch(() => []))))
      .flat()
      .reduce<Record<string, { spend: number; results: number; roas: number; n: number }>>(
        (acc, m) => {
          if (!m.month) return acc
          const cur = acc[m.month] ?? { spend: 0, results: 0, roas: 0, n: 0 }
          acc[m.month] = {
            spend: cur.spend + m.spend,
            results: cur.results + m.results,
            roas: cur.roas + m.roas,
            n: cur.n + 1,
          }
          return acc
        },
        {},
      )
    const months = Object.entries(allMonths)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, v]) => ({
        month,
        spend: v.spend,
        results: v.results,
        roas: v.n ? v.roas / v.n : 0,
      }))

    // Thumbnails are best-effort: a failed or empty lookup degrades to format
    // tiles rather than taking the dashboard down.
    const thumbs = Object.assign(
      {},
      ...(await Promise.all(accountIds.map((id) => adThumbnails(id).catch(() => ({}))))),
    ) as Record<string, string>

    const mix = resultMix(totals)
    const totalResults = mix.reduce((s, r) => s + r.count, 0)
    const thresholds = liveThresholds(totalResults > 0 ? totalSpend / totalResults : 0)
    // ROAS is only real when Meta reports a purchase value. A lead account with
    // no revenue feedback shows result efficiency instead — never an invented
    // return built from assigned lead values.
    const revenueConnected = blendedRoas > 0

    return {
      source: 'live',
      heroKpis: buildHeroKpis(totals, mix, revenueConnected ? blendedRoas : 0, thresholds),
      metrics: buildMetrics(totals, mix),
      topAds: allAds.length ? buildTopAds(allAds, thumbs, thresholds) : metaTopAds,
      spendTrend: months.length ? buildSpendTrend(months, revenueConnected) : metaSpendTrend,
      audienceBreakdown: metaAudienceBreakdown,
      placementBreakdown: metaPlacementBreakdown,
      agentInsights: metaAgentInsights,
      learningStats: metaLearningStats,
      resultMix: mix.length ? mix : metaResultMix,
      primaryResultType: dominantResult(mix),
      revenueConnected,
      thresholds,
      spendTotal: totalSpend,
    }
  } catch {
    return DEMO_DASHBOARD
  }
}

/** Lightweight connectivity check for the status endpoint. Never throws. */
export async function metaApiStatus(): Promise<{
  configured: boolean
  connected: boolean
  accountCount: number
  liveMinSpend: number
  error?: string
}> {
  if (!metaApiConfigured()) {
    return { configured: false, connected: false, accountCount: 0, liveMinSpend: liveMinSpend() }
  }
  try {
    const ids = await listAccountIds()
    return { configured: true, connected: true, accountCount: ids.length, liveMinSpend: liveMinSpend() }
  } catch (e) {
    return {
      configured: true,
      connected: false,
      accountCount: 0,
      liveMinSpend: liveMinSpend(),
      error: e instanceof Error ? e.message : 'unknown error',
    }
  }
}
