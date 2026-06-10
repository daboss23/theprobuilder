import { Network } from 'lucide-react'
import { PageHeader, Panel, ProgressBar, Pill } from '@/components/reactor/ui'
import { patterns } from '@/lib/reactor-data'

export default function PatternsPage() {
  return (
    <>
      <PageHeader
        system="05"
        title="Pattern Intelligence"
        subtitle="Store repeatable winning patterns. Each pattern is a reusable blueprint — hook, headline, creative style, transformation, offer, and CTA that wins on repeat."
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {patterns.map((p) => (
          <Panel key={p.name} hover className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-surface/60 text-glow">
                  <Network size={16} />
                </span>
                <h2 className="font-display text-base font-semibold text-white">{p.name}</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-display text-sm font-bold tabular text-glow">
                  {p.strength}
                </span>
                <span className="text-[10px] text-white/35">strength</span>
              </div>
            </div>
            <ProgressBar value={p.strength} />

            <dl className="mt-4 grid grid-cols-1 gap-x-4 gap-y-2.5 sm:grid-cols-2">
              {[
                { k: 'Hook', v: p.hook },
                { k: 'Headline', v: p.headline },
                { k: 'Creative Style', v: p.creativeStyle },
                { k: 'Transformation', v: p.transformation },
                { k: 'Offer', v: p.offer },
                { k: 'CTA', v: p.cta },
              ].map((row) => (
                <div key={row.k}>
                  <dt className="text-[10px] font-medium uppercase tracking-wider text-white/35">
                    {row.k}
                  </dt>
                  <dd className="text-sm text-white/75">{row.v}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-4 rounded-lg border border-border bg-surface/40 p-3">
              <p className="text-[10px] font-medium uppercase tracking-wider text-white/35">Notes</p>
              <p className="mt-1 text-sm text-white/65">{p.notes}</p>
            </div>
          </Panel>
        ))}
      </div>
    </>
  )
}
