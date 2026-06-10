import { Sparkles, Video, Layers, Play, Megaphone } from 'lucide-react'
import { PageHeader, Panel, ProgressBar, Pill } from '@/components/reactor/ui'
import { creativeAnalyses } from '@/lib/reactor-data'

export default function CreativePage() {
  return (
    <>
      <PageHeader
        system="04"
        title="Creative Intelligence"
        subtitle="Study winning creatives. Reverse-engineer the structure, visual style, opening pattern, and CTA pattern behind every creative that has performed."
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: 'Static Ads', icon: Layers, n: 188 },
          { label: 'Video Ads', icon: Video, n: 137 },
          { label: 'Founder Videos', icon: Play, n: 96 },
          { label: 'UGC Concepts', icon: Megaphone, n: 64 },
        ].map((s) => (
          <Panel key={s.label} hover className="flex items-center gap-3 p-4">
            <span className="grid h-10 w-10 place-items-center rounded-lg border border-border bg-surface/60 text-glow">
              <s.icon size={18} />
            </span>
            <div>
              <p className="font-display text-2xl font-bold tabular text-white">{s.n}</p>
              <p className="text-[11px] text-white/40">{s.label}</p>
            </div>
          </Panel>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {creativeAnalyses.map((c) => (
          <Panel key={c.type} hover className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-surface/60 text-glow">
                  <Sparkles size={16} />
                </span>
                <div>
                  <h2 className="font-display text-base font-semibold text-white">{c.type}</h2>
                  <p className="text-[11px] text-white/40">{c.count} analyzed creatives</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-display text-xl font-bold tabular text-success">{c.winRate}%</p>
                <p className="text-[10px] text-white/35">win rate</p>
              </div>
            </div>
            <ProgressBar value={c.winRate} />
            <dl className="mt-4 space-y-2.5">
              {[
                { k: 'Creative Structure', v: c.structure },
                { k: 'Visual Style', v: c.visualStyle },
                { k: 'Opening Pattern', v: c.opening },
                { k: 'CTA Pattern', v: c.cta },
              ].map((row) => (
                <div key={row.k} className="grid grid-cols-[120px_1fr] gap-2">
                  <dt className="text-[11px] font-medium uppercase tracking-wider text-white/35">
                    {row.k}
                  </dt>
                  <dd className="text-sm text-white/70">{row.v}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-4">
              <Pill tone="primary">Creative Type: {c.type}</Pill>
            </div>
          </Panel>
        ))}
      </div>
    </>
  )
}
