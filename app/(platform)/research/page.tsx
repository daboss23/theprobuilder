import { Radar, Building2, Globe, Sparkles } from 'lucide-react'
import { PageHeader, Panel, PanelHeader, ProgressBar, Pill } from '@/components/reactor/ui'
import { internalSources, externalSources, researchOutputs } from '@/lib/reactor-data'

function SourceList({ data }: { data: { name: string; count: number; signal: number }[] }) {
  return (
    <div className="space-y-3 p-5">
      {data.map((s) => (
        <div key={s.name} className="flex items-center gap-4">
          <div className="w-40 shrink-0">
            <p className="text-sm font-medium text-white">{s.name}</p>
            <p className="text-[11px] text-white/35">{s.count.toLocaleString()} sources</p>
          </div>
          <div className="flex-1">
            <ProgressBar value={s.signal} />
          </div>
          <span className="w-16 text-right">
            <span className="font-display text-sm font-bold tabular text-glow">{s.signal}</span>
            <span className="text-[10px] text-white/30"> sig</span>
          </span>
        </div>
      ))}
    </div>
  )
}

export default function ResearchPage() {
  return (
    <>
      <PageHeader
        system="02"
        title="Research Intelligence"
        subtitle="Understand the market. Mine internal and external signal into the language, beliefs, and desires that drive winning campaigns."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel>
          <PanelHeader
            icon={<Building2 size={16} />}
            title="Internal Sources"
            subtitle="First-party signal from inside TPB"
          />
          <SourceList data={internalSources} />
        </Panel>
        <Panel>
          <PanelHeader
            icon={<Globe size={16} />}
            title="External Sources"
            subtitle="Market signal from the wider builder world"
          />
          <SourceList data={externalSources} />
        </Panel>
      </div>

      <Panel>
        <PanelHeader
          icon={<Sparkles size={16} />}
          title="Extracted Outputs"
          subtitle="What the reactor learned from the research layer"
          accessory={<Pill tone="primary"><Radar size={12} /> Continuously mined</Pill>}
        />
        <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
          {researchOutputs.map((o) => (
            <div key={o.type} className="rounded-xl border border-border bg-surface/40 p-4">
              <h3 className="mb-3 font-display text-sm font-semibold text-white">{o.type}</h3>
              <ul className="space-y-2">
                {o.items.map((item) => (
                  <li key={item} className="flex gap-2 text-sm text-white/60">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-glow" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Panel>
    </>
  )
}
