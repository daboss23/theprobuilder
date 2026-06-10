import { Anchor, Heading, Tag } from 'lucide-react'
import { PageHeader, Panel, PanelHeader, Pill } from '@/components/reactor/ui'
import { topHooks, topHeadlines, topOffers } from '@/lib/reactor-data'
import type { CopyItem } from '@/lib/reactor-data'

function CopyList({ items, rank }: { items: CopyItem[]; rank: string }) {
  return (
    <ol className="space-y-2.5 p-5">
      {items.map((item, i) => (
        <li
          key={item.text}
          className="glass-hover flex items-start gap-3 rounded-xl border border-border bg-surface/40 p-3"
        >
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary/10 font-display text-xs font-bold text-glow">
            {rank}
            {i + 1}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-white/85">{item.text}</p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <Pill tone="success">{item.metric}</Pill>
              <Pill>{item.angle}</Pill>
            </div>
          </div>
        </li>
      ))}
    </ol>
  )
}

export default function CopyPage() {
  return (
    <>
      <PageHeader
        system="04"
        title="Copy Intelligence"
        subtitle="Study winning copy. Decode the angle, emotion, belief, desire, objection, and offer inside every hook, headline, and primary text that converted."
      />

      <div className="flex flex-wrap gap-2">
        {['Angle', 'Emotion', 'Belief', 'Desire', 'Objection', 'Offer'].map((d) => (
          <Pill key={d} tone="primary">
            {d}
          </Pill>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Panel>
          <PanelHeader icon={<Anchor size={16} />} title="Top Performing Hooks" />
          <CopyList items={topHooks} rank="H" />
        </Panel>
        <Panel>
          <PanelHeader icon={<Heading size={16} />} title="Top Performing Headlines" />
          <CopyList items={topHeadlines} rank="L" />
        </Panel>
        <Panel>
          <PanelHeader icon={<Tag size={16} />} title="Top Performing Offers" />
          <CopyList items={topOffers} rank="O" />
        </Panel>
      </div>
    </>
  )
}
