import {
  Activity,
  Anchor,
  Atom,
  Banknote,
  Box,
  CircleDollarSign,
  Clock3,
  Crosshair,
  FolderOpen,
  FileText,
  Hexagon,
  Lightbulb,
  Network,
  Target,
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
import {
  reactorKpis,
  winningAngles,
  creativeHeatmap,
  heatmapMonths,
  recommendations,
  reactorStatus,
  performanceSignals,
} from '@/lib/reactor-data'
import { vaultStats } from '@/lib/knowledge'
import { cn } from '@/lib/utils'
import FireReactorButton from '@/components/FireReactorButton'

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

export default async function ReactorDashboard() {
  const stats = await vaultStats()

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeader
          title="Reactor Dashboard"
          subtitle="Mission control for The Professional Builder's creative intelligence. What should TPB create next, based on everything that has already worked?"
          tagline="Engineered For Performance."
        />
        <div className="flex items-center gap-2">
          <Pill tone="success">
            <span className="dot-live h-1.5 w-1.5 rounded-full animate-pulse-glow" />
            <span className="font-semibold uppercase tracking-[0.18em]">Live</span>
          </Pill>
          <Pill tone="primary">
            <Activity size={12} />
            <span className="font-semibold uppercase tracking-[0.14em] tabular">
              {stats.live
                ? `${stats.total.toLocaleString()} assets stored`
                : '2,847 assets synced'}
            </span>
          </Pill>
        </div>
      </div>

      <div className="mb-8 flex justify-center">
        <FireReactorButton />
      </div>

      <div className="dashboard-console">
        {/* KPI instruments — 2 rows of neon telemetry cards */}
        <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {reactorKpis.map((k, i) => {
            const id = kpiIdentity[k.label] ?? { accent: 'blue' as Accent, icon: Activity }
            return (
              <div key={k.label} className={cn('animate-fade-up', kpiStagger[i % kpiStagger.length])}>
                <KpiCard {...k} accent={id.accent} icon={id.icon} />
              </div>
            )
          })}
        </section>

        {/* Intelligence panels */}
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          {/* Top winning angles */}
          <Panel>
            <PanelHeader
              icon={<Network size={16} />}
              accent="blue"
              title="Top Winning Angles"
              subtitle="Ranked by win index across all campaigns"
            />
            <div className="space-y-2 p-5">
              {winningAngles.slice(0, 5).map((a) => {
                const Icon = angleIcons[a.name] ?? Hexagon
                return (
                  <div key={a.name} className="telemetry-row flex items-center gap-3">
                    <span className={cn('angle-tile', accentClass[a.accent])}>
                      <Icon size={15} />
                    </span>
                    <div className="w-32 shrink-0">
                      <p className="truncate text-sm font-medium text-white">{a.name}</p>
                      <p className="text-[11px] text-white/35">{a.campaigns} campaigns</p>
                    </div>
                    <div className="flex-1">
                      <ProgressBar value={a.score} />
                    </div>
                    <span className="w-9 text-right font-display text-sm font-bold tabular text-white">
                      {a.score}
                    </span>
                    <TrendBadge trend={a.trend} value={a.delta} />
                  </div>
                )
              })}
            </div>
            <PanelFooterLink href="/patterns">View All Angles</PanelFooterLink>
          </Panel>

          {/* Campaign reactor status */}
          <Panel>
            <PanelHeader
              icon={<Atom size={16} className="animate-pulse-glow" />}
              accent="cyan"
              title="Campaign Reactor Status"
              subtitle="Live pipeline telemetry"
            />
            <div className="space-y-4 p-5">
              {reactorStatus.map((s) => (
                <div key={s.label} className="telemetry-row">
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-xs text-white/55">{s.label}</span>
                    <span className="font-display text-sm font-bold tabular text-white">
                      {s.value.toLocaleString()}
                      <span className="font-medium text-white/30"> / {s.total.toLocaleString()}</span>
                    </span>
                  </div>
                  <ProgressBar value={s.value} max={s.total} />
                </div>
              ))}
            </div>
            <PanelFooterLink href="/campaign-reactor">View Pipeline</PanelFooterLink>
          </Panel>
        </div>

        {/* Heatmap */}
        <Panel>
          <PanelHeader
            icon={<Activity size={16} />}
            accent="violet"
            title="Creative Intelligence Heatmap"
            subtitle="Signal intensity by dimension over the last 6 months"
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
                  {heatmapMonths.map((m) => (
                    <th
                      key={m}
                      className="px-2 text-center text-[11px] font-medium uppercase tracking-wider text-white/35"
                    >
                      {m}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {creativeHeatmap.map((row) => (
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
            accessory={<Pill tone="primary">24 ready</Pill>}
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
          {performanceSignals.map((p, i) => (
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

    </>
  )
}
