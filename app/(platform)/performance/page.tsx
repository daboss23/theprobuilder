import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Brain,
  DollarSign,
  Layers,
  Lightbulb,
  MousePointerClick,
  Minus,
  Package,
  Sparkles,
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
  type Accent,
} from '@/components/reactor/ui'
import { type MetaAd, type BreakdownRow } from '@/lib/meta-data'
import { resolveMetaDashboard } from '@/lib/meta-graph'
import { learnings, recommendations } from '@/lib/reactor-data'
import { listOutcomes, patternConfidence, VERDICT_LABELS, type Verdict } from '@/lib/outcomes'
import { cn } from '@/lib/utils'
import { MetaSyncButton } from './MetaSyncButton'

export const dynamic = 'force-dynamic'

const heroIcons: Record<string, LucideIcon> = {
  'Ad Spend': DollarSign,
  'Blended ROAS': TrendingUp,
  Conversions: Target,
  'Avg CTR': MousePointerClick,
}

const statusTone: Record<MetaAd['status'], 'success' | 'primary' | 'warning' | 'danger'> = {
  Scaling: 'success',
  Winner: 'success',
  Stable: 'primary',
  Testing: 'warning',
  Fatiguing: 'danger',
}

const verdictTone: Record<Verdict, 'success' | 'warning' | 'danger' | 'default'> = {
  winner: 'success',
  high_performer: 'success',
  average: 'warning',
  loser: 'danger',
  unknown: 'default',
  pending: 'default',
}

function BreakdownPanel({ rows }: { rows: BreakdownRow[] }) {
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
    </div>
  )
}

function LearningStat({ label, value, accent }: { label: string; value: string; accent: Accent }) {
  return (
    <div className={cn('rounded-xl border border-border bg-surface/40 p-3.5', accentClass[accent])}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">{label}</p>
      <p className="mt-1.5 font-display text-xl font-bold tabular text-white">{value}</p>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 mt-2 px-1 font-display text-sm font-semibold uppercase tracking-wider text-white/50">
      {children}
    </h2>
  )
}

export default async function PerformancePage() {
  const [
    {
      source,
      heroKpis: metaHeroKpis,
      metrics: metaMetrics,
      topAds: metaTopAds,
      spendTrend: metaSpendTrend,
      audienceBreakdown: metaAudienceBreakdown,
      placementBreakdown: metaPlacementBreakdown,
      agentInsights: metaAgentInsights,
      learningStats: metaLearningStats,
    },
    memory,
    outcomes,
  ] = await Promise.all([resolveMetaDashboard(), patternConfidence(), listOutcomes(12)])

  const live = source === 'live'
  const maxSpend = Math.max(...metaSpendTrend.map((w) => w.spend), 1)
  const hasMemory = memory.length > 0

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeader
          system="07"
          title="Performance Intelligence"
          subtitle="The closed loop, end to end. Live Meta results feed ORACLE's memory, winners compound the patterns the reactor reaches for next, and the recommendations below are engineered from everything that has already converted."
          tagline="Engineered For Performance."
        />
        <Pill tone={live ? 'success' : 'warning'}>
          <span
            className={cn('h-1.5 w-1.5 rounded-full', live ? 'dot-live animate-pulse-glow' : 'bg-warning')}
          />
          <span className="font-semibold uppercase tracking-[0.16em]">
            {live ? 'Live · Meta API' : 'Demo data'}
          </span>
        </Pill>
      </div>

      <div className="dashboard-console">
        {/* ── 1. LIVE SIGNAL — what is actually converting ──────────────── */}
        <SectionLabel>Live Meta Performance</SectionLabel>

        <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {metaHeroKpis.map((k) => {
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
                    <p className="truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-white/60">
                      {k.label}
                    </p>
                  </div>
                  <span className="accent-chip tabular">
                    <TrendIcon size={12} />
                    {k.delta.replace('+', '')}
                  </span>
                </div>
                <span className="relative mt-3 block font-display text-[2rem] font-bold leading-none tabular text-white">
                  {k.value}
                </span>
                <p className="mt-1 text-[11px] text-white/45">{k.sub}</p>
              </div>
            )
          })}
        </section>

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {metaMetrics.map((m) => (
            <div
              key={m.label}
              className={cn(
                'kpi-card kpi-card--compact flex items-center justify-between gap-4 p-4',
                accentClass[m.accent],
              )}
            >
              <div className="kpi-bloom" aria-hidden="true" />
              <div className="relative min-w-0">
                <p className="truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-white/55">
                  {m.label}
                </p>
                <p className="mt-1.5 truncate font-display text-xl font-bold text-white">{m.value}</p>
                <p className="mt-1 text-[11px] tabular text-white/45">{m.metric}</p>
              </div>
              <RadialGauge value={m.pct} accent={m.accent} />
            </div>
          ))}
        </section>

        <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1fr_1.1fr]">
          <Panel>
            <PanelHeader
              icon={<Activity size={16} />}
              accent="blue"
              title="Spend & ROAS Trend"
              subtitle="Weekly spend with blended return"
              accessory={<Pill tone="primary">8 weeks</Pill>}
            />
            <div className="p-5">
              <div className="flex h-44 items-end justify-between gap-2">
                {metaSpendTrend.map((w) => (
                  <div key={w.week} className="flex flex-1 flex-col items-center gap-2">
                    <span className="font-display text-[11px] font-bold tabular text-glow">
                      {w.roas}x
                    </span>
                    <div
                      className="w-full rounded-t-md bg-gradient-to-t from-primary/30 via-primary to-cyan shadow-[0_0_16px_-4px_rgba(45,190,255,0.7)]"
                      style={{ height: `${Math.round((w.spend / maxSpend) * 100)}%` }}
                    />
                    <span className="text-[10px] uppercase tracking-wider text-white/35">{w.week}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-[11px] text-white/45">
                <span>Bar height = weekly spend</span>
                <span className="text-glow/80">Label = ROAS</span>
              </div>
            </div>
          </Panel>

          <Panel>
            <PanelHeader
              icon={<Trophy size={16} />}
              accent="emerald"
              title="Top Performing Ads"
              subtitle="Ranked by ROAS across active creatives"
            />
            <div className="overflow-x-auto p-5">
              <table className="w-full min-w-[480px] text-sm">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-white/35">
                    <th className="pb-2 text-left font-medium">Creative</th>
                    <th className="pb-2 text-right font-medium">Spend</th>
                    <th className="pb-2 text-right font-medium">ROAS</th>
                    <th className="pb-2 text-right font-medium">CTR</th>
                    <th className="pb-2 text-right font-medium">CPA</th>
                    <th className="pb-2 text-right font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {metaTopAds.map((ad) => (
                    <tr key={ad.name} className="text-white/80">
                      <td className="py-2.5 pr-3">
                        <p className="font-medium text-white">{ad.name}</p>
                        <p className="text-[11px] text-white/35">{ad.format}</p>
                      </td>
                      <td className="py-2.5 text-right tabular">{ad.spend}</td>
                      <td className="py-2.5 text-right font-display font-bold tabular text-glow">
                        {ad.roas}x
                      </td>
                      <td className="py-2.5 text-right tabular">{ad.ctr}</td>
                      <td className="py-2.5 text-right tabular">{ad.cpa}</td>
                      <td className="py-2.5 text-right">
                        <Pill tone={statusTone[ad.status]}>{ad.status}</Pill>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>

        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          <Panel>
            <PanelHeader
              icon={<Users size={16} />}
              accent="violet"
              title="Audience Breakdown"
              subtitle="Spend share and return by segment"
            />
            <BreakdownPanel rows={metaAudienceBreakdown} />
          </Panel>
          <Panel>
            <PanelHeader
              icon={<Layers size={16} />}
              accent="pink"
              title="Placement Breakdown"
              subtitle="Spend share and CTR by placement"
            />
            <BreakdownPanel rows={metaPlacementBreakdown} />
          </Panel>
        </div>

        {/* ── 2. THE LEARNING LOOP — what the numbers taught ORACLE ──────── */}
        <SectionLabel>What ORACLE Learned</SectionLabel>

        <Panel>
          <PanelHeader
            icon={<Brain size={16} />}
            accent="amber"
            title="Reactor Learning Loop"
            subtitle="Live ad grades flow into ORACLE memory — winners re-ingest into the Vault"
            accessory={
              <div className="hidden items-center gap-2 sm:flex">
                <MetaSyncButton />
              </div>
            }
          />

          <div className="grid grid-cols-2 gap-3 px-5 pt-5 sm:grid-cols-4">
            <LearningStat label="Signals ingested" value={metaLearningStats.signalsIngested.toLocaleString()} accent="blue" />
            <LearningStat label="Winners logged" value={String(metaLearningStats.winnersLogged)} accent="emerald" />
            <LearningStat label="Patterns updated" value={String(metaLearningStats.patternsUpdated)} accent="violet" />
            <LearningStat label="Last sync" value={metaLearningStats.lastSync} accent="cyan" />
          </div>

          <div className="grid grid-cols-1 gap-4 p-5 lg:grid-cols-2">
            {metaAgentInsights.map((ins) => (
              <div
                key={ins.insight}
                className="recommendation-card glass-hover rounded-xl border border-border bg-surface/40 p-4"
              >
                <div className="mb-2 flex items-start justify-between gap-3">
                  <p className="text-sm font-medium text-white">{ins.insight}</p>
                  <Pill tone="success">{ins.lift}</Pill>
                </div>
                <div className="mt-2 flex items-start gap-2 rounded-lg border border-border bg-background/40 p-3">
                  <Sparkles size={13} className="mt-0.5 shrink-0 text-glow" />
                  <p className="text-xs leading-relaxed text-white/65">
                    <span className="text-glow/80">Agent action:</span> {ins.action}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-border px-5 py-4 text-[11px] leading-relaxed text-white/40">
            Winning ads and their performance are re-ingested into the knowledge layer as new
            patterns — every campaign the reactor fires gets sharper as Meta results compound.
            {!live && ' Connect the Meta Marketing API (META_ACCESS_TOKEN) to stream live performance into this view once real spend builds up.'}
          </div>
        </Panel>

        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          {/* Strategic Memory — pattern confidence learned from real outcomes */}
          <Panel>
            <PanelHeader
              icon={<Brain size={16} />}
              accent="pink"
              title="Strategic Memory"
              subtitle="What is winning, by pattern — confidence rises as proven outcomes accumulate."
              accessory={hasMemory ? <Pill tone="primary">{memory.length} patterns</Pill> : undefined}
            />
            {hasMemory ? (
              <div className="space-y-3 p-5">
                {memory.map((m) => (
                  <div key={m.pattern} className="rounded-lg border border-border bg-surface/40 p-3">
                    <div className="mb-1.5 flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2 text-sm font-medium text-white">
                        <Sparkles size={13} className="text-glow" />
                        {m.pattern}
                      </span>
                      <span className="text-[11px] text-white/45">
                        {m.wins}/{m.total} wins ·{' '}
                        <span className="font-semibold text-success">{m.confidence}% confidence</span>
                      </span>
                    </div>
                    <ProgressBar value={m.confidence} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid place-items-center px-6 py-14 text-center">
                <Trophy size={32} className="mb-3 text-white/15" />
                <p className="max-w-md text-sm text-white/40">
                  No outcomes logged yet. Mark concepts as Winner, High Performer, Average, or Loser
                  in the Campaign Reactor — each one teaches ORACLE which patterns win, and feeds the
                  recommendations below. (Logging persists with Supabase configured.)
                </p>
              </div>
            )}
          </Panel>

          {/* Recent outcomes feed */}
          <Panel>
            <PanelHeader
              icon={<BarChart3 size={16} />}
              accent="violet"
              title="Recent Outcomes"
              subtitle="The live record OPUS learns from."
            />
            {outcomes.length > 0 ? (
              <div className="divide-y divide-border">
                {outcomes.map((o) => (
                  <div key={o.id} className="flex items-start justify-between gap-3 px-5 py-3">
                    <div className="min-w-0">
                      <div className="mb-0.5 flex items-center gap-2">
                        <Pill tone="primary">{o.conceptType}</Pill>
                        {o.attributes.pattern && (
                          <span className="text-[11px] text-white/40">{o.attributes.pattern}</span>
                        )}
                      </div>
                      <p className="truncate text-sm text-white/70">{o.conceptText}</p>
                      <p className="mt-0.5 text-[11px] text-white/35">
                        {[o.angle, o.attributes.audience, o.attributes.awareness]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    </div>
                    <Pill tone={verdictTone[o.verdict]}>{VERDICT_LABELS[o.verdict]}</Pill>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid place-items-center px-6 py-14 text-center">
                <BarChart3 size={30} className="mb-3 text-white/15" />
                <p className="max-w-sm text-sm text-white/40">
                  No outcomes yet. Grade concepts in the Reactor and they appear here as the record
                  the agent learns from.
                </p>
              </div>
            )}
          </Panel>
        </div>

        {/* ── 3. WHAT TO MAKE NEXT — the output of the loop ─────────────── */}
        <SectionLabel>What To Make Next</SectionLabel>

        <div className="space-y-4">
          {recommendations.map((r) => (
            <Panel key={r.campaign} hover className="overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="panel-icon acc-amber grid h-10 w-10 place-items-center rounded-lg">
                    <Target size={18} />
                  </span>
                  <div>
                    <h2 className="font-display text-lg font-semibold text-white">{r.campaign}</h2>
                    <p className="text-xs text-white/40">Recommended campaign</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Pill tone={r.priority === 'Critical' ? 'danger' : 'warning'}>{r.priority}</Pill>
                  <div className="text-right">
                    <p className="font-display text-xl font-bold tabular text-glow">{r.confidence}%</p>
                    <p className="text-[10px] text-white/35">confidence</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 p-5 lg:grid-cols-[1.4fr_1fr]">
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-wider text-white/35">Reason</p>
                    <p className="mt-1 text-sm leading-relaxed text-white/70">{r.reason}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-background/40 p-3">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-white/35">
                      Suggested Hook
                    </p>
                    <p className="mt-1 font-display text-base italic text-white/90">“{r.suggestedHook}”</p>
                  </div>
                  <div>
                    <div className="mb-1 flex items-center justify-between text-[11px] text-white/40">
                      <span>Confidence index</span>
                      <span>{r.confidence}/100</span>
                    </div>
                    <ProgressBar value={r.confidence} />
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-surface/40 p-4">
                  <div className="mb-3 flex items-center gap-2 text-white/60">
                    <Package size={15} className="text-glow" />
                    <span className="text-[11px] font-medium uppercase tracking-wider">Assets Needed</span>
                  </div>
                  <ul className="space-y-2">
                    {r.assetsNeeded.map((a) => (
                      <li
                        key={a}
                        className="flex items-center justify-between rounded-lg border border-border bg-background/30 px-3 py-2 text-sm text-white/75"
                      >
                        {a}
                        <ArrowUpRight size={14} className="text-glow" />
                      </li>
                    ))}
                  </ul>
                  <a
                    href="/campaign-reactor"
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-4 py-2.5 text-sm font-medium text-glow transition-all hover:bg-primary/20"
                  >
                    Build in Reactor <ArrowUpRight size={15} />
                  </a>
                </div>
              </div>
            </Panel>
          ))}
        </div>

        {/* The rubric ORACLE applies during self-critique */}
        <SectionLabel>Creative Learnings Rubric</SectionLabel>
        <div className="space-y-4">
          {learnings.map((l, i) => (
            <Panel key={l.insight} hover className="p-5">
              <div className="flex items-start gap-4">
                <span className="panel-icon acc-emerald grid h-10 w-10 shrink-0 place-items-center rounded-lg font-display text-sm font-bold">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="mb-3 flex items-center gap-2">
                    <Lightbulb size={16} className="text-glow" />
                    <h3 className="font-display text-base font-semibold text-white">{l.insight}</h3>
                  </div>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="rounded-lg border border-border bg-surface/40 p-3">
                      <div className="mb-1 flex items-center gap-1.5 text-warning">
                        <BarChart3 size={13} />
                        <span className="text-[10px] font-medium uppercase tracking-wider">Evidence</span>
                      </div>
                      <p className="text-sm text-white/70">{l.evidence}</p>
                    </div>
                    <div className="rounded-lg border border-success/20 bg-success/[0.04] p-3">
                      <div className="mb-1 flex items-center gap-1.5 text-success">
                        <Lightbulb size={13} />
                        <span className="text-[10px] font-medium uppercase tracking-wider">
                          Recommendation
                        </span>
                      </div>
                      <p className="flex items-start gap-1.5 text-sm text-white/80">
                        <ArrowRight size={14} className="mt-0.5 shrink-0 text-success" />
                        {l.recommendation}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Panel>
          ))}
        </div>
      </div>
    </>
  )
}
