'use client'

import { useEffect, useMemo, useState } from 'react'
import { Atom, ChevronLeft, ChevronRight, X } from 'lucide-react'
import {
  angleOptions,
  audienceOptions,
  awarenessOptions,
  createDefaultInputs,
  offerOptions,
  outputTypeOptions,
  type ReactorInputs,
} from '@/lib/reactor-inputs'

const ORANGE = '#FF5E3A'

const STEP_LABELS = ['Campaign Brief', 'Audience + Offer', 'On Brand', 'Ready To Fire'] as const

interface ReactorModalProps {
  open: boolean
  onClose: () => void
  onFire: (inputs: ReactorInputs) => void
}

/* ----------------------------- Shared fields ------------------------------ */

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-white/40">
      {children}
    </p>
  )
}

const selectClass =
  'w-full rounded-lg border border-border bg-surface/60 px-3 py-2.5 text-sm text-white outline-none focus:border-[#FF5E3A]/60'

export function ReactorModal({ open, onClose, onFire }: ReactorModalProps) {
  const [inputs, setInputs] = useState<ReactorInputs>(createDefaultInputs)
  const [step, setStep] = useState(1)
  const [showOutputs, setShowOutputs] = useState(false)

  // Reset to a clean slate every time the modal opens.
  useEffect(() => {
    if (open) {
      setInputs(createDefaultInputs())
      setStep(1)
      setShowOutputs(false)
    }
  }, [open])

  const dirty = useMemo(() => {
    const d = createDefaultInputs()
    return (
      inputs.brief !== d.brief ||
      inputs.angle !== d.angle ||
      inputs.outputTypes.length > 0 ||
      inputs.awarenessStage !== d.awarenessStage ||
      inputs.audienceType !== d.audienceType ||
      inputs.offerType !== d.offerType ||
      inputs.offerName !== d.offerName ||
      inputs.onBrandEnabled !== d.onBrandEnabled
    )
  }, [inputs])

  const requestClose = () => {
    if (dirty && !window.confirm('Discard inputs and close?')) return
    onClose()
  }

  // ESC closes (with the dirty-state guard).
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') requestClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, dirty])

  if (!open) return null

  const set = (patch: Partial<ReactorInputs>) => setInputs((p) => ({ ...p, ...patch }))

  const toggleOutput = (o: string) => {
    setInputs((p) => {
      const next = p.outputTypes.includes(o)
        ? p.outputTypes.filter((v) => v !== o)
        : [...p.outputTypes, o]
      return { ...p, outputTypes: next, outputTypesAgentDecided: next.length === 0 }
    })
  }

  const fire = () => {
    onClose()
    onFire(inputs)
  }

  const progress = step * 25

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/65 px-4 backdrop-blur-[6px]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) requestClose()
      }}
    >
      <div className="relative w-[640px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-border bg-card">
        {/* Progress bar */}
        <div className="h-[3px] w-full bg-white/5">
          <div
            className="h-full bg-[#FF5E3A] transition-[width] duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4].map((n) => {
                const state = n === step ? 'active' : n < step ? 'done' : 'upcoming'
                return (
                  <button
                    key={n}
                    type="button"
                    disabled={state === 'upcoming'}
                    onClick={() => state === 'done' && setStep(n)}
                    className={`grid h-6 w-6 place-items-center rounded-full border text-[11px] font-bold transition-colors ${
                      state === 'active'
                        ? 'border-[#FF5E3A] bg-[#FF5E3A] text-white'
                        : state === 'done'
                          ? 'border-[#FF5E3A]/40 bg-[#FF5E3A]/15 text-[#FF5E3A] hover:bg-[#FF5E3A]/25'
                          : 'border-border bg-surface/60 text-white/30'
                    } ${state === 'upcoming' ? 'cursor-default' : 'cursor-pointer'}`}
                  >
                    {n}
                  </button>
                )
              })}
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/70">
              {STEP_LABELS[step - 1]}
            </span>
          </div>
          <button
            type="button"
            onClick={requestClose}
            className="text-white/40 transition-colors hover:text-white"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[60vh] overflow-y-auto px-5 py-5">
          {step === 1 && (
            <div className="animate-fade-up space-y-4">
              <div>
                <FieldLabel>Campaign Brief</FieldLabel>
                <p className="mb-2 text-xs text-white/40">
                  Optional but high-leverage. Direction, tone, proof asset, creative constraints —
                  the agent reads this first.
                </p>
                <textarea
                  value={inputs.brief}
                  onChange={(e) => set({ brief: e.target.value })}
                  placeholder={`e.g. "Targeting operators $1.5M–$3M still on the tools. Lead with Jason — 14 months, off tools, margin up. Want identity shift, not another hustle ad."`}
                  className="h-[90px] w-full resize-none rounded-lg border border-border bg-surface/60 px-3 py-2.5 text-sm text-white outline-none focus:border-[#FF5E3A]/60"
                />
              </div>

              <div>
                <FieldLabel>Campaign Angle</FieldLabel>
                <select
                  value={inputs.angle}
                  onChange={(e) =>
                    set({
                      angle: e.target.value,
                      angleIsAgentDecided: e.target.value === angleOptions[0],
                    })
                  }
                  className={selectClass}
                >
                  {angleOptions.map((a) => (
                    <option key={a} value={a} className="bg-card">
                      {a === angleOptions[0] ? 'Agent decides (default)' : a}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => setShowOutputs((v) => !v)}
                  className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-[0.08em] text-white/40 transition-colors hover:text-white/70"
                >
                  <ChevronRight
                    size={12}
                    className={`transition-transform ${showOutputs ? 'rotate-90' : ''}`}
                  />
                  Advanced: choose output types
                </button>
                {showOutputs && (
                  <div className="mt-3">
                    <FieldLabel>Output Types (leave blank for agent to decide)</FieldLabel>
                    <div className="flex flex-wrap gap-1.5">
                      {outputTypeOptions.map((o) => {
                        const on = inputs.outputTypes.includes(o)
                        return (
                          <button
                            key={o}
                            type="button"
                            onClick={() => toggleOutput(o)}
                            className={`rounded-full border px-2.5 py-1 text-[11px] transition-colors ${
                              on
                                ? 'border-[#FF5E3A] bg-[#FF5E3A]/10 text-[#FF5E3A]'
                                : 'border-border text-white/40 hover:text-white/60'
                            }`}
                          >
                            {o}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-fade-up space-y-4">
              <div>
                <FieldLabel>Awareness Stage</FieldLabel>
                <select
                  value={inputs.awarenessStage}
                  onChange={(e) => {
                    const opt = awarenessOptions.find((o) => o.label === e.target.value)!
                    set({ awarenessStage: opt.label, awarenessDirective: opt.directive })
                  }}
                  className={selectClass}
                >
                  {awarenessOptions.map((o, i) => (
                    <option key={o.label} value={o.label} className="bg-card">
                      {i === 0 ? 'Agent decides — based on brief and angle' : o.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <FieldLabel>Audience Type</FieldLabel>
                <select
                  value={inputs.audienceType}
                  onChange={(e) => {
                    const opt = audienceOptions.find((o) => o.label === e.target.value)!
                    set({ audienceType: opt.label, audienceDirective: opt.directive })
                  }}
                  className={selectClass}
                >
                  {audienceOptions.map((o, i) => (
                    <option key={o.label} value={o.label} className="bg-card">
                      {i === 0 ? 'Agent decides — based on brief and angle' : o.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <FieldLabel>Offer Type</FieldLabel>
                <select
                  value={inputs.offerType}
                  onChange={(e) => {
                    const opt = offerOptions.find((o) => o.label === e.target.value)!
                    set({ offerType: opt.label, offerTypeDirective: opt.directive })
                  }}
                  className={selectClass}
                >
                  {offerOptions.map((o, i) => (
                    <option key={o.label} value={o.label} className="bg-card">
                      {i === 0 ? 'Agent decides — based on brief and angle' : o.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <FieldLabel>Offer Name</FieldLabel>
                <input
                  value={inputs.offerName}
                  onChange={(e) => set({ offerName: e.target.value })}
                  placeholder={`e.g. "The Owner Freedom Roadmap"`}
                  className={selectClass}
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-fade-up space-y-4">
              <button
                type="button"
                onClick={() => set({ onBrandEnabled: !inputs.onBrandEnabled })}
                className="flex w-full items-start justify-between gap-4 rounded-lg border border-border bg-surface/40 p-4 text-left"
              >
                <div>
                  <p className="text-sm font-semibold text-white">On Brand</p>
                  <p className="mt-1 text-xs text-white/45">
                    Brand voice, compliance, and intelligence pulled from Settings. Agent selects
                    relevant knowledge systems.
                  </p>
                </div>
                <span
                  className={`mt-0.5 flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors ${
                    inputs.onBrandEnabled ? 'bg-[#FF5E3A]' : 'bg-white/15'
                  }`}
                >
                  <span
                    className={`h-5 w-5 rounded-full bg-white transition-transform ${
                      inputs.onBrandEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </span>
              </button>
              <p className="text-xs leading-relaxed text-white/40">
                {inputs.onBrandEnabled
                  ? 'The agent applies your brand voice, tone, and compliance rules, and selects the most relevant intelligence systems for this campaign. Image and video models are chosen automatically for each concept.'
                  : 'Concepts will be generated without brand anchoring or stored intelligence — the brief and inputs only.'}
              </p>
            </div>
          )}

          {step === 4 && (
            <div className="animate-fade-up space-y-4">
              <div className="space-y-1.5 rounded-lg border border-border bg-background/60 p-4 text-sm">
                <SummaryRow label="Angle" value={inputs.angleIsAgentDecided ? 'Agent decides' : inputs.angle} />
                <SummaryRow
                  label="Audience"
                  value={inputs.audienceType === audienceOptions[0].label ? 'Agent decides' : inputs.audienceType}
                />
                <SummaryRow
                  label="Awareness"
                  value={inputs.awarenessStage === awarenessOptions[0].label ? 'Agent decides' : inputs.awarenessStage}
                />
                <SummaryRow
                  label="Offer"
                  value={inputs.offerType === offerOptions[0].label ? 'Agent decides' : inputs.offerType}
                />
                <SummaryRow label="CTA name" value={inputs.offerName.trim() || '—'} />
                <SummaryRow label="On Brand" value={inputs.onBrandEnabled ? 'On' : 'Off'} />
                <SummaryRow
                  label="Outputs"
                  value={inputs.outputTypesAgentDecided ? 'Agent decides' : inputs.outputTypes.join(', ')}
                />
                {inputs.brief.trim() && (
                  <div className="flex gap-3 border-t border-border pt-1.5">
                    <span className="w-24 shrink-0 text-[11px] uppercase tracking-[0.08em] text-white/35">
                      Brief
                    </span>
                    <span className="truncate text-white/70">{inputs.brief.trim()}</span>
                  </div>
                )}
              </div>

              <div>
                <button
                  type="button"
                  onClick={fire}
                  className="fire-btn flex w-full items-center justify-center gap-2 rounded-full px-4 py-4 font-display text-base font-bold uppercase tracking-wide text-white"
                >
                  <Atom size={16} /> ⚡ Fire Reactor
                </button>
                <p className="mt-2 text-center text-[11px] text-white/35">
                  Claude Opus 4.8 · Agentic retrieval · Self-critique scoring
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-border px-5 py-3.5">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="flex items-center gap-1 rounded-lg border border-border bg-surface/40 px-3 py-1.5 text-xs font-medium text-white/70 transition-colors hover:text-white"
            >
              <ChevronLeft size={14} /> Back
            </button>
          ) : (
            <span />
          )}

          <span className="text-[11px] uppercase tracking-[0.14em] text-white/35">
            Step {step} of 4
          </span>

          {step < 4 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              className="flex items-center gap-1 rounded-lg border border-[#FF5E3A]/40 bg-[#FF5E3A]/10 px-3 py-1.5 text-xs font-semibold text-[#FF5E3A] transition-colors hover:bg-[#FF5E3A]/20"
            >
              Next <ChevronRight size={14} />
            </button>
          ) : (
            <span />
          )}
        </div>
      </div>
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <span className="w-24 shrink-0 text-[11px] uppercase tracking-[0.08em] text-white/35">
        {label}
      </span>
      <span className="text-white/80">{value}</span>
    </div>
  )
}
