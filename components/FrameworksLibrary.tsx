'use client'

import { useCallback, useEffect, useState } from 'react'
import { FrameworkForm } from './FrameworkForm'
import type { Builder, Framework, FrameworkCategory } from '@/types'

type CategoryFilter = 'all' | FrameworkCategory

const CATEGORY_TABS: { value: CategoryFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'copy', label: 'Copy' },
  { value: 'hook', label: 'Hook' },
  { value: 'image', label: 'Image' },
  { value: 'video', label: 'Video' },
]

const CATEGORY_COLOURS: Record<FrameworkCategory, string> = {
  copy: 'bg-sky-500/15 text-sky-300 border-sky-500/20',
  hook: 'bg-amber-500/15 text-amber-300 border-amber-500/20',
  image: 'bg-violet-500/15 text-violet-300 border-violet-500/20',
  video: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20',
}

interface FrameworksLibraryProps {
  selectedBuilder: Builder | null
}

export function FrameworksLibrary({ selectedBuilder }: FrameworksLibraryProps) {
  const [frameworks, setFrameworks] = useState<Framework[]>([])
  const [builders, setBuilders] = useState<Builder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all')
  const [scopeFilter, setScopeFilter] = useState<'all' | 'global' | string>('all')
  const [showForm, setShowForm] = useState(false)
  const [editingFramework, setEditingFramework] = useState<Framework | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const loadFrameworks = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/frameworks')
      const data = await res.json()
      if (data.success) {
        setFrameworks(data.data as Framework[])
      } else {
        setError(data.error || 'Failed to load frameworks')
      }
    } catch {
      setError('Failed to load frameworks')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadBuilders = useCallback(async () => {
    try {
      const res = await fetch('/api/builders')
      const data = await res.json()
      if (data.success) setBuilders(data.data as Builder[])
    } catch {
      // builders list is optional for display purposes
    }
  }, [])

  useEffect(() => {
    loadFrameworks()
    loadBuilders()
  }, [loadFrameworks, loadBuilders])

  const builderName = (builderId: string | null) => {
    if (!builderId) return null
    return builders.find((b) => b.id === builderId)?.name ?? 'Unknown builder'
  }

  const filtered = frameworks.filter((f) => {
    const catOk = categoryFilter === 'all' || f.category === categoryFilter
    let scopeOk = true
    if (scopeFilter === 'global') scopeOk = f.builder_id === null
    else if (scopeFilter !== 'all') scopeOk = f.builder_id === scopeFilter
    return catOk && scopeOk
  })

  const handleSaved = (framework: Framework) => {
    if (editingFramework) {
      setFrameworks((prev) => prev.map((f) => (f.id === framework.id ? framework : f)))
    } else {
      setFrameworks((prev) => [...prev, framework])
    }
    setShowForm(false)
    setEditingFramework(null)
  }

  const handleEdit = (framework: Framework) => {
    setEditingFramework(framework)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id: string) => {
    setDeleting(true)
    try {
      const res = await fetch(`/api/frameworks/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        setFrameworks((prev) => prev.filter((f) => f.id !== id))
        setConfirmDeleteId(null)
      } else {
        setError(data.error || 'Delete failed')
      }
    } catch {
      setError('Delete failed')
    } finally {
      setDeleting(false)
    }
  }

  const openAdd = () => {
    setEditingFramework(null)
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingFramework(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold">Frameworks Library</h2>
          <p className="text-xs text-white/30 mt-0.5">
            The agency playbook — injected into every generation.
            Global frameworks apply to all builders; per-builder overrides layer on top.
          </p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="shrink-0 text-xs px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold transition-colors"
        >
          + Add Framework
        </button>
      </div>

      {/* Inline form */}
      {showForm && (
        <FrameworkForm
          initial={editingFramework}
          builders={builders}
          onSaved={handleSaved}
          onCancel={closeForm}
        />
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setCategoryFilter(tab.value)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                categoryFilter === tab.value
                  ? 'bg-white/10 text-white'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs text-white/30">Scope</span>
          <select
            className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-amber-500/50"
            value={scopeFilter}
            onChange={(e) => setScopeFilter(e.target.value)}
          >
            <option value="all" className="bg-[#0a0a0a]">All</option>
            <option value="global" className="bg-[#0a0a0a]">Global only</option>
            {builders.map((b) => (
              <option key={b.id} value={b.id} className="bg-[#0a0a0a]">
                {b.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/[0.04] p-3">
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-white/10 bg-white/[0.02] p-5 h-40 animate-pulse"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-12 text-center">
          <p className="text-white/30 text-sm">
            {frameworks.length === 0
              ? 'No frameworks yet. Add your first to build the agency playbook.'
              : 'No frameworks match these filters.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((f) => {
            const isConfirmingDelete = confirmDeleteId === f.id
            const name = builderName(f.builder_id)

            return (
              <div
                key={f.id}
                className="rounded-xl border border-white/10 bg-white/[0.02] p-5 flex flex-col gap-3 group"
              >
                {/* Card header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col gap-1.5 min-w-0">
                    <span
                      className={`self-start text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border ${CATEGORY_COLOURS[f.category]}`}
                    >
                      {f.category}
                    </span>
                    <p className="text-sm font-medium leading-tight">{f.title}</p>
                  </div>
                  {!isConfirmingDelete && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        type="button"
                        onClick={() => handleEdit(f)}
                        className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/5 transition-colors"
                        title="Edit"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(f.id)}
                        className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Delete"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>

                {/* Delete confirmation */}
                {isConfirmingDelete ? (
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs text-red-400 flex-1">Delete this framework?</p>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(null)}
                      className="text-xs px-2 py-1 rounded border border-white/10 text-white/50 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(f.id)}
                      disabled={deleting}
                      className="text-xs px-2 py-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                    >
                      {deleting ? '...' : 'Delete'}
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Content preview */}
                    <p className="text-xs text-white/40 leading-relaxed line-clamp-3">
                      {f.content}
                    </p>

                    {/* Footer */}
                    <div className="flex items-center justify-between gap-2 mt-auto pt-1 border-t border-white/5">
                      <span className="text-[10px] text-white/25">
                        {name ? name : 'Global'}
                      </span>
                      {f.tags && f.tags.length > 0 && (
                        <div className="flex gap-1 flex-wrap justify-end">
                          {f.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="text-[10px] text-white/25 bg-white/5 px-1.5 py-0.5 rounded"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Summary */}
      {!loading && frameworks.length > 0 && (
        <p className="text-xs text-white/20 text-right">
          {filtered.length} of {frameworks.length} frameworks
          {selectedBuilder ? ` · Active builder: ${selectedBuilder.name}` : ''}
        </p>
      )}
    </div>
  )
}
