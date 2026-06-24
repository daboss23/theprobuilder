import { Radar, Building2, Globe, Sparkles, MessageSquare, Clock } from 'lucide-react'
import { PageHeader, Panel, PanelHeader, ProgressBar, Pill } from '@/components/reactor/ui'
import { internalSources, externalSources, researchOutputs } from '@/lib/reactor-data'
import { vaultStats } from '@/lib/knowledge'
import { NOVA_SUBREDDITS, NOVA_FORUMS } from '@/lib/market-intelligence'
import { NovaResearch } from './NovaResearch'

export const dynamic = 'force-dynamic'

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

export default async function ResearchPage() {
  // Live count of what NOVA actually holds — her systems are research +
  // transformation. Degrades to the curated demo total when the store is empty.
  const stats = await vaultStats().catch(() => null)
  const novaIndexed =
    stats?.live && stats.groups.length
      ? stats.groups
          .filter((g) => g.system === 'research' || g.system === 'transformation')
          .reduce((s, g) => s + g.count, 0)
      : 0

  return (
    <>
      <PageHeader
        system="02"
        title="Research Intelligence"
        subtitle="NOVA's command center. Send her to where builders actually talk, mine the real conversations, and turn the language, beliefs, and desires into winning campaigns."
        tagline={
          novaIndexed > 0
            ? `${novaIndexed.toLocaleString()} market signals in NOVA's live memory`
            : 'Deploy NOVA to start building live market memory'
        }
      />

      <NovaResearch subreddits={NOVA_SUBREDDITS} forums={NOVA_FORUMS} />

      <Panel>
        <PanelHeader
          icon={<MessageSquare size={16} />}
          accent="violet"
          title="Where NOVA mines — recommended sources"
          subtitle="The highest-signal places a trades & construction audience talks. NOVA auto-sweeps these weekly; deploy her manually any time for a targeted dig."
          accessory={
            <Pill tone="primary">
              <Clock size={12} /> Auto-sweeps weekly
            </Pill>
          }
        />
        <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2">
          <div>
            <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-white/45">
              Reddit communities
            </p>
            <div className="flex flex-wrap gap-1.5">
              {NOVA_SUBREDDITS.map((s) => (
                <span
                  key={s.sub}
                  title={s.note}
                  className="rounded-md border border-border bg-surface/50 px-2.5 py-1 text-[12px] text-white/65"
                >
                  r/{s.sub}
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-white/45">
              Pro forums
            </p>
            <div className="space-y-2">
              {NOVA_FORUMS.map((f) => (
                <a
                  key={f.url}
                  href={f.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface/40 px-3 py-2 text-sm text-white/70 transition-colors hover:border-glow/40 hover:text-glow"
                >
                  <span className="font-medium">{f.name}</span>
                  <span className="truncate text-[11px] text-white/35">{f.note}</span>
                </a>
              ))}
              <p className="text-[11px] leading-relaxed text-white/35">
                Plus YouTube transcripts and any review or article URL. Facebook Groups & LinkedIn are
                login-walled — paste those conversations into the <span className="text-white/55">Paste</span> tab.
              </p>
            </div>
          </div>
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel>
          <PanelHeader
            icon={<Building2 size={16} />}
            accent="emerald"
            title="Internal Sources"
            subtitle="First-party signal from inside TPB"
          />
          <SourceList data={internalSources} />
        </Panel>
        <Panel>
          <PanelHeader
            icon={<Globe size={16} />}
            accent="cyan"
            title="External Sources"
            subtitle="Market signal from the wider builder world"
          />
          <SourceList data={externalSources} />
        </Panel>
      </div>

      <Panel>
        <PanelHeader
          icon={<Sparkles size={16} />}
          accent="violet"
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
