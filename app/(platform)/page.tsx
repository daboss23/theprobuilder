import {
  Activity,
  Anchor,
  ArrowUpRight,
  Atom,
  Banknote,
  Box,
  CircleDollarSign,
  Clapperboard,
  Clock3,
  Crosshair,
  Cpu,
  FolderOpen,
  FileText,
  Hexagon,
  Lightbulb,
  Network,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  Users,
  type LucideIcon,
} from 'lucide-react'
import {
  KpiCard,
  Panel,
  PanelHeader,
  PanelFooterLink,
  PageHeader,
  ProgressBar,
  Pill,
  RadialGauge,
  TrendBadge,
  accentClass,
  type Accent,
} from '@/components/reactor/ui'
import { GrowthAreaChart } from '@/components/reactor/charts/GrowthAreaChart'
import { WinRateDonut } from '@/components/reactor/charts/WinRateDonut'
import { recommendations } from '@/lib/reactor-data'
import { getDashboardData, winningAngles } from '@/lib/dashboard-data'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

// Accent channel + icon identity for each KPI instrument, mirroring the
// command-center mockup: blue / emerald / violet / cyan / pink / amber.
const kpiIdentity: Record<string, { accent: Accent; icon: LucideIcon }> = {
  'Knowledge Assets': { accent: 'blue', icon: FolderOpen },
  'Winning Creatives': { accent: 'emerald', icon: Crosshair },
  'Winning Hooks': { accent: 'violet', icon: Anchor },
  Frameworks: { accent: 'cyan', icon: Box },
  SOPs: { accent: 'emerald', icon: FileText },
  'Member Wins': { accent: 'pink', icon: Trophy },
  'Patterns Identified': { accent: 'amber', icon: Hexagon },
  'Campaign Ideas Ready': { accent: 'blue', icon: Lightbulb },
}

const angleIcons: Record<string, LucideIcon> = {
  Profit: CircleDollarSign,
  Systems: Box,
  'Time Freedom': Clock3,
  Leadership: Users,
  Cashflow: Banknote,
}

const activityIcons: Record<string, LucideIcon> = {
  ingest: FolderOpen,
  render: Clapperboard,
  outcome: Trophy,
}

const kpiStagger = [
  'stagger-1',
  'stagger-2',
  'stagger-3',
  'stagger-4',
  'stagger-5',
  'stagger-6',
  'stagger-7',
  'stagger-8',
]

function heatLevel(v: number): string {
  if (v >= 85) return 'heat-l4'
  if (v >= 70) return 'heat-l3'
  if (v >= 55) return 'heat-l2'
  if (v >= 40) return 'heat-l1'
  return 'heat-l0'
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.round(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.round(hrs / 24)}d ago`
}

export default async function ReactorDashboard() {
  const data = await getDashboardData()

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeader
          title="Reactor Dashboard"
          subtitle="Mission control for The Professional Builder's creative intelligence. What should TPB create next, based on everything that has already worked?"
          tagline="Engineered For Performance."
        />
        <div className="flex items-center gap-2">
          <Pill tone={data.live ? 'success' : 'primary'}>
            <span className="dot-live h-1.5 w-1.5 rounded-full animate-pulse-glow" />
            <span className="font-semibold uppercase tracking-[0.18em]">
              {data.live ? 'Live' : 'Demo'}
            </span>
          </Pill>
          <Pill tone="primary">
            <Activity size={12} />
            <span className="font-semibold uppercase tracking-[0.14em] tabular">
              {data.total.toLocaleString()} assets {data.live ? 'stored' : 'mapped'}
            </span>
          </Pill>
        </div>
      </div>

      <div className="dashboard-console">
        {/* KPI instruments — neon telemetry cards with live counts + sparklines */}
        <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {data.kpis.map((k, i) => {
            const id = kpiIdentity[k.label] ?? { accent: 'blue' as Accent, icon: Activity }
            return (
              <div key={k.label} className={cn('animate-fade-up', kpiStagger[i % kpiStagger.length])}>
                <KpiCard
                  label={k.label}
                  value={k.value}
                  delta={k.delta}
                  trend={k.trend}
                  accent={id.accent}
                  icon={id.icon}
                  spark={k.spark}
                />
              </div>
            )
          })}
        </section>

        {/* Hero analytics: intelligence growth + concept win rate */}
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
          <Panel className="xl:col-span-2">
            <PanelHeader
              icon={<TrendingUp size={16} />}
              accent="cyan"
              title="Intelligence Growth"
              subtitle="Cumulative knowledge assets — is the Vault compounding?"
              accessory={
                <Pill tone="primary">
                  <span className="tabular">+{data.growth[data.growth.length - 1].added}</span> this week
                </Pill>
              }
            />
            <div className="p-5 pt-3">
              <GrowthAreaChart data={data.growth} />
            </div>
          </Panel>

          <Panel>
            <PanelHeader
              icon={<Trophy size={16} />}
              accent="emerald"
              title="Concept Win Rate"
              subtitle="Outcomes from generated campaigns"
            />
            <div className="p-5">
              <WinRateDonut outcomes={data.outcomes} />
              {data.outcomes.metrics.length > 0 && (
                <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-4">
                  {data.outcomes.metrics.map((m) => (
                    <div key={m.name} className="text-center">
                      <p className="font-display text-lg font-bold tabular text-glow">{m.value}</p>
                      <p className="text-[10px] uppercase tracking-wider text-white/40">{m.name}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Panel>
        </div>

        {/* Intelligence panels: angles · agent fuel · activity */}
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
          {/* Top winning angles */}
          <Panel>
            <PanelHeader
              icon={<Network size={16} />}
              accent="blue"
              title="Top Winning Angles"
              subtitle="Ranked by win index"
            />
            <div className="space-y-2 p-5">
              {winningAngles.slice(0, 5).map((a) => {
                const Icon = angleIcons[a.name] ?? Hexagon
                return (
                  <div key={a.name} className="telemetry-row flex items-center gap-3">
                    <span className={cn('angle-tile', accentClass[a.accent])}>
                      <Icon size={15} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white">{a.name}</p>
                      <ProgressBar value={a.score} />
                    </div>
                    <span className="w-8 text-right font-display text-sm font-bold tabular text-white">
                      {a.score}
                    </span>
                    <TrendBadge trend={a.trend} value={a.delta} />
                  </div>
                )
              })}
            </div>
            <PanelFooterLink href="/patterns">View All Angles</PanelFooterLink>
          </Panel>

          {/* Agent fuel — which intelligence systems are loaded into the agent */}
          <Panel>
            <PanelHeader
              icon={<Cpu size={16} className="animate-pulse-glow" />}
              accent="violet"
              title="Agent Fuel"
              subtitle="Intelligence systems feeding the reactor"
            />
            <div className="space-y-3 p-5">
              {data.systemLoad.slice(0, 6).map((s) => (
                <div key={s.system} className="telemetry-row flex items-center gap-3">
                  <span className={cn('angle-tile', accentClass[s.accent])}>
                    <Atom size={14} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="truncate text-sm font-medium text-white">{s.label}</span>
                      <span className="font-display text-xs font-bold tabular text-white/70">
                        {s.count.toLocaleString()}
                      </span>
                    </div>
                    <ProgressBar value={s.pct} />
                  </div>
                </div>
              ))}
            </div>
            <PanelFooterLink href="/network">View Agent Network</PanelFooterLink>
          </Panel>

          {/* Recent activity — live pulse of the reactor */}
          <Panel>
            <PanelHeader
              icon={<Activity size={16} />}
              accent="cyan"
              title="Recent Activity"
              subtitle="Latest ingests, renders & outcomes"
            />
            <div className="p-5">
              <ul className="space-y-3">
                {data.activity.map((e, i) => {
                  const Icon = activityIcons[e.kind] ?? Sparkles
                  return (
                    <li key={i} className="flex items-start gap-3">
                      <span className={cn('angle-tile h-7 w-7 shrink-0', accentClass[e.accent])}>
                        <Icon size={12} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-white">{e.label}</p>
                        <p className="truncate text-[11px] text-white/40">{e.detail}</p>
                      </div>
                      <span className="shrink-0 text-[10px] tabular text-white/30">
                        {timeAgo(e.at)}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </div>
          </Panel>
        </div>

        {/* Live heatmap — where intelligence is accumulating, by month */}
        <Panel>
          <PanelHeader
            icon={<Activity size={16} />}
            accent="violet"
            title="Creative Intelligence Heatmap"
            subtitle="Signal intensity by system over the last 6 months"
            accessory={
              <div className="hidden items-center gap-2 text-[11px] text-white/40 sm:flex">
                <span>Low</span>
                <span className="h-2 w-24 rounded-full bg-gradient-to-r from-border via-primary to-cyan shadow-[0_0_10px_-2px_rgba(34,211,238,0.7)]" />
                <span>High</span>
              </div>
            }
          />
          <div className="overflow-x-auto p-5">
            <table className="w-full min-w-[560px] border-separate border-spacing-1.5">
              <thead>
                <tr>
                  <th className="w-40" />
                  {data.heatmap.months.map((m, i) => (
                    <th
                      key={`${m}-${i}`}
                      className="px-2 text-center text-[11px] font-medium uppercase tracking-wider text-white/35"
                    >
                      {m}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.heatmap.rows.map((row) => (
                  <tr key={row.dimension}>
                    <td className="pr-3 text-sm font-medium text-white/70">{row.dimension}</td>
                    {row.cells.map((c, i) => (
                      <td key={i}>
                        <div
                          className={cn(
                            'heat-cell grid h-9 place-items-center rounded-md text-[11px] font-semibold tabular text-white/90 transition-transform hover:scale-105',
                            heatLevel(c),
                          )}
                        >
                          {c}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        {/* Strategic recommendations */}
        <Panel>
          <PanelHeader
            icon={<Target size={16} />}
            accent="amber"
            title="Strategic Recommendations"
            subtitle="AI-generated next moves for TPB"
            accessory={<Pill tone="primary">{recommendations.length} ready</Pill>}
          />
          <div className="grid grid-cols-1 gap-4 p-5 lg:grid-cols-3">
            {recommendations.map((r) => (
              <div
                key={r.campaign}
                className="recommendation-card glass-hover rounded-xl border border-border bg-surface/40 p-4"
              >
                <div className="mb-2 flex items-center justify-between">
                  <Pill tone={r.priority === 'Critical' ? 'danger' : 'warning'}>{r.priority}</Pill>
                  <span className="font-display text-sm font-bold tabular text-glow">
                    {r.confidence}%
                  </span>
                </div>
                <h3 className="font-display text-base font-semibold text-white">{r.campaign}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-white/50">{r.reason}</p>
                <div className="mt-3 rounded-lg border border-border bg-background/40 p-3">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-white/35">
                    Suggested Hook
                  </p>
                  <p className="mt-1 text-sm italic text-white/80">“{r.suggestedHook}”</p>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {r.assetsNeeded.map((a) => (
                    <Pill key={a}>{a}</Pill>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Panel>

        {/* Compact performance read-outs */}
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {data.performanceSignals.map((p, i) => (
            <div
              key={p.label}
              className={cn(
                'kpi-card kpi-card--compact animate-fade-up flex items-center justify-between gap-4 p-4',
                accentClass[p.accent],
                kpiStagger[i % kpiStagger.length],
              )}
            >
              <div className="kpi-bloom" aria-hidden="true" />
              <div className="relative min-w-0">
                <p className="truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-white/55">
                  {p.label}
                </p>
                <p className="mt-1.5 truncate font-display text-xl font-bold text-white">
                  {p.value}
                </p>
                <p className="mt-1 text-[11px] tabular text-white/45">{p.metric}</p>
              </div>
              <RadialGauge value={p.pct} accent={p.accent} />
            </div>
          ))}
        </section>
      </div>

      <div className="flex justify-center pb-2">
        <a
          href="/campaign-reactor?modal=open"
          className="fire-btn inline-flex items-center gap-2 rounded-xl px-6 py-3 font-display text-sm font-semibold text-white"
        >
          New Creative Campaign <ArrowUpRight size={16} />
        </a>
      </div>
    </>
  )
}
