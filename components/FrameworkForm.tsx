'use client'

import { useState } from 'react'
import type { Builder, Framework, FrameworkCategory, FrameworkInsert, FrameworkUpdate } from '@/types'

interface FrameworkFormProps {
  initial?: Framework | null
  builders: Builder[]
  onSaved: (framework: Framework) => void
  onCancel: () => void
}

const CATEGORIES: { value: FrameworkCategory; label: string }[] = [
  { value: 'copy', label: 'Copy' },
  { value: 'hook', label: 'Hook' },
  { value: 'image', label: 'Image' },
  { value: 'video', label: 'Video' },
]

const field =
  'w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-amber-500/50 transition-colors'
const labelCls = 'text-xs text-white/50 mb-1 block'

export function FrameworkForm({ initial, builders, onSaved, onCancel }: FrameworkFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [category, setCategory] = useState<FrameworkCategory>(initial?.category ?? 'copy')
  const [builderScope, setBuilderScope] = useState<string>(initial?.builder_id ?? 'global')
  const [content, setContent] = useState(initial?.content ?? '')
  const [tagsRaw, setTagsRaw] = useState((initial?.tags ?? []).join(', '))
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEditing = !!initial

  const handleSubmit = async () => {
    if (!title.trim()) { setError('Title is required'); return }
    if (!content.trim()) { setError('Content is required'); return }

    const tags = tagsRaw
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)

    const payload: FrameworkInsert | FrameworkUpdate = {
      title: title.trim(),
      category,
      content: content.trim(),
      builder_id: builderScope === 'global' ? null : builderScope,
      tags: tags.length > 0 ? tags : null,
    }

    setSubmitting(true)
    setError(null)

    try {
      let res: Response
      if (isEditing) {
        res = await fetch(`/api/frameworks/${initial.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        res = await fetch('/api/frameworks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }

      const data = await res.json()
      if (data.success) {
        onSaved(data.data as Framework)
      } else {
        setError(data.error || 'Failed to save framework')
      }
    } catch {
      setError('Failed to save framework')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.02] p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">{isEditing ? 'Edit framework' : 'Add framework'}</h3>
          <p className="text-xs text-white/30 mt-0.5">
            {isEditing
              ? 'Update this entry in the agency playbook.'
              : 'Add a new entry to the agency playbook. Global frameworks inject for all builders.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className={labelCls}>Title *</label>
          <input
            className={field}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Meta 5-Step Copy Framework"
          />
        </div>

        <div>
          <label className={labelCls}>Category *</label>
          <select
            className={`${field} appearance-none`}
            value={category}
            onChange={(e) => setCategory(e.target.value as FrameworkCategory)}
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value} className="bg-[#0a0a0a]">
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelCls}>Scope</label>
          <select
            className={`${field} appearance-none`}
            value={builderScope}
            onChange={(e) => setBuilderScope(e.target.value)}
          >
            <option value="global" className="bg-[#0a0a0a]">
              Global (all builders)
            </option>
            {builders.map((b) => (
              <option key={b.id} value={b.id} className="bg-[#0a0a0a]">
                {b.name} only
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className={labelCls}>Content *</label>
          <textarea
            className={`${field} resize-none font-mono text-xs leading-relaxed`}
            rows={10}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Paste the full framework text here. This is injected verbatim into the AI system prompt."
          />
        </div>

        <div className="sm:col-span-2">
          <label className={labelCls}>Tags (comma-separated)</label>
          <input
            className={field}
            value={tagsRaw}
            onChange={(e) => setTagsRaw(e.target.value)}
            placeholder="e.g. awareness, conversion, hooks"
          />
        </div>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg text-sm text-white/60 hover:text-white border border-white/10 transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || !title.trim() || !content.trim()}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            submitting || !title.trim() || !content.trim()
              ? 'bg-amber-500/20 text-amber-400/60 cursor-not-allowed'
              : 'bg-amber-500 hover:bg-amber-400 text-black'
          }`}
        >
          {submitting ? 'Saving...' : isEditing ? 'Update framework' : 'Add framework'}
        </button>
      </div>
    </div>
  )
}
