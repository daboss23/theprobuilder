import type { Accent } from '@/components/reactor/ui'
import {
  DEFAULT_THRESHOLDS,
  RESULT_LABELS,
  costLabel,
  evaluateStatus,
  type CreativeStatus,
  type PrimaryResultType,
  type StatusThresholds,
} from '@/lib/creative-status'

/**
 * Demo Meta Ads intelligence. Mirrors the shape a live Pipeboard / Meta Ads
 * pull would return so the Meta Intelligence page (and, later, the reactor
 * agent) can read from one contract. When PIPEBOARD_API_TOKEN is configured the
 * page can swap these for live figures; until then this curated set keeps the
 * surface fully populated.
 *
 * Semantics matter more than the numbers here. A "conversion" is never a
 * blended total — every result carries its TYPE (lead / registration /
 * application / booked call / purchase), every cost names the result it is the
 * cost OF, and ROAS only exists when real revenue is connected. Anything
 * seeded for demonstration is labelled DEMO DATA in the UI.
 */

export interface MetaKpi {
  label: string
  value: string
  sub: string
  delta: string
  trend: 'up' | 'down' | 'flat'
  accent: Accent
  /** What this number means and how it is calculated — surfaced as a tooltip. */
  definition?: string
  /** Result-type split for a mixed, account-wide total. */
  breakdown?: ResultSlice[]
}

/** One result type inside an account-wide mixed total. */
export interface ResultSlice {
  type: PrimaryResultType
  count: number
}

/** The account-wide result mix. Never collapsed into one "conversions" figure. */
export const metaResultMix: ResultSlice[] = [
  { type: 'lead', count: 920 },
  { type: 'registration', count: 214 },
  { type: 'application', count: 102 },
  { type: 'booked_call', count: 48 },
]

export const metaResultTotal = metaResultMix.reduce((s, r) => s + r.count, 0)

/**
 * The account's dominant result type — what an account-wide cost figure is the
 * cost of, and the label shown beneath it.
 */
export const metaPrimaryResultType: PrimaryResultType = 'lead'

/**
 * Whether real revenue (or a defensible conversion value) is connected. Lead
 * campaigns with no revenue feedback must NOT display ROAS — the dashboard
 * shows result efficiency instead.
 */
export const metaRevenueConnected = false

/** Campaign-level evaluation gates. Configurable per brand/campaign. */
export const metaThresholds: StatusThresholds = {
  ...DEFAULT_THRESHOLDS,
  minSpend: 1500,
  minDays: 5,
  minResults: 20,
  targetCostPerResult: 45,
}

export const metaSpendTotal = 148_320

// Hero performance — the numbers a media buyer scans first.
export const metaHeroKpis: MetaKpi[] = [
  {
    label: 'Ad Spend',
    value: '$148,320',
    sub: 'last 30 days',
    delta: '+12%',
    trend: 'up',
    accent: 'blue',
    definition: 'Total amount spent across active campaigns in the selected date range.',
  },
  {
    label: 'Primary Results',
    value: metaResultTotal.toLocaleString(),
    sub: 'mixed result types — see the split',
    delta: '+9%',
    trend: 'up',
    accent: 'violet',
    definition:
      'The optimisation result each campaign was actually buying. Types are counted separately and never treated as equivalent.',
    breakdown: metaResultMix,
  },
  {
    label: 'Cost per Result',
    value: '$42.10',
    sub: `Current result: ${RESULT_LABELS[metaPrimaryResultType].one}`,
    delta: '−6%',
    trend: 'up',
    accent: 'emerald',
    definition:
      'Spend divided by primary results for the dominant result type. Mixed date ranges are broken out rather than blended.',
  },
  {
    label: 'Result Efficiency',
    value: '6% under target',
    sub: `$42.10 vs $45 ${costLabel(metaPrimaryResultType)} target`,
    delta: '+6pp',
    trend: 'up',
    accent: 'cyan',
    definition:
      'Cost per result against the campaign target. Shown in place of ROAS because no revenue or defensible conversion value is connected to these lead campaigns.',
  },
]

export interface MetaMetric {
  label: string
  value: string
  metric: string
  pct: number
  accent: Accent
  definition?: string
}

// Secondary efficiency + creative-quality read-outs (pct drives the gauge).
export const metaMetrics: MetaMetric[] = [
  { label: 'CPC', value: '$0.82', metric: 'cost per link click', pct: 74, accent: 'blue', definition: 'Spend divided by link clicks.' },
  { label: 'CPM', value: '$19.40', metric: 'cost per 1k impressions', pct: 61, accent: 'cyan', definition: 'Delivery cost, not a performance verdict.' },
  { label: 'Outbound CTR', value: '2.34%', metric: 'clicks leaving Meta', pct: 68, accent: 'violet', definition: 'Outbound clicks over impressions — the click that actually reaches the landing page.' },
  { label: 'Reach', value: '612K', metric: 'unique people', pct: 82, accent: 'emerald', definition: 'Unique people who saw an ad at least once.' },
  { label: 'Frequency', value: '1.8', metric: 'avg impressions / person', pct: 45, accent: 'pink', definition: 'Rising frequency alongside falling CTR is the primary fatigue signal.' },
  { label: 'Hook Rate', value: '31%', metric: '3s views / impressions', pct: 62, accent: 'amber', definition: 'Video only. Not applicable to static creatives, and never proof of a commercial winner on its own.' },
  { label: 'Hold Rate', value: '18%', metric: 'thru-play to 15s', pct: 54, accent: 'cyan', definition: 'Video only. Attention retained past the hook.' },
  { label: 'Landing CVR', value: '9.2%', metric: 'page → result', pct: 71, accent: 'emerald', definition: 'Share of landing page visits that produced the campaign primary result.' },
]

export type CreativeTrend = 'Improving' | 'Stable' | 'Declining'

export interface MetaAd {
  id: string
  name: string
  format: string
  /** Creative thumbnail / video still. Absent → the UI renders a format tile. */
  thumbnailUrl?: string
  spend: number
  /** How many of the campaign's primary result this creative produced. */
  primaryResults: number
  resultType: PrimaryResultType
  costPerResult: number
  /** Thumb-stop rate. `null` = Not applicable (e.g. a static ad). */
  hookRate: number | null
  /** Outbound CTR, percent. */
  ctr: number
  frequency: number
  trend: CreativeTrend
  /** Only present when real revenue is connected to the campaign. */
  roas: number | null
  status: CreativeStatus
  /** Evidence sentence behind the status — required, never a bare colour. */
  statusReason: string
  daysLive: number
}

/** Money and rate formatters used across both dashboards. */
export function money(n: number): string {
  return `$${Math.round(n).toLocaleString()}`
}

export function compactMoney(n: number): string {
  return n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${Math.round(n)}`
}

export function pctLabel(n: number | null): string {
  return n === null ? 'N/A' : `${n.toFixed(1)}%`
}

const demoAds: Omit<MetaAd, 'status' | 'statusReason'>[] = [
  {
    id: 'ad_profit_leak',
    name: 'The Profit Leak — Founder Cut',
    format: 'Founder Video',
    spend: 24100,
    primaryResults: 861,
    resultType: 'lead',
    costPerResult: 28,
    hookRate: 38,
    ctr: 3.1,
    frequency: 2.2,
    trend: 'Improving',
    roas: null,
    daysLive: 26,
  },
  {
    id: 'ad_45_hour',
    name: '45-Hour Owner — UGC',
    format: 'UGC Video',
    spend: 18640,
    primaryResults: 565,
    resultType: 'lead',
    costPerResult: 33,
    hookRate: 35,
    ctr: 2.8,
    frequency: 2.0,
    trend: 'Improving',
    roas: null,
    daysLive: 21,
  },
  {
    id: 'ad_member_win_jason',
    name: 'Member Win — Jason',
    format: 'Testimonial',
    spend: 8210,
    primaryResults: 191,
    resultType: 'booked_call',
    costPerResult: 43,
    hookRate: 33,
    ctr: 2.6,
    frequency: 1.7,
    trend: 'Stable',
    roas: null,
    daysLive: 14,
  },
  {
    id: 'ad_margin_math',
    name: 'Margin Math',
    format: 'Static',
    spend: 12300,
    primaryResults: 267,
    resultType: 'lead',
    costPerResult: 46,
    hookRate: null,
    ctr: 2.2,
    frequency: 2.4,
    trend: 'Stable',
    roas: null,
    daysLive: 19,
  },
  {
    id: 'ad_stop_scaling',
    name: 'Stop Scaling — VSL Opener',
    format: 'VSL',
    spend: 980,
    primaryResults: 17,
    resultType: 'lead',
    costPerResult: 58,
    hookRate: 26,
    ctr: 1.9,
    frequency: 1.2,
    trend: 'Stable',
    roas: null,
    daysLive: 3,
  },
  {
    id: 'ad_systems_before_scale',
    name: 'Systems Before Scale',
    format: 'Carousel',
    spend: 6450,
    primaryResults: 91,
    resultType: 'lead',
    costPerResult: 71,
    hookRate: null,
    ctr: 1.6,
    frequency: 3.4,
    trend: 'Declining',
    roas: null,
    daysLive: 31,
  },
]

/**
 * Status is DERIVED, never hand-written: the same evaluator both dashboards use
 * runs over each creative's signals, so a demo row and a live row are graded by
 * exactly the same rules and thresholds.
 */
function grade(ad: Omit<MetaAd, 'status' | 'statusReason'>, opts?: { scaling?: boolean; costTrendPct?: number; ctrTrendPct?: number }): MetaAd {
  const verdict = evaluateStatus(
    {
      spend: ad.spend,
      results: ad.primaryResults,
      daysLive: ad.daysLive,
      costPerResult: ad.costPerResult,
      frequency: ad.frequency,
      costTrendPct: opts?.costTrendPct ?? (ad.trend === 'Declining' ? 18 : ad.trend === 'Improving' ? -9 : 2),
      ctrTrendPct: opts?.ctrTrendPct ?? (ad.trend === 'Declining' ? -21 : ad.trend === 'Improving' ? 12 : 1),
      scaling: opts?.scaling,
    },
    metaThresholds,
  )
  return { ...ad, status: verdict.status, statusReason: verdict.reason }
}

export const metaTopAds: MetaAd[] = [
  grade(demoAds[0], { scaling: true }),
  grade(demoAds[1]),
  grade(demoAds[2]),
  grade(demoAds[3]),
  grade(demoAds[4]),
  grade(demoAds[5]),
]

export interface SpendWeek {
  week: string
  spend: number
  /** Cost per result for the week — the efficiency line every account has. */
  costPerResult: number
  /** Only when revenue is connected. */
  roas: number | null
}

export const metaSpendTrend: SpendWeek[] = [
  { week: 'W1', spend: 28200, costPerResult: 51.2, roas: null },
  { week: 'W2', spend: 31100, costPerResult: 49.4, roas: null },
  { week: 'W3', spend: 29800, costPerResult: 48.1, roas: null },
  { week: 'W4', spend: 34500, costPerResult: 46.0, roas: null },
  { week: 'W5', spend: 33200, costPerResult: 44.7, roas: null },
  { week: 'W6', spend: 38900, costPerResult: 44.1, roas: null },
  { week: 'W7', spend: 41200, costPerResult: 43.0, roas: null },
  { week: 'W8', spend: 44300, costPerResult: 42.1, roas: null },
]

export interface BreakdownRow {
  label: string
  share: number
  metric: string
  accent: Accent
}

// Where spend lands and how each slice performs. Cold and retargeting are shown
// side by side but never compared as equivalent cohorts.
export const metaAudienceBreakdown: BreakdownRow[] = [
  { label: 'Retargeting', share: 22, metric: '$26 CPL', accent: 'emerald' },
  { label: 'Lookalike 1–3%', share: 31, metric: '$39 CPL', accent: 'blue' },
  { label: 'Cold Interest', share: 34, metric: '$48 CPL', accent: 'cyan' },
  { label: 'Re-engagement', share: 13, metric: '$31 CPL', accent: 'violet' },
]

export const metaPlacementBreakdown: BreakdownRow[] = [
  { label: 'Reels', share: 38, metric: '2.9% CTR', accent: 'pink' },
  { label: 'Feed', share: 33, metric: '2.1% CTR', accent: 'blue' },
  { label: 'Stories', share: 17, metric: '1.8% CTR', accent: 'violet' },
  { label: 'Advantage+', share: 12, metric: '2.4% CTR', accent: 'emerald' },
]

export interface AgentInsight {
  insight: string
  action: string
  lift: string
}

// What the reactor agent extracts from this data to brief the next campaign.
export const metaAgentInsights: AgentInsight[] = [
  {
    insight: 'Founder-led video is associated with a 38% lower cost per lead than static across cold audiences.',
    action: 'Prioritise Founder Concepts for cold prospecting in the next run.',
    lift: '−38% CPL',
  },
  {
    insight: '8–12 word hooks outperformed 13+ word hooks on hold rate in this sample.',
    action: 'Constrain hook length when drafting Copy + VSL openers.',
    lift: '+22% hold',
  },
  {
    insight: 'Retargeting produces leads at $26 vs $48 cold, yet takes only 22% of spend.',
    action: 'Shift 15% of budget to retargeting creative; deepen objection-handling angles.',
    lift: '−46% CPL',
  },
  {
    insight: 'Reels outperform Feed for UGC on cost per lead — a promising pattern, not yet confirmed.',
    action: 'Default UGC + testimonial concepts to 9:16 for Reels placement.',
    lift: '−19% CPL',
  },
]

// Headline figures for the learning-loop strip.
export const metaLearningStats = {
  signalsIngested: 6420,
  winnersLogged: 38,
  patternsUpdated: 17,
  lastSync: '4 min ago',
}
