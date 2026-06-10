'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Search,
  Plus,
  Loader2,
  Check,
  AlertCircle,
  Trash2,
  Database,
  FileText,
  FolderOpen,
  Sparkles,
} from 'lucide-react'
import { Panel, PanelHeader, Pill } from '@/components/reactor/ui'
import { vaultCategories } from '@/lib/reactor-data'
import type { KnowledgeSystem, VaultStatGroup } from '@/lib/knowledge'

interface VaultItem {
  id: string | null
  system: string
  category: string | null
  title: string
  content: string
  created_at: string | null
  similarity?: number
}

interface Stats {
  live: boolean
  total: number
  groups: VaultStatGroup[]
}

// Friendly labels for each intelligence system in the live category breakdown.
const SYSTEM_LABELS: Record<string, string> = {
  vault: 'Frameworks & SOPs',
  copy: 'Copy Assets',
  creative: 'Creative Assets',
  transformation: 'Transformation Assets',
  research: 'Research Intelligence',
  pattern: 'Patterns',
  learning: 'Learnings',
}

interface CategoryGroup {
  group: string
  items: { name: string; count: number }[]
}

// Roll the flat stat groups up into per-system cards for the categories panel.
function liveCategoryGroups(groups: VaultStatGroup[]): CategoryGroup[] {
  const bySystem = new Map<string, { name: string; count: number }[]>()
  for (const g of groups) {
    const items = bySystem.get(g.system) ?? []
    items.push({ name: g.category ?? 'Uncategorized', count: g.count })
    bySystem.set(g.system, items)
  }
  return Array.from(bySystem.entries())
    .map(([system, items]) => ({
      group: SYSTEM_LABELS[system] ?? system,
      items: items.sort((a, b) => b.count - a.count),
    }))
    .sort((a, b) => a.group.localeCompare(b.group))
}

const SYSTEMS: { value: KnowledgeSystem; label: string }[] = [
  { value: 'vault', label: 'Framework / SOP' },
  { value: 'copy', label: 'Copy · Hook / Headline' },
  { value: 'creative', label: 'Creative' },
  { value: 'transformation', label: 'Member Win' },
  { value: 'research', label: 'Research' },
  { value: 'pattern', label: 'Pattern' },
  { value: 'learning', label: 'Learning' },
]

const inputCls =
  'w-full rounded-lg border border-border bg-surface/60 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-glow focus:outline-none focus:ring-1 focus:ring-glow/40 transition-colors'

type IngestStatus =
  | { kind: 'idle' }
  | { kind: 'working' }
  | { kind: 'done'; chunks: number; stored: boolean }
  | { kind: 'error'; message: string }

export function VaultManager({ initialStats }: { initialStats: Stats }) {
  const [stats, setStats] = useState<Stats>(initialStats)
  const [items, setItems] = useState<VaultItem[]>([])
  const [loading, setLoading] = useState(true)
  const [live, setLive] = useState(initialStats.live)

  // Library search / filter
  const [query, setQuery] = useState('')
  const [systemFilter, setSystemFilter] = useState<'' | KnowledgeSystem>('')

  // Paste-text ingest form
  const [title, setTitle] = useState('')
  const [system, setSystem] = useState<KnowledgeSystem>('vault')
  const [category, setCategory] = useState('')
  const [content, setContent] = useState('')
  const [status, setStatus] = useState<IngestStatus>({ kind: 'idle' })

  const debounce = useRef<ReturnType<typeof setTimeout>>()

  const load = useCallback(async (q: string, sys: '' | KnowledgeSystem) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (q.trim()) params.set('q', q.trim())
      if (sys) params.set('system', sys)
      const [listRes, statsRes] = await Promise.all([
        fetch(`/api/vault/list?${params.toString()}`, { cache: 'no-store' }).then((r) => r.json()),
        fetch('/api/vault/stats', { cache: 'no-store' }).then((r) => r.json()),
      ])
      if (listRes.success) {
        setItems(listRes.items)
        setLive(listRes.live)
      }
      if (statsRes.success) {
        setStats({ live: statsRes.live, total: statsRes.total, groups: statsRes.groups ?? [] })
      }
    } catch {
      /* network error — leave existing state, surface nothing destructive */
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial load + react to query / filter changes (debounced).
  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current)
    debounce.current = setTimeout(() => load(query, systemFilter), 250)
    return () => {
      if (debounce.current) clearTimeout(debounce.current)
    }
  }, [query, systemFilter, load])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) return
    setStatus({ kind: 'working' })
    try {
      const res = await fetch('/api/vault/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system,
          title: title.trim(),
          category: category.trim() || null,
          content: content.trim(),
        }),
      }).then((r) => r.json())
      if (!res.success) throw new Error(res.error || 'Ingest failed')
      setStatus({ kind: 'done', chunks: res.chunks, stored: res.stored })
      setTitle('')
      setCategory('')
      setContent('')
      load(query, systemFilter)
    } catch (err) {
      setStatus({ kind: 'error', message: err instanceof Error ? err.message : 'Ingest failed' })
    }
  }

  const remove = async (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
    try {
      await fetch(`/api/vault/list?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
    } finally {
      load(query, systemFilter)
    }
  }

  const categoriesLive = live && stats.groups.length > 0
  const categoryGroups: CategoryGroup[] = categoriesLive
    ? liveCategoryGroups(stats.groups)
    : vaultCategories

  return (
    <>
      {/* ----------------------------- Paste ingest ---------------------------- */}
      <Panel>
        <PanelHeader
          icon={<Plus size={16} />}
          title="Add Knowledge as Text"
          subtitle="Paste a framework, hook, SOP, or member win — embedded into the reactor's brain in seconds"
        />
        <form onSubmit={submit} className="space-y-4 p-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="md:col-span-1">
              <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-white/40">
                Title
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. The 3-Beat Hook Framework"
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-white/40">
                Intelligence System
              </label>
              <select
                value={system}
                onChange={(e) => setSystem(e.target.value as KnowledgeSystem)}
                className={inputCls}
              >
                {SYSTEMS.map((s) => (
                  <option key={s.value} value={s.value} className="bg-surface text-white">
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-white/40">
                Category <span className="text-white/25">(optional)</span>
              </label>
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Hook Framework"
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-white/40">
              Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste the full framework, hook, SOP, transcript, or member story here…"
              rows={6}
              className={`${inputCls} resize-y leading-relaxed`}
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="text-[11px]">
              {status.kind === 'done' && (
                <span className="flex items-center gap-1.5 text-success">
                  <Check size={13} />
                  {status.stored
                    ? `Ingested · ${status.chunks} chunk${status.chunks === 1 ? '' : 's'} embedded`
                    : 'Captured (demo mode — configure Supabase + Voyage to persist)'}
                </span>
              )}
              {status.kind === 'error' && (
                <span className="flex items-center gap-1.5 text-danger">
                  <AlertCircle size={13} /> {status.message}
                </span>
              )}
            </div>
            <button
              type="submit"
              disabled={status.kind === 'working' || !title.trim() || !content.trim()}
              className="inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-medium text-glow transition-all hover:bg-primary/20 hover:shadow-glow disabled:cursor-not-allowed disabled:opacity-40"
            >
              {status.kind === 'working' ? (
                <>
                  <Loader2 size={15} className="animate-spin" /> Ingesting…
                </>
              ) : (
                <>
                  <Sparkles size={15} /> Ingest into Vault
                </>
              )}
            </button>
          </div>
        </form>
      </Panel>

      {/* ----------------------------- Library view ---------------------------- */}
      <Panel>
        <PanelHeader
          icon={<Database size={16} />}
          title="Vault Library"
          subtitle="Search and manage everything stored in the reactor's brain"
          accessory={
            <Pill tone={live ? 'success' : 'default'}>
              <Database size={12} />
              {live ? `${stats.total.toLocaleString()} stored` : 'Demo corpus'}
            </Pill>
          }
        />

        <div className="space-y-4 p-5">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search hooks, frameworks, member wins…"
                className={`${inputCls} pl-9`}
              />
            </div>
            <select
              value={systemFilter}
              onChange={(e) => setSystemFilter(e.target.value as '' | KnowledgeSystem)}
              className={`${inputCls} sm:w-56`}
            >
              <option value="" className="bg-surface text-white">
                All systems
              </option>
              {SYSTEMS.map((s) => (
                <option key={s.value} value={s.value} className="bg-surface text-white">
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {!live && (
            <p className="rounded-lg border border-border bg-surface/40 px-3 py-2 text-[11px] text-white/40">
              Showing the curated demo corpus. Configure Supabase + Voyage and run
              <span className="font-mono text-white/60"> supabase/schema.reactor.sql</span> to store and
              search TPB&apos;s real knowledge here.
            </p>
          )}

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-white/40">
              <Loader2 size={16} className="animate-spin" /> Loading vault…
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
              <FileText size={24} className="text-white/20" />
              <p className="text-sm text-white/40">
                {query || systemFilter
                  ? 'Nothing matches that search yet.'
                  : 'The vault is empty — paste your first framework above.'}
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {items.map((item, i) => (
                <li
                  key={item.id ?? `${item.title}-${i}`}
                  className="glass-hover group flex items-start gap-3 rounded-xl border border-border bg-surface/40 p-3.5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-sm font-medium text-white">{item.title}</h3>
                      <Pill tone="primary">{item.system}</Pill>
                      {item.category && <Pill>{item.category}</Pill>}
                      {typeof item.similarity === 'number' && (
                        <span className="font-mono text-[10px] text-glow/70">
                          {Math.round(item.similarity * 100)}% match
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-white/50">
                      {item.content}
                    </p>
                  </div>
                  {item.id && (
                    <button
                      type="button"
                      onClick={() => remove(item.id as string)}
                      aria-label={`Delete ${item.title}`}
                      className="shrink-0 rounded-lg border border-border p-2 text-white/30 opacity-0 transition-all hover:border-danger/40 hover:bg-danger/10 hover:text-danger group-hover:opacity-100"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </Panel>

      {/* ---------------------------- Vault categories ------------------------- */}
      <Panel>
        <PanelHeader
          icon={<FolderOpen size={16} />}
          title="Vault Categories"
          subtitle={
            categoriesLive
              ? "Live breakdown of what's actually stored in the reactor"
              : 'Everything TPB knows, organized for the reactor'
          }
          accessory={
            <Pill tone={categoriesLive ? 'success' : 'default'}>
              {categoriesLive ? `${stats.total.toLocaleString()} stored` : 'Demo map'}
            </Pill>
          }
        />
        <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
          {categoryGroups.map((cat) => (
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
