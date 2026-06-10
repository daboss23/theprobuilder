'use client'

import { useRef, useState } from 'react'
import {
  Clapperboard,
  FileText,
  Anchor,
  LayoutTemplate,
  Tag,
  Film,
  ListChecks,
  Trophy,
  CalendarDays,
  Mic,
  MonitorPlay,
  UploadCloud,
  Check,
  type LucideIcon,
} from 'lucide-react'
import { uploadCards } from '@/lib/reactor-data'

const iconMap: Record<string, LucideIcon> = {
  Clapperboard,
  FileText,
  Anchor,
  LayoutTemplate,
  Tag,
  Film,
  ListChecks,
  Trophy,
  CalendarDays,
  Mic,
  MonitorPlay,
}

function UploadTile({ title, accept, icon }: { title: string; accept: string; icon: string }) {
  const Icon = iconMap[icon] ?? FileText
  const inputRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [drag, setDrag] = useState(false)

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault()
        setDrag(true)
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDrag(false)
        if (e.dataTransfer.files?.[0]) setFileName(e.dataTransfer.files[0].name)
      }}
      className={`glass glass-hover group flex flex-col items-center justify-center gap-2 rounded-xl border-dashed p-5 text-center transition-all ${
        drag ? 'border-glow shadow-glow' : 'border-border'
      }`}
      style={{ borderStyle: 'dashed' }}
    >
      <span className="grid h-11 w-11 place-items-center rounded-lg border border-border bg-surface/60 text-glow transition-transform group-hover:scale-110">
        {fileName ? <Check size={18} className="text-success" /> : <Icon size={18} />}
      </span>
      <span className="text-sm font-medium text-white">{title}</span>
      {fileName ? (
        <span className="max-w-full truncate text-[11px] text-success">{fileName}</span>
      ) : (
        <span className="flex items-center gap-1 text-[11px] text-white/35">
          <UploadCloud size={12} /> {accept}
        </span>
      )}
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
      />
    </button>
  )
}

export function UploadGrid() {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
      {uploadCards.map((c) => (
        <UploadTile key={c.title} {...c} />
      ))}
    </div>
  )
}
