import { GraduationCap, Lightbulb, BarChart3, ArrowRight } from 'lucide-react'
import { PageHeader, Panel } from '@/components/reactor/ui'
import { learnings } from '@/lib/reactor-data'

export default function LearningsPage() {
  return (
    <>
      <PageHeader
        system="07"
        title="Creative Learnings"
        subtitle="Document what works. Every insight is backed by evidence and turned into a recommendation the reactor applies to future campaigns."
      />

      <div className="space-y-4">
        {learnings.map((l, i) => (
          <Panel key={l.insight} hover className="p-5">
            <div className="flex items-start gap-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-border bg-surface/60 font-display text-sm font-bold text-glow">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div className="min-w-0 flex-1">
                <div className="mb-3 flex items-center gap-2">
                  <GraduationCap size={16} className="text-glow" />
                  <h2 className="font-display text-base font-semibold text-white">{l.insight}</h2>
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
    </>
  )
}
