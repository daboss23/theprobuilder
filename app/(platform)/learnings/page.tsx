import { Brain, Lightbulb, BarChart3, ArrowRight, Trophy, Sparkles } from 'lucide-react'
import { PageHeader, Panel, PanelHeader, Pill, ProgressBar } from '@/components/reactor/ui'
import { learnings } from '@/lib/reactor-data'
import { listOutcomes, patternConfidence, VERDICT_LABELS, type Verdict } from '@/lib/outcomes'

export const dynamic = 'force-dynamic'

const verdictTone: Record<Verdict, 'success' | 'warning' | 'danger' | 'default'> = {
  winner: 'success',
  high_performer: 'success',
  average: 'warning',
  loser: 'danger',
  unknown: 'default',
  pending: 'default',
}

export default async function PerformanceIntelligencePage() {
  const [memory, outcomes] = await Promise.all([patternConfidence(), listOutcomes(12)])
  const hasMemory = memory.length > 0

  return (
    <>
      <PageHeader
        system="07"
        title="Performance Intelligence"
        subtitle="ORACLE's strategic memory. Every logged outcome compounds — winners strengthen the patterns the reactor reaches for next, so each campaign improves the one after it."
        tagline="Engineered For Performance"
      />

      {/* Strategic Memory — pattern confidence learned from real outcomes */}
      <Panel>
        <PanelHeader
          icon={<Brain size={16} />}
          accent="pink"
          title="Strategic Memory"
          subtitle="What is winning, by pattern — confidence rises as proven outcomes accumulate."
          accessory={hasMemory ? <Pill tone="primary">{memory.length} patterns tracked</Pill> : undefined}
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
              No outcomes logged yet. Mark concepts as Winner, High Performer, Average, or Loser in
              the Campaign Reactor — each one teaches ORACLE which patterns win, and feeds future
              recommendations. (Logging persists with Supabase configured.)
            </p>
          </div>
        )}
      </Panel>

      {/* Recent outcomes feed */}
      {outcomes.length > 0 && (
        <Panel>
          <PanelHeader
            icon={<BarChart3 size={16} />}
            accent="violet"
            title="Recent Outcomes"
            subtitle="The live record OPUS learns from."
          />
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
        </Panel>
      )}

      {/* The rubric ORACLE applies during self-critique */}
      <div>
        <h2 className="mb-3 px-1 font-display text-sm font-semibold uppercase tracking-wider text-white/50">
          Creative Learnings Rubric
        </h2>
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
