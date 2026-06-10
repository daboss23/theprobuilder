import { Database, FolderOpen } from 'lucide-react'
import { PageHeader, Panel, PanelHeader, Pill } from '@/components/reactor/ui'
import { vaultCategories } from '@/lib/reactor-data'
import { vaultStats } from '@/lib/knowledge'
import { UploadGrid } from './UploadGrid'
import { VaultManager } from './VaultManager'

export const dynamic = 'force-dynamic'

export default async function KnowledgeVaultPage() {
  const stats = await vaultStats()

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeader
          system="01"
          title="Knowledge Vault"
          subtitle="The heart of the platform. Ingest and store 20+ years of TPB's creative knowledge, frameworks, SOPs, and member wins."
        />
        <Pill tone={stats.live ? 'success' : 'primary'}>
          <Database size={12} /> {stats.total.toLocaleString()}{' '}
          {stats.live ? 'assets stored' : 'assets mapped'}
        </Pill>
      </div>

      <Panel>
        <PanelHeader
          icon={<Database size={16} />}
          title="Ingest New Intelligence"
          subtitle="Drop a file or click to upload into the vault"
        />
        <div className="p-5">
          <UploadGrid />
        </div>
      </Panel>

      <VaultManager initialStats={{ live: stats.live, total: stats.total }} />

      <Panel>
        <PanelHeader
          icon={<FolderOpen size={16} />}
          title="Vault Categories"
          subtitle="Everything TPB knows, organized for the reactor"
        />
        <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
          {vaultCategories.map((cat) => (
            <div key={cat.group} className="rounded-xl border border-border bg-surface/40 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-display text-sm font-semibold text-white">{cat.group}</h3>
                <span className="font-mono text-[11px] text-white/30">
                  {cat.items.reduce((s, i) => s + i.count, 0).toLocaleString()}
                </span>
              </div>
              <ul className="space-y-1.5">
                {cat.items.map((item) => (
                  <li
                    key={item.name}
                    className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm text-white/60 transition-colors hover:bg-white/[0.03]"
                  >
                    <span>{item.name}</span>
                    <span className="font-display text-xs font-semibold tabular text-glow">
                      {item.count.toLocaleString()}
                    </span>
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
