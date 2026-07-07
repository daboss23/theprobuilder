'use client'

import { useCallback, useEffect, useState } from 'react'
import { FlaskConical, Lock, Plus, Target } from 'lucide-react'
import {
  AXIS_LIST,
  AXIS_META,
  ITERATION_AXES,
  defaultLockedTaxonomy,
  type CreativeTaxonomy,
  type IsolateConfig,
  type IterationAxis,
} from '@/lib/taxonomy'

/**
 * "What are we testing?" — the isolation-mode configurator. Off by default
 * (emits null → the reactor runs its normal free-generation path). When on, the
 * strategist picks ONE axis to vary (up to 3 values) while every other axis
 * locks to its best-performing existing value, so ORACLE can later attribute a
 * win to that single variable. Fully controlled: parent owns the IsolateConfig.
 */

const MAX_VALUES = 3

interface Props {
  value: IsolateConfig | null
  onChange: (v: IsolateConfig | null) => void
}

interface LocksResponse {
  locks: CreativeTaxonomy
  personaOptions: string[]
  painOptions: string[]
}

export function IsolationConfigurator({ value, onChange }: Props) {
  const [locks, setLocks] = useState<CreativeTaxonomy>(defaultLockedTaxonomy())
  const [personaOptions, setPersonaOptions] = useState<string[]>([...AXIS_META.persona.values])
  const [painOptions, setPainOptions] = useState<string[]>([...AXIS_META.painPoint.values])
  const [loadedLocks, setLoadedLocks] = useState(false)
  const [customDraft, setCustomDraft] = useState('')

  const enabled = value !== null
  const axis: IterationAxis = value?.axis ?? 'hook'
  const values = value?.values ?? []
  const notes = value?.notes ?? ''
  const lockedTaxonomy = value?.lockedTaxonomy ?? locks

  // Best-performing locks + real persona/pain options from ORACLE (once).
  useEffect(() => {
    let cancelled = false
    fetch('/api/taxonomy/locks')
      .then((r) => r.json())
      .then((data: LocksResponse) => {
        if (cancelled) return
        if (data.locks) setLocks(data.locks)
        if (Array.isArray(data.personaOptions)) setPersonaOptions(data.personaOptions)
        if (Array.isArray(data.painOptions)) setPainOptions(data.painOptions)
        setLoadedLocks(true)
      })
      .catch(() => setLoadedLocks(true))
    return () => {
      cancelled = true
    }
  }, [])

  // The pickable values for an axis — extensible axes use the discovered lists.
  const optionsFor = useCallback(
    (a: IterationAxis): string[] => {
      if (a === 'persona') return personaOptions
      if (a === 'painPoint') return painOptions
      return [...AXIS_META[a].values]
    },
    [personaOptions, painOptions],
  )

  const emit = (next: Partial<IsolateConfig>) => {
    onChange({ axis, values, lockedTaxonomy, notes, ...next })
  }

  const toggle = () => {
    if (enabled) {
      onChange(null)
    } else {
      onChange({ axis: 'hook', values: [], lockedTaxonomy: loadedLocks ? locks : defaultLockedTaxonomy(), notes: '' })
    }
  }

  const selectAxis = (a: IterationAxis) => {
    // Switching the tested variable clears the values but keeps the locks/notes.
    emit({ axis: a, values: [] })
    setCustomDraft('')
  }

  const toggleValue = (v: string) => {
    const has = values.includes(v)
    if (has) emit({ values: values.filter((x) => x !== v) })
    else if (values.length < MAX_VALUES) emit({ values: [...values, v] })
  }

  const addCustom = () => {
    const v = customDraft.trim()
    if (!v || values.includes(v) || values.length >= MAX_VALUES) return
    // Grow the discovered option list so the new chip renders as selectable.
    if (axis === 'persona' && !personaOptions.includes(v)) setPersonaOptions((p) => [...p, v])
    if (axis === 'painPoint' && !painOptions.includes(v)) setPainOptions((p) => [...p, v])
    emit({ values: [...values, v] })
    setCustomDraft('')
  }

  const setLock = (a: IterationAxis, v: string) => {
    emit({ lockedTaxonomy: { ...lockedTaxonomy, [AXIS_META[a].key]: v } })
  }

  const activeMeta = AXIS_META[axis]
  const lockedAxes = ITERATION_AXES.filter((a) => a !== axis)

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-400">
            <FlaskConical size={16} />
          </span>
          <div>
            <p className="font-display text-sm font-semibold text-white">Iterate one thing</p>
            <p className="mt-0.5 text-[12px] leading-relaxed text-white/50">
              Optional controlled test — vary a single variable, lock the rest, so performance data
              says which value actually wins.
            </p>
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={toggle}
          className={`relative mt-1 h-6 w-11 shrink-0 rounded-full transition-colors ${
            enabled ? 'bg-amber-500' : 'bg-white/15'
          }`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
              enabled ? 'translate-x-[22px]' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>

      {enabled && (
        <div className="mt-5 space-y-5 border-t border-white/10 pt-5">
          {/* Axis tabs — what are we varying? */}
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/40">
              What are we testing?
            </p>
            <div className="flex flex-wrap gap-1.5">
              {AXIS_LIST.map((m) => (
                <button
                  key={m.axis}
                  type="button"
                  onClick={() => selectAxis(m.axis)}
                  className={`rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors ${
                    axis === m.axis
                      ? 'border-amber-500/60 bg-amber-500/15 text-amber-300'
                      : 'border-white/10 bg-white/[0.02] text-white/60 hover:border-white/20 hover:text-white/80'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Value chips for the tested axis */}
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/40">
              {activeMeta.label} — pick up to {MAX_VALUES} to test
              <span className="ml-2 text-amber-400/70">{values.length}/{MAX_VALUES}</span>
            </p>
            <div className="flex flex-wrap gap-1.5">
              {optionsFor(axis).map((v) => {
                const selected = values.includes(v)
                const full = !selected && values.length >= MAX_VALUES
                return (
                  <button
                    key={v}
                    type="button"
                    disabled={full}
                    onClick={() => toggleValue(v)}
                    className={`rounded-full border px-3 py-1.5 text-[13px] transition-colors ${
                      selected
                        ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-300'
                        : full
                          ? 'cursor-not-allowed border-white/5 bg-white/[0.01] text-white/25'
                          : 'border-white/10 bg-white/[0.02] text-white/70 hover:border-white/20 hover:text-white'
                    }`}
                  >
                    {v}
                  </button>
                )
              })}
            </div>
            {activeMeta.extensible && (
              <div className="mt-2.5 flex items-center gap-2">
                <input
                  value={customDraft}
                  onChange={(e) => setCustomDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addCustom()
                    }
                  }}
                  placeholder={`Add a ${activeMeta.label.toLowerCase()} not listed…`}
                  className="flex-1 rounded-lg border border-white/10 bg-black/30 px-3 py-1.5 text-[13px] text-white/80 placeholder:text-white/30 focus:border-amber-500/40 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={addCustom}
                  disabled={!customDraft.trim() || values.length >= MAX_VALUES}
                  className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[13px] text-white/70 transition-colors hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Plus size={13} /> Add
                </button>
              </div>
            )}
          </div>

          {/* Locked axes — held fixed to their best-performing value */}
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/40">
              <Lock size={11} /> Held fixed
              {locks && loadedLocks ? ' · best-performing values' : ' · defaults'}
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {lockedAxes.map((a) => {
                const meta = AXIS_META[a]
                const opts = optionsFor(a)
                const current = lockedTaxonomy[meta.key] ?? ''
                return (
                  <label
                    key={a}
                    className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2"
                  >
                    <span className="text-[12px] text-white/45">{meta.label}</span>
                    <select
                      value={current}
                      onChange={(e) => setLock(a, e.target.value)}
                      className="max-w-[60%] truncate bg-transparent text-right text-[13px] text-white/85 focus:outline-none"
                    >
                      {(current && !opts.includes(current) ? [current, ...opts] : opts).map((o) => (
                        <option key={o} value={o} className="bg-[#0a0a0a] text-white">
                          {o}
                        </option>
                      ))}
                    </select>
                  </label>
                )
              })}
            </div>
          </div>

          {/* Strategist notes */}
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/40">
              Strategist notes for the AI (optional)
            </p>
            <textarea
              value={notes}
              onChange={(e) => emit({ notes: e.target.value })}
              rows={2}
              placeholder="e.g. lean into the winter angle, keep it under 40s…"
              className="w-full resize-none rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-[13px] text-white/80 placeholder:text-white/30 focus:border-amber-500/40 focus:outline-none"
            />
          </div>

          {/* Live summary */}
          <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/[0.06] px-3 py-2.5 text-[12px] text-amber-200/80">
            <Target size={14} className="mt-0.5 shrink-0" />
            {values.length ? (
              <span>
                Testing <b className="text-amber-200">{activeMeta.label}</b> across{' '}
                {values.join(', ')} — every other axis held fixed. Each variant is tagged so ORACLE
                can name the winner.
              </span>
            ) : (
              <span>Pick at least one {activeMeta.label.toLowerCase()} value to test.</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/** True when an isolation config is present but not yet valid to fire. */
export function isolationIncomplete(v: IsolateConfig | null): boolean {
  return v !== null && v.values.length === 0
}
