'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Loader2, Radar } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TelemetryLine } from '@/components/campaign-reactor/ReactorRunContext'

/**
 * Run Diagnostics — the raw reactor telemetry (every SSE step, retrieval, and
 * intelligence report) preserved verbatim but demoted into a collapsible drawer
 * so the live workflow stays the primary experience. Collapsed by default;
 * nothing is removed. Auto-expands when a run faults so the failure detail is
 * immediately reachable.
 */
export function TechnicalTelemetryDrawer({
  telemetry,
  firing,
  failed = false,
}: {
  telemetry: TelemetryLine[]
  firing: boolean
  failed?: boolean
}) {
  const [open, setOpen] = useState(false)
  const feedRef = useRef<HTMLDivElement>(null)

  // A fault reveals diagnostics automatically — the user shouldn't hunt for it.
  useEffect(() => {
    if (failed) setOpen(true)
  }, [failed])

  useEffect(() => {
    if (open) requestAnimationFrame(() => feedRef.current?.scrollTo({ top: 1e9, behavior: 'smooth' }))
  }, [telemetry.length, open])

  return (
    <div className={cn('telemetry-console overflow-hidden', failed && 'telemetry-console--fault')}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left"
        aria-expanded={open}
      >
        <span
          className={cn(
            'flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em]',
            failed ? 'text-danger/80' : 'text-white/45',
          )}
        >
          <Radar size={12} className={firing ? 'animate-spin text-glow' : ''} />
          Run Diagnostics
          {telemetry.length > 0 && <span className="text-white/25">· {telemetry.length}</span>}
        </span>
        <ChevronDown
          size={14}
          className={cn('text-white/40 transition-transform', open && 'rotate-180')}
        />
      </button>

      {open && (
        <div
          ref={feedRef}
          className="max-h-64 space-y-1 overflow-y-auto border-t border-white/5 px-3 py-2.5 font-mono text-[11px]"
        >
          {telemetry.length === 0 && (
            <p className="py-3 text-center text-white/30">No telemetry yet.</p>
          )}
          {telemetry.map((t, i) => {
            if (t.kind === 'intelligence') {
              return (
                <div key={i} className="my-1 rounded-md border border-glow/20 bg-glow/[0.04] px-2.5 py-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-glow/90">
                      {t.label}
                    </span>
                    {t.confidence && (
                      <span
                        className={cn(
                          'rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide',
                          t.confidence === 'High'
                            ? 'bg-success/15 text-success'
                            : t.confidence === 'Medium'
                              ? 'bg-warning/15 text-warning'
                              : 'bg-white/10 text-white/50',
                        )}
                      >
                        Confidence: {t.confidence}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-white/70">{t.text}</p>
                </div>
              )
            }
            return (
              <div
                key={i}
                className={cn('flex gap-2', t.kind === 'retrieval' ? 'text-cyan/80' : 'text-white/55')}
              >
                <span className="text-white/25">{t.kind === 'retrieval' ? '└▸' : '›'}</span>
                <span>{t.text}</span>
              </div>
            )
          })}
          {firing && (
            <div className="flex items-center gap-2 text-glow">
              <Loader2 size={11} className="animate-spin" /> intelligence operating…
            </div>
          )}
        </div>
      )}
    </div>
  )
}
