'use client'

import { useRef, useState } from 'react'
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

type ImportMode = 'file' | 'url' | 'youtube' | null

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

  // Import state
  const [importMode, setImportMode] = useState<ImportMode>(null)
  const [urlInput, setUrlInput] = useState('')
  const [ytInput, setYtInput] = useState('')
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [importSuccess, setImportSuccess] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isEditing = !!initial

  const toggleMode = (mode: ImportMode) => {
    setImportMode((prev) => (prev === mode ? null : mode))
    setImportError(null)
    setImportSuccess(null)
  }

  const applyContent = (text: string, source: string) => {
    setContent(text)
    setImportSuccess(`Imported from ${source}. Review and edit below before saving.`)
    setImportError(null)
    setImportMode(null)
  }

  // ── File handling ──────────────────────────────────────────────────────────

  const handleFile = async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (!ext || !['md', 'txt', 'pdf'].includes(ext)) {
      setImportError('Unsupported file type. Use .md, .txt, or .pdf')
      return
    }

    setImporting(true)
    setImportError(null)

    try {
      if (ext === 'md' || ext === 'txt') {
        const text = await file.text()
        applyContent(text.trim(), file.name)
      } else {
        const formData = new FormData()
        formData.append('file', file)
        const res = await fetch('/api/frameworks/parse-file', { method: 'POST', body: formData })
        const data = await res.json()
        if (data.success) {
          applyContent(data.content as string, file.name)
        } else {
          setImportError(data.error || 'Failed to parse file')
        }
      }
    } catch {
      setImportError('Failed to read file')
    } finally {
      setImporting(false)
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  // ── URL scraping ───────────────────────────────────────────────────────────

  const handleFetchUrl = async () => {
    if (!urlInput.trim()) return
    setImporting(true)
    setImportError(null)
    try {
      const res = await fetch('/api/frameworks/scrape-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlInput.trim() }),
      })
      const data = await res.json()
      if (data.success) {
        applyContent(data.content as string, urlInput.trim())
        setUrlInput('')
      } else {
        setImportError(data.error || 'Failed to fetch URL')
      }
    } catch {
      setImportError('Failed to fetch URL')
    } finally {
      setImporting(false)
    }
  }

  // ── YouTube transcript ─────────────────────────────────────────────────────

  const handleFetchYoutube = async () => {
    if (!ytInput.trim()) return
    setImporting(true)
    setImportError(null)
    try {
      const res = await fetch('/api/frameworks/scrape-youtube', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: ytInput.trim() }),
      })
      const data = await res.json()
      if (data.success) {
        applyContent(data.content as string, 'YouTube transcript')
        setYtInput('')
      } else {
        setImportError(data.error || 'Failed to fetch transcript')
      }
    } catch {
      setImportError('Failed to fetch transcript')
    } finally {
      setImporting(false)
    }
  }

  // ── Save ───────────────────────────────────────────────────────────────────

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
      const res = isEditing
        ? await fetch(`/api/frameworks/${initial.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        : await fetch('/api/frameworks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })

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

  const importBtnCls = (mode: ImportMode) =>
    `flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
      importMode === mode
        ? 'border-amber-500/40 bg-amber-500/10 text-amber-300'
        : 'border-white/10 bg-white/[0.03] text-white/40 hover:text-white/70 hover:border-white/20'
    }`

  return (
    <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.02] p-5 space-y-4">
      <div>
        <h3 className="text-sm font-semibold">{isEditing ? 'Edit framework' : 'Add framework'}</h3>
        <p className="text-xs text-white/30 mt-0.5">
          {isEditing
            ? 'Update this entry in the agency playbook.'
            : 'Add to the agency playbook. Global frameworks inject for every builder.'}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Title */}
        <div className="sm:col-span-2">
          <label className={labelCls}>Title *</label>
          <input
            className={field}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Meta 5-Step Copy Framework"
          />
        </div>

        {/* Category + Scope */}
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
            <option value="global" className="bg-[#0a0a0a]">Global (all builders)</option>
            {builders.map((b) => (
              <option key={b.id} value={b.id} className="bg-[#0a0a0a]">
                {b.name} only
              </option>
            ))}
          </select>
        </div>

        {/* Content section */}
        <div className="sm:col-span-2 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <label className={labelCls + ' mb-0'}>Content *</label>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-white/25 mr-1">Import from</span>

              {/* File */}
              <button type="button" className={importBtnCls('file')} onClick={() => toggleMode('file')}>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                File
              </button>

              {/* URL */}
              <button type="button" className={importBtnCls('url')} onClick={() => toggleMode('url')}>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                URL
              </button>

              {/* YouTube */}
              <button type="button" className={importBtnCls('youtube')} onClick={() => toggleMode('youtube')}>
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
                YouTube
              </button>
            </div>
          </div>

          {/* File drop zone */}
          {importMode === 'file' && (
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-colors ${
                isDragging
                  ? 'border-amber-500/60 bg-amber-500/[0.06]'
                  : 'border-white/10 hover:border-white/20 bg-white/[0.01]'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".md,.txt,.pdf"
                className="hidden"
                onChange={handleFileInput}
              />
              {importing ? (
                <span className="flex items-center justify-center gap-2 text-xs text-white/40">
                  <span className="w-3 h-3 border border-white/30 border-t-transparent rounded-full animate-spin" />
                  Reading file…
                </span>
              ) : (
                <>
                  <svg className="w-6 h-6 mx-auto mb-2 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-xs text-white/50">Drop .md, .txt, or .pdf here</p>
                  <p className="text-xs text-white/25 mt-1">or click to browse</p>
                </>
              )}
            </div>
          )}

          {/* URL input */}
          {importMode === 'url' && (
            <div className="flex gap-2">
              <input
                className={`${field} flex-1`}
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleFetchUrl()}
                placeholder="https://example.com/your-framework-page"
                disabled={importing}
              />
              <button
                type="button"
                onClick={handleFetchUrl}
                disabled={importing || !urlInput.trim()}
                className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                  importing || !urlInput.trim()
                    ? 'bg-white/5 text-white/30 cursor-not-allowed'
                    : 'bg-amber-500 hover:bg-amber-400 text-black'
                }`}
              >
                {importing ? (
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 border border-black/30 border-t-transparent rounded-full animate-spin" />
                    Fetching…
                  </span>
                ) : 'Fetch'}
              </button>
            </div>
          )}

          {/* YouTube input */}
          {importMode === 'youtube' && (
            <div className="flex gap-2">
              <input
                className={`${field} flex-1`}
                value={ytInput}
                onChange={(e) => setYtInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleFetchYoutube()}
                placeholder="https://youtube.com/watch?v=..."
                disabled={importing}
              />
              <button
                type="button"
                onClick={handleFetchYoutube}
                disabled={importing || !ytInput.trim()}
                className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                  importing || !ytInput.trim()
                    ? 'bg-white/5 text-white/30 cursor-not-allowed'
                    : 'bg-red-500 hover:bg-red-400 text-white'
                }`}
              >
                {importing ? (
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 border border-white/30 border-t-transparent rounded-full animate-spin" />
                    Fetching…
                  </span>
                ) : 'Get Transcript'}
              </button>
            </div>
          )}

          {/* Import feedback */}
          {importError && (
            <p className="text-xs text-red-400">{importError}</p>
          )}
          {importSuccess && (
            <p className="text-xs text-emerald-400">{importSuccess}</p>
          )}

          {/* Content textarea */}
          <textarea
            className={`${field} resize-y font-mono text-xs leading-relaxed min-h-[220px]`}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Paste or type the framework content here. This is injected verbatim into the AI system prompt — review carefully before saving."
          />
          {content.length > 0 && (
            <p className="text-[10px] text-white/20 text-right">{content.length.toLocaleString()} chars</p>
          )}
        </div>

        {/* Tags */}
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
          {submitting ? 'Saving…' : isEditing ? 'Update framework' : 'Add framework'}
        </button>
      </div>
    </div>
  )
}
