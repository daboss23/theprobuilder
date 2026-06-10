'use client'

import { useEffect, useState } from 'react'
import type { Builder } from '@/types'
import { BuilderForm } from './BuilderForm'

interface BuilderBarProps {
  selectedBuilder: Builder | null
  onSelect: (builder: Builder | null) => void
}

export function BuilderBar({ selectedBuilder, onSelect }: BuilderBarProps) {
  const [builders, setBuilders] = useState<Builder[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch('/api/builders')
        const data = await res.json()
        if (!active) return
        if (data.success) {
          setBuilders(data.data)
          if (data.data.length > 0) onSelect(data.data[0])
        } else {
          setError(data.error || 'Failed to load builders')
        }
      } catch {
        if (active) setError('Failed to load builders')
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleCreated = (builder: Builder) => {
    setBuilders((prev) => [builder, ...prev])
    onSelect(builder)
    setShowForm(false)
  }

  const handleChange = (id: string) => {
    const b = builders.find((x) => x.id === id) ?? null
    onSelect(b)
  }

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-xs text-white/40 shrink-0">Active builder</span>
          {builders.length > 0 ? (
            <select
              value={selectedBuilder?.id ?? ''}
              onChange={(e) => handleChange(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-amber-500/50 max-w-[260px]"
            >
              {builders.map((b) => (
                <option key={b.id} value={b.id} className="bg-[#0a0a0a]">
                  {b.name}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-sm text-white/40">
              {loading ? 'Loading...' : 'No builders yet — onboard your first'}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowForm((s) => !s)}
          className="text-xs px-3 py-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 transition-colors shrink-0"
        >
          {showForm ? 'Close' : '+ New builder'}
        </button>
      </div>

      {error && !showForm && (
        <p className="text-xs text-white/30 px-1">
          {error} Set your Supabase keys in Vercel and run the schema, then refresh.
        </p>
      )}

      {showForm && <BuilderForm onCreated={handleCreated} onCancel={() => setShowForm(false)} />}
    </div>
  )
}
