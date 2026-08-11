import Link from 'next/link'
import {
  Activity,
  DollarSign,
  Gauge,
  Layers,
  Minus,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
  Users,
  type LucideIcon,
} from 'lucide-react'
import {
  PageHeader,
  Panel,
  PanelHeader,
  Pill,
  ProgressBar,
  RadialGauge,
  accentClass,
} from '@/components/reactor/ui'
import { InfoTip } from '@/components/reactor/Explain'
import { CreativeLeaderboard } from '@/components/reactor/CreativeLeaderboard'
import { RESULT_LABELS, thresholdSummary } from '@/lib/creative-status'
import { type BreakdownRow } from '@/lib/meta-data'
import { resolveMetaDashboard } from '@/lib/meta-graph'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

/* ----------------------------------------------------------------------------
   Meta Intelligence — the evidence page. It answers "what happened".

   The layout is unchanged; the semantics are not. There is no such thing as a
   blended "conversion" here: every result carries its type, every cost names
   the result it is the cost of, and ROAS only appears when real revenue is
   connected. What it all MEANS, and what to do next, lives on the Reactor
   Dashboard.
---------------------------------------------------------------------------- */

const heroIcons: Record<string, LucideIcon> = {
  'Ad Spend': DollarSign,
  'Primary Results': Target,
  'Cost per Result': Gauge,
  'Result Efficiency': Activity,
  ROAS: TrendingUp,
}

function BreakdownPanel({ rows, note }: { rows: BreakdownRow[]; note: string }) {
  return (
    <div className="space-y-3 p-5">
      {rows.map((r) => (
        <div key={r.label} className="telemetry-row flex items-center gap-3">
          <div className="w-28 shrink-0">
            <p className="truncate text-sm font-medium text-white">{r.label}</p>
            <p className="text-[11px] text-white/35">{r.metric}</p>
          </div>
          <div className="flex-1">
            <ProgressBar value={r.share} />
          </div>
          <span className="w-10 text-right font-display text-sm font-bold tabular text-white">
            {r.share}%
          </span>
        </div>
      ))}
      <p className="border-t border-border pt-3 text-[11px] leading-relaxed text-white/35">{note}</p>
    </div>
  )
}

export default async function MetaIntelligencePage() {
  const {
    source,
    heroKpis,
    metrics,
    topAds,
    spendTrend,
    audienceBreakdown,
    placementBreakdown,
    resultMix,
    primaryResultType,
    revenueConnected,
    thresholds,
  } = await resolveMetaDashboard()

  const live = source === 'live'
  const maxSpend = Math.max(...spendTrend.map((w) => w.spend), 1)
  const resultLabel = RESULT_LABELS[primaryResultType]

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeader
          system="06"
          title="Meta Intelligence"
          subtitle={`The performance record: what each creative spent, what it produced, and what that cost — read straight from the Meta Marketing API. Results are counted by type and never blended. What it means, and what to build next, lives on the Reactor Dashboard.`}
          tagline="Engineered For Performance."
        />
        <div className="flex flex-wrap items-center gap-2">
          <Pill tone={live ? 'success' : 'warning'}>
            <span
              className={cn('h-1.5 w-1.5 rounded-full', live ? 'dot-live animate-pulse-glow' : 'bg-warning')}
            />
            <span className="font-semibold uppercase tracking-[0.16em]">
              {live ? 'Live · Meta API' : 'Demo data'}
            </span>
          </Pill>
        </div>
      </div>

      <div className="dashboard-console">
        {/* Hero KPIs — objective-aware, every number defined */}
        <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {heroKpis.map((k) => {
            const Icon = heroIcons[k.label] ?? Activity
            const TrendIcon =
              k.trend === 'down' ? TrendingDown : k.trend === 'flat' ? Minus : TrendingUp
            return (
              <div key={k.label} className={cn('kpi-card group p-4', accentClass[k.accent])}>
                <div className="kpi-bloom" aria-hidden="true" />
                <div className="relative flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="kpi-icon">
                      <Icon size={20} />
                    </span>
                    <p className="flex min-w-0 items-center gap-1 text-[9.5px] font-semibold uppercase leading-tight tracking-[0.1em] text-white/60">
                      {k.label}
                      {k.definition && <InfoTip label={k.label}>{k.definition}</InfoTip>}
                    </p>
                  </div>
                  {k.delta && (
                    <span className="accent-chip tabular">
                      <TrendIcon size={12} />
                      {k.delta.replace('+', '')}
                    </span>
                  )}
                </div>
                <span className="relative mt-3 block font-display text-[2rem] font-bold leading-none tabular text-white">
                  {k.value}
                </span>
                <p className="mt-1 text-[11px] text-white/45">{k.sub}</p>

                {/* A mixed total is never left as one number — the split is right here. */}
                {k.breakdown && k.breakdown.length > 1 && (
                  <ul className="relative mt-3 space-y-1 border-t border-border pt-2.5">
                    {k.breakdown.map((slice) => (
                      <li
                        key={slice.type}
                        className="flex items-center justify-between gap-2 text-[11px]"
                      >
                        <span className="truncate text-white/45">
                          {RESULT_LABELS[slice.type].many}
                        </span>
                        <span className="tabular text-white/75">
                          {slice.count.toLocaleString()}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )
          })}
        </section>

        {/* Efficiency + creative-quality read-outs */}
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {metrics.map((m) => (
            <div
              key={m.label}
              className={cn(
                'kpi-card kpi-card--compact flex items-center justify-between gap-4 p-4',
                accentClass[m.accent],
              )}
            >
              <div className="kpi-bloom" aria-hidden="true" />
              <div className="relative min-w-0">
                <p className="flex items-center gap-1 text-[9.5px] font-semibold uppercase leading-tight tracking-[0.1em] text-white/55">
                  {m.label}
                  {m.definition && <InfoTip label={m.label}>{m.definition}</InfoTip>}
                </p>
                <p className="mt-1.5 truncate font-display text-xl font-bold text-white">{m.value}</p>
                <p className="mt-1 text-[11px] tabular text-white/45">{m.metric}</p>
              </div>
              <RadialGauge value={m.pct} accent={m.accent} />
            </div>
          ))}
        </section>

        {/* Spend / efficiency trend + Top ads */}
        <div className="grid grid-cols-1 gap-3">
          <Panel>
            <PanelHeader
              icon={<Activity size={16} />}
              accent="blue"
              title={revenueConnected ? 'Spend & ROAS Trend' : 'Spend & Cost per Result Trend'}
              subtitle={
                revenueConnected
                  ? 'Weekly spend with connected revenue return'
                  : `Weekly spend with ${resultLabel.cost} — the efficiency line for a lead account`
              }
              accessory={<Pill tone="primary">8 weeks</Pill>}
            />
            <div className="p-5">
              <div className="flex h-44 items-end justify-between gap-2">
                {spendTrend.map((w) => (
                  <div key={w.week} className="flex h-full flex-1 flex-col items-center gap-2">
                    <span className="font-display text-[11px] font-bold tabular text-glow">
                      {revenueConnected && w.roas !== null
                        ? `${w.roas}x`
                        : w.costPerResult > 0
                          ? `$${Math.round(w.costPerResult)}`
                          : '—'}
                    </span>
                    <div className="flex w-full flex-1 items-end">
                      <div
                        className="w-full rounded-t-md bg-gradient-to-t from-primary/30 via-primary to-cyan shadow-[0_0_16px_-4px_rgba(45,190,255,0.7)]"
                        style={{ height: `${Math.round((w.spend / maxSpend) * 100)}%` }}
                      />
                    </div>
                    <span className="text-[10px] uppercase tracking-wider text-white/35">{w.week}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-[11px] text-white/45">
                <span>Bar height = weekly spend</span>
                <span className="flex items-center gap-1 text-glow/80">
                  Label = {revenueConnected ? 'ROAS' : resultLabel.cost}
                  <InfoTip label={revenueConnected ? 'ROAS' : resultLabel.cost} align="right">
                    {revenueConnected
                      ? 'Purchase ROAS reported by Meta for the week.'
                      : `Weekly spend divided by ${resultLabel.many}. ROAS is not shown because no revenue or defensible conversion value is connected to these campaigns — an assigned lead value would not be a return.`}
                  </InfoTip>
                </span>
              </div>
            </div>
          </Panel>

          <Panel>
            <PanelHeader
              icon={<Trophy size={16} />}
              accent="emerald"
              title="Top Performing Ads"
              subtitle={`Ranked by ${resultLabel.cost} — click a status for the evidence behind it`}
              accessory={
                <InfoTip label="Ranking rules" align="right">
                  Ranked within a comparable cohort only. Creatives below the evaluation threshold
                  ({thresholdSummary(thresholds)}) are shown as Insufficient data rather than forced
                  into a ranking.
                </InfoTip>
              }
            />
            <CreativeLeaderboard
              ads={topAds}
              thresholds={thresholds}
              revenueConnected={revenueConnected}
              variant="full"
              interactiveStatus
              hrefFor={(ad) => `/ad-library?creative=${encodeURIComponent(ad.id)}`}
            />
          </Panel>
        </div>

        {/* Breakdowns */}
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          <Panel>
            <PanelHeader
              icon={<Users size={16} />}
              accent="violet"
              title="Audience Breakdown"
              subtitle={`Spend share and ${resultLabel.cost} by segment`}
            />
            <BreakdownPanel
              rows={audienceBreakdown}
              note="Cold prospecting and retargeting are shown side by side, not compared as equivalent cohorts — a retargeting cost per result is not evidence that a creative beats a cold one."
            />
          </Panel>
          <Panel>
            <PanelHeader
              icon={<Layers size={16} />}
              accent="pink"
              title="Placement Breakdown"
              subtitle="Spend share and CTR by placement"
            />
            <BreakdownPanel
              rows={placementBreakdown}
              note="CTR by placement is a delivery signal, not a commercial verdict. Judge placements on cost per result before shifting budget."
            />
          </Panel>
        </div>

        {/* Result mix + hand-off back to the decision surface */}
        <Panel>
          <PanelHeader
            icon={<Target size={16} />}
            accent="cyan"
            title="Result Mix"
            subtitle="Every result type counted separately — the account total is never one blended number"
          />
          <div className="flex flex-wrap items-center gap-3 p-5">
            {resultMix.map((slice) => (
              <div
                key={slice.type}
                className="rounded-xl border border-border bg-surface/40 px-4 py-3"
              >
                <p className="font-display text-lg font-bold tabular text-white">
                  {slice.count.toLocaleString()}
                </p>
                <p className="text-[11px] text-white/45">{RESULT_LABELS[slice.type].many}</p>
              </div>
            ))}
            <Link href="/" className="brief-cta !mt-0 ml-auto">
              What this means → Reactor Dashboard
            </Link>
          </div>
        </Panel>
      </div>
    </>
  )
}
