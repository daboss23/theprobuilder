'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Users, UploadCloud, Loader2, X, Check, Film } from 'lucide-react'

export interface Face {
  id: string
  name: string
  kind: 'image' | 'video'
  url: string
}

/**
 * In-house UGC face roster. Drag-and-drop (or click) to upload reference assets
 * to Supabase Storage, pick which to use, and the selected URLs flow up to the
 * Reactor for Seedance 2.0 reference-to-video (consistent character across clips).
 */
export function FaceLibrary({
  onChange,
}: {
  onChange: (images: string[], videos: string[]) => void
}) {
  const [faces, setFaces] = useState<Face[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [configured, setConfigured] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/faces')
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.faces)) setFaces(d.faces as Face[])
        setConfigured(Boolean(d.configured))
      })
      .catch(() => setConfigured(false))
  }, [])

  // Push the selected image/video URLs up whenever selection or roster changes.
  useEffect(() => {
    const chosen = faces.filter((f) => selected.has(f.id))
    onChange(
      chosen.filter((f) => f.kind === 'image').map((f) => f.url),
      chosen.filter((f) => f.kind === 'video').map((f) => f.url),
    )
  }, [selected, faces, onChange])

  const upload = useCallback(async (files: FileList | File[]) => {
    const list = Array.from(files).filter(
      (f) => f.type.startsWith('image/') || f.type.startsWith('video/'),
    )
    if (list.length === 0) return
    setUploading(true)
    setError(null)
    for (const file of list) {
      try {
        const body = new FormData()
        body.append('file', file)
        const res = await fetch('/api/faces', { method: 'POST', body }).then((r) => r.json())
        if (res.success && res.face) {
          const face = res.face as Face
          setFaces((prev) => [face, ...prev])
          setSelected((prev) => new Set(prev).add(face.id))
        } else {
          setError(res.error || 'Upload failed')
        }
      } catch {
        setError('Upload failed')
      }
    }
    setUploading(false)
  }, [])

  const remove = async (id: string) => {
    setFaces((prev) => prev.filter((f) => f.id !== id))
    setSelected((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
    try {
      await fetch(`/api/faces/${id}`, { method: 'DELETE' })
    } catch {
      /* best-effort */
    }
  }

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const selectedCount = selected.size

  return (
    <div className="mt-4 rounded-lg border border-border bg-surface/30 p-3">
      <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-white/40">
        <Users size={12} /> Face Library — In-House UGC
      </p>
      <p className="mt-1 text-[11px] text-white/35">
        Add up to 9 reference images and up to 3 reference videos to lock a consistent character
        across clips.
      </p>

      {!configured && (
        <p className="mt-2 rounded-lg border border-warning/30 bg-warning/[0.06] p-2 text-[11px] text-warning">
          Connect Supabase (URL + service role key) to save a face roster.
        </p>
      )}

      {/* Drop zone */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          if (e.dataTransfer.files?.length) upload(e.dataTransfer.files)
        }}
        disabled={!configured || uploading}
        className={`mt-2 flex w-full flex-col items-center justify-center gap-1 rounded-lg border border-dashed px-3 py-4 text-[11px] transition-colors disabled:opacity-50 ${
          dragOver ? 'border-glow bg-primary/10 text-glow' : 'border-border text-white/40 hover:border-white/25'
        }`}
      >
        {uploading ? (
          <Loader2 size={16} className="animate-spin text-glow" />
        ) : (
          <UploadCloud size={16} />
        )}
        {uploading ? 'Uploading…' : 'Drag & drop faces / clips, or click to upload'}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) upload(e.target.files)
          e.target.value = ''
        }}
      />

      {error && <p className="mt-1.5 text-[11px] text-danger">{error}</p>}

      {/* Roster */}
      {faces.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-2">
          {faces.map((f) => {
            const on = selected.has(f.id)
            return (
              <div
                key={f.id}
                className={`group relative aspect-square overflow-hidden rounded-lg border ${
                  on ? 'border-glow ring-1 ring-glow' : 'border-border'
                }`}
              >
                <button type="button" onClick={() => toggle(f.id)} className="block h-full w-full">
                  {f.kind === 'video' ? (
                    <video src={f.url} muted className="h-full w-full object-cover" />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={f.url} alt={f.name} className="h-full w-full object-cover" />
                  )}
                  {on && (
                    <span className="absolute left-1 top-1 grid h-4 w-4 place-items-center rounded bg-glow text-background">
                      <Check size={11} />
                    </span>
                  )}
                  {f.kind === 'video' && (
                    <span className="absolute right-1 top-1 text-white/70">
                      <Film size={11} />
                    </span>
                  )}
                  <span className="absolute inset-x-0 bottom-0 truncate bg-background/70 px-1 py-0.5 text-[9px] text-white/70">
                    {f.name}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => remove(f.id)}
                  className="absolute right-1 bottom-1 hidden rounded bg-background/80 p-0.5 text-white/60 hover:text-danger group-hover:block"
                  title="Remove"
                >
                  <X size={11} />
                </button>
              </div>
            )
          })}
        </div>
      )}

      <p className="mt-2 text-[11px] text-white/35">
        {selectedCount > 0
          ? `${selectedCount} selected → use “Generate UGC” on any video concept after firing.`
          : 'Select faces, then use “Generate UGC” on a video concept.'}
      </p>
    </div>
  )
}
