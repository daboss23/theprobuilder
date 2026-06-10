import { GitCompareArrows, ArrowDown, Heart, DollarSign, UserCheck, Megaphone } from 'lucide-react'
import { PageHeader, Panel, Pill } from '@/components/reactor/ui'
import { transformations } from '@/lib/reactor-data'

export default function TransformationPage() {
  return (
    <>
      <PageHeader
        system="03"
        title="Transformation Intelligence"
        subtitle="Study the transformations. This is where TPB's biggest marketing advantage lives — the before-and-after proof that turns skeptics into members."
      />

      <div className="space-y-6">
        {transformations.map((t) => (
          <Panel key={t.member} className="overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-surface/60 text-glow">
                  <GitCompareArrows size={16} />
                </span>
                <div>
                  <h2 className="font-display text-base font-semibold text-white">{t.member}</h2>
                  <p className="text-xs text-white/40">{t.type}</p>
                </div>
              </div>
              <Pill tone="success">Verified Transformation</Pill>
            </div>

            {/* Before -> After */}
            <div className="grid grid-cols-1 items-center gap-3 p-5 md:grid-cols-[1fr_auto_1fr]">
              <div className="rounded-xl border border-danger/25 bg-danger/[0.04] p-4">
                <p className="mb-3 text-[11px] font-medium uppercase tracking-widest text-danger/80">
                  Before
                </p>
                <div className="space-y-2">
                  {t.before.map((b) => (
                    <div key={b.label} className="flex items-center justify-between">
                      <span className="text-xs text-white/45">{b.label}</span>
                      <span className="font-display text-base font-bold tabular text-white/80">
                        {b.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-center md:flex-col">
                <span className="grid h-10 w-10 place-items-center rounded-full border border-primary/40 bg-primary/10 text-glow shadow-glow">
                  <ArrowDown size={18} className="md:rotate-0 -rotate-90" />
                </span>
              </div>

              <div className="rounded-xl border border-success/25 bg-success/[0.05] p-4">
                <p className="mb-3 text-[11px] font-medium uppercase tracking-widest text-success/90">
                  After
                </p>
                <div className="space-y-2">
                  {t.after.map((a) => (
                    <div key={a.label} className="flex items-center justify-between">
                      <span className="text-xs text-white/45">{a.label}</span>
                      <span className="font-display text-base font-bold tabular text-white">
                        {a.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Drivers */}
            <div className="grid grid-cols-1 gap-3 border-t border-border p-5 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { icon: Heart, label: 'Emotional Driver', value: t.emotional, tone: 'text-danger' },
                { icon: DollarSign, label: 'Financial Driver', value: t.financial, tone: 'text-success' },
                { icon: UserCheck, label: 'Identity Driver', value: t.identity, tone: 'text-glow' },
                { icon: Megaphone, label: 'Campaign Angles', value: t.angles.join(' · '), tone: 'text-warning' },
              ].map((d) => (
                <div key={d.label} className="rounded-lg border border-border bg-surface/40 p-3">
                  <div className="mb-1.5 flex items-center gap-2">
                    <d.icon size={14} className={d.tone} />
                    <span className="text-[10px] font-medium uppercase tracking-wider text-white/40">
                      {d.label}
                    </span>
                  </div>
                  <p className="text-sm text-white/75">{d.value}</p>
                </div>
              ))}
            </div>
          </Panel>
        ))}
      </div>
    </>
  )
}
