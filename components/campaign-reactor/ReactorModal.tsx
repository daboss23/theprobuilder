'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Atom,
  Brain,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clapperboard,
  Gauge,
  ImageIcon,
  Loader2,
  Sparkles,
  X,
} from 'lucide-react'
import { FaceLibrary } from '@/components/reactor/FaceLibrary'
import type { DirectiveOption, StrategicIntelligence } from '@/lib/reactor-inputs'
import type { ModelAvailability } from '@/lib/video/types'
import type { ImageModelAvailability } from '@/lib/image/types'

const STEP_LABELS = [
  'Campaign Brief',
  'Audience + Offer',
  'Intelligence + Models',
  'On Brand',
  'Ready To Fire',
] as const

interface ModelRec {
  modelId: string
  reason: string
  configured: boolean
}

/**
 * A strategic input field. The platform recommends, the recommendation is
 * visible and pre-selected, and the user can accept, override, choose No
 * Preference, or (where allowed) create a custom value — all from one control.
 */
export interface StrategicField {
  options: string[]
  /** The currently selected native option, or '' when custom / no-preference. */
  value: string
  recommended: string | null
  noPreference: boolean
  thinking: boolean
  custom: {
    allowed: boolean
    active: boolean
    value: string
    placeholder: string
    examples: string[]
  }
  onSelect: (label: string) => void
  onCustom: () => void
  onCustomChange: (v: string) => void
  onNoPreference: () => void
}

// Everything the modal needs to render the full input set lives in Workbench
// state and is threaded through here so the manual controls keep their existing
// recommendation / reference-library wiring.
export interface ReactorForm {
  // Slide 1 — brief, angle, outputs
  brief: string
  setBrief: (v: string) => void
  angleField: StrategicField
  outputTypeList: string[]
  outputs: string[]
  toggleOutput: (v: string) => void
  // Slide 2 — awareness, audience, offer
  awarenessField: StrategicField
  audienceField: StrategicField
  offerField: StrategicField
  offerName: string
  setOfferName: (v: string) => void
  // Slide 3 — intelligence inputs + models + reference library
  intelligenceInputs: string[]
  activeInputs: string[]
  toggleInput: (v: string) => void
  imageModels: ImageModelAvailability[]
  imageModel: string
  setImageModel: (v: string) => void
  imageRecommendation: ModelRec | null
  showImagePicker: boolean
  videoModels: ModelAvailability[]
  videoModel: string
  setVideoModel: (v: string) => void
  videoRecommendation: ModelRec | null
  showVideoPicker: boolean
  onFaceChange: (images: string[], videos: string[]) => void
  refCount: number
  // Slide 4 — on brand
  onBrand: boolean
  setOnBrand: (v: boolean) => void
  // Whether the system is currently analyzing the brief.
  suggesting: boolean
  // Strategic Intelligence — the read OPUS presents to explain the recommendations.
  intelligence: StrategicIntelligence | null
  intelligenceLoading: boolean
  loadIntelligence: () => void
}

interface ReactorModalProps {
  open: boolean
  onClose: () => void
  onFire: () => void
  form: ReactorForm
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-white/40">
      {children}
    </p>
  )
}

// Label for an intelligence-assisted field — shows that the system is still
// analyzing the brief. The recommendation itself is shown inside the control.
function AgentFieldLabel({
  children,
  thinking,
}: {
  children: React.ReactNode
  thinking?: boolean
}) {
  return (
    <div className="mb-1.5 flex items-center gap-2">
      <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-white/40">{children}</p>
      {thinking ? (
        <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-wide text-white/35">
          <Loader2 size={9} className="animate-spin" /> analyzing…
        </span>
      ) : null}
    </div>
  )
}

const selectClass =
  'w-full rounded-lg border border-border bg-surface/60 px-3 py-2.5 text-sm text-white outline-none focus:border-[#FF5E3A]/60'

const CUSTOM_SENTINEL = '__custom__'
const NO_PREF_LABEL = 'No Preference'

/**
 * Recommendation-aware dropdown. Renders the recommended option at the top with
 * a glow + checkmark + "Recommended" badge, then the other options, then a
 * Custom… reveal (when allowed) and a universal No Preference. The current
 * selection is visible on the trigger without opening the menu.
 */
function StrategicSelect({ field }: { field: StrategicField }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('mousedown', onDown)
    return () => window.removeEventListener('mousedown', onDown)
  }, [open])

  const { value, recommended, noPreference, custom } = field
  const isRecommendedSelected = !custom.active && !noPreference && !!value && value === recommended

  // Ordered menu: recommended first (if any), then the rest, deduped.
  const ordered = useMemo(() => {
    if (!recommended || !field.options.includes(recommended)) return field.options
    return [recommended, ...field.options.filter((o) => o !== recommended)]
  }, [field.options, recommended])

  const choose = (label: string) => {
    if (label === CUSTOM_SENTINEL) field.onCustom()
    else if (label === NO_PREF_LABEL) field.onNoPreference()
    else field.onSelect(label)
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-left text-sm outline-none transition-colors ${
          isRecommendedSelected
            ? 'border-[#FF5E3A]/50 bg-[#FF5E3A]/[0.06] text-white shadow-[0_0_0_1px_rgba(255,94,58,0.15),0_0_22px_-6px_rgba(255,94,58,0.45)]'
            : 'border-border bg-surface/60 text-white hover:border-white/20'
        }`}
      >
        <span className="flex min-w-0 items-center gap-2">
          {isRecommendedSelected && <Sparkles size={13} className="shrink-0 text-[#FF5E3A]" />}
          <span className="truncate">
            {custom.active ? (
              custom.value || 'Custom…'
            ) : noPreference ? (
              <span className="text-white/55">No Preference</span>
            ) : value ? (
              <>
                {value}
                {isRecommendedSelected && (
                  <span className="ml-1.5 text-[#FF5E3A]">• Recommended</span>
                )}
              </>
            ) : (
              <span className="text-white/40">Select…</span>
            )}
          </span>
        </span>
        <ChevronDown
          size={15}
          className={`shrink-0 text-white/40 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute z-[60] mt-1.5 max-h-64 w-full overflow-y-auto rounded-lg border border-border bg-card p-1 shadow-2xl">
          {ordered.map((opt) => {
            const isRec = opt === recommended
            const isSel = !custom.active && !noPreference && opt === value
            return (
              <button
                key={opt}
                type="button"
                onClick={() => choose(opt)}
                className={`flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors ${
                  isRec
                    ? 'bg-[#FF5E3A]/[0.08] text-white hover:bg-[#FF5E3A]/15'
                    : 'text-white/80 hover:bg-white/[0.06]'
                }`}
              >
                <span className="flex min-w-0 items-center gap-2">
                  {isRec ? (
                    <Check size={13} className="shrink-0 text-[#FF5E3A]" />
                  ) : isSel ? (
                    <Check size={13} className="shrink-0 text-white/60" />
                  ) : (
                    <span className="w-[13px] shrink-0" />
                  )}
                  <span className={`truncate ${isRec ? 'font-semibold' : ''}`}>{opt}</span>
                </span>
                {isRec && (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#FF5E3A]/40 bg-[#FF5E3A]/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[#FF5E3A]">
                    <Sparkles size={8} /> Recommended
                  </span>
                )}
              </button>
            )
          })}

          <div className="my-1 h-px bg-border" />

          {custom.allowed && (
            <button
              type="button"
              onClick={() => choose(CUSTOM_SENTINEL)}
              className={`flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors ${
                custom.active ? 'bg-white/[0.06] text-white' : 'text-white/70 hover:bg-white/[0.06]'
              }`}
            >
              {custom.active ? (
                <Check size={13} className="shrink-0 text-white/60" />
              ) : (
                <span className="w-[13px] shrink-0" />
              )}
              <span>Custom…</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => choose(NO_PREF_LABEL)}
            className={`flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors ${
              noPreference ? 'bg-white/[0.06] text-white' : 'text-white/55 hover:bg-white/[0.06]'
            }`}
          >
            {noPreference ? (
              <Check size={13} className="shrink-0 text-white/60" />
            ) : (
              <span className="w-[13px] shrink-0" />
            )}
            <span>No Preference</span>
          </button>
        </div>
      )}

      {custom.active && (
        <div className="mt-2">
          <input
            value={custom.value}
            onChange={(e) => field.onCustomChange(e.target.value)}
            placeholder={custom.placeholder}
            autoFocus
            className={selectClass}
          />
          {custom.examples.length > 0 && (
            <p className="mt-1.5 text-[11px] text-white/35">
              e.g. {custom.examples.join(' · ')}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// What a strategic field shows in the final review summary.
function fieldSummary(field: StrategicField): string {
  if (field.custom.active) return field.custom.value.trim() || 'Custom (unset)'
  if (field.noPreference) return 'No Preference — Reactor decides'
  return field.value || 'No Preference — Reactor decides'
}

export function ReactorModal({ open, onClose, onFire, form }: ReactorModalProps) {
  const [step, setStep] = useState(1)

  useEffect(() => {
    if (open) setStep(1)
  }, [open])

  const dirty = useMemo(
    () =>
      form.brief.trim() !== '' ||
      form.offerName.trim() !== '' ||
      !form.awarenessField.noPreference ||
      !form.audienceField.noPreference ||
      !form.offerField.noPreference ||
      form.onBrand === false,
    [form],
  )

  const requestClose = () => {
    if (dirty && !window.confirm('Discard inputs and close?')) return
    onClose()
  }

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') requestClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, dirty])

  // Load the Strategic Intelligence read as soon as the user reaches the
  // strategic step (so the recommendations have visible reasoning), and again at
  // the final review.
  useEffect(() => {
    if (open && (step === 2 || step === 5)) form.loadIntelligence()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, step])

  if (!open) return null

  const fire = () => {
    onClose()
    onFire()
  }

  const imageLabelFor = (id?: string | null) =>
    form.imageModels.find((m) => m.id === id)?.label ?? id ?? ''
  const videoLabelFor = (id?: string | null) =>
    form.videoModels.find((m) => m.id === id)?.label ?? id ?? ''

  const progress = (step / 5) * 100

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
              {[1, 2, 3, 4, 5].map((n) => {
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
        <div className="max-h-[62vh] overflow-y-auto px-5 py-5">
          {step === 1 && (
            <div className="animate-fade-up space-y-4">
              <div>
                <FieldLabel>Campaign Brief</FieldLabel>
                <p className="mb-2 text-xs text-white/40">
                  Optional but high-leverage. Direction, tone, proof asset, creative constraints —
                  the agent reads this first.
                </p>
                <textarea
                  value={form.brief}
                  onChange={(e) => form.setBrief(e.target.value)}
                  placeholder={`e.g. "Targeting operators $1.5M–$3M still on the tools. Lead with Jason — 14 months, off tools, margin up. Want identity shift, not another hustle ad."`}
                  className="h-[90px] w-full resize-none rounded-lg border border-border bg-surface/60 px-3 py-2.5 text-sm text-white outline-none focus:border-[#FF5E3A]/60"
                />
              </div>

              <div>
                <AgentFieldLabel thinking={form.suggesting}>Campaign Angle</AgentFieldLabel>
                <StrategicSelect field={form.angleField} />
              </div>

              <div>
                <FieldLabel>Output Types (leave none for agent to decide)</FieldLabel>
                <div className="flex flex-wrap gap-1.5">
                  {form.outputTypeList.map((o) => {
                    const on = form.outputs.includes(o)
                    return (
                      <button
                        key={o}
                        type="button"
                        onClick={() => form.toggleOutput(o)}
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
            </div>
          )}

          {step === 2 && (
            <div className="animate-fade-up space-y-4">
              <p className="rounded-lg border border-[#FF5E3A]/25 bg-[#FF5E3A]/[0.06] px-3 py-2 text-[11px] leading-relaxed text-white/60">
                Strategic Intelligence analysed your brief and pre-selected the highest-confidence
                options. Override any recommendation if desired.
              </p>

              <StrategicIntelligencePanel
                intelligence={form.intelligence}
                loading={form.intelligenceLoading}
              />

              <div>
                <AgentFieldLabel thinking={form.suggesting}>Awareness Stage</AgentFieldLabel>
                <StrategicSelect field={form.awarenessField} />
              </div>

              <div>
                <AgentFieldLabel thinking={form.suggesting}>Audience Type</AgentFieldLabel>
                <StrategicSelect field={form.audienceField} />
              </div>

              <div>
                <AgentFieldLabel thinking={form.suggesting}>Offer Type</AgentFieldLabel>
                <StrategicSelect field={form.offerField} />
              </div>

              <div>
                <FieldLabel>Offer Name</FieldLabel>
                <input
                  value={form.offerName}
                  onChange={(e) => form.setOfferName(e.target.value)}
                  placeholder={`e.g. "The Owner Freedom Roadmap"`}
                  className={selectClass}
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-fade-up space-y-4">
              <div>
                <FieldLabel>Intelligence Inputs</FieldLabel>
                <div className="space-y-1.5">
                  {form.intelligenceInputs.map((i) => {
                    const on = form.activeInputs.includes(i)
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => form.toggleInput(i)}
                        className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm transition-all ${
                          on
                            ? 'border-primary/30 bg-primary/10 text-white'
                            : 'border-border bg-surface/30 text-white/45'
                        }`}
                      >
                        {i}
                        <span
                          className={`grid h-4 w-4 place-items-center rounded ${
                            on ? 'bg-glow text-background' : 'border border-border'
                          }`}
                        >
                          {on && <Check size={11} />}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {form.showImagePicker && (
                <div>
                  <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-white/40">
                    <ImageIcon size={12} /> Image Model
                  </p>
                  <select
                    value={form.imageModel}
                    onChange={(e) => form.setImageModel(e.target.value)}
                    className={selectClass}
                  >
                    <option value="auto" className="bg-card">
                      Auto — recommended
                      {form.imageRecommendation
                        ? ` (${imageLabelFor(form.imageRecommendation.modelId)})`
                        : ''}
                    </option>
                    {form.imageModels.map((m) => (
                      <option key={m.id} value={m.id} className="bg-card" disabled={!m.configured}>
                        {m.label}
                        {m.configured ? '' : ' — needs key'}
                      </option>
                    ))}
                  </select>
                  {form.imageRecommendation && (
                    <div className="mt-2 flex items-start gap-1.5 rounded-lg border border-primary/20 bg-primary/[0.06] px-2.5 py-2 text-[11px] text-white/60">
                      <Sparkles size={12} className="mt-0.5 shrink-0 text-glow" />
                      <span>
                        <span className="text-glow/80">Recommended:</span>{' '}
                        {imageLabelFor(form.imageRecommendation.modelId)} —{' '}
                        {form.imageRecommendation.reason}.
                        {!form.imageRecommendation.configured && (
                          <span className="text-warning"> Add its API key to enable.</span>
                        )}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {form.showVideoPicker && (
                <div>
                  <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-white/40">
                    <Clapperboard size={12} /> Video Model
                  </p>
                  <select
                    value={form.videoModel}
                    onChange={(e) => form.setVideoModel(e.target.value)}
                    className={selectClass}
                  >
                    <option value="auto" className="bg-card">
                      Auto — recommended
                      {form.videoRecommendation
                        ? ` (${videoLabelFor(form.videoRecommendation.modelId)})`
                        : ''}
                    </option>
                    {form.videoModels.map((m) => (
                      <option key={m.id} value={m.id} className="bg-card" disabled={!m.configured}>
                        {m.label}
                        {m.audio ? ' · audio' : ''}
                        {m.configured ? '' : ' — needs key'}
                      </option>
                    ))}
                  </select>
                  {form.videoRecommendation && (
                    <div className="mt-2 flex items-start gap-1.5 rounded-lg border border-primary/20 bg-primary/[0.06] px-2.5 py-2 text-[11px] text-white/60">
                      <Sparkles size={12} className="mt-0.5 shrink-0 text-glow" />
                      <span>
                        <span className="text-glow/80">Recommended:</span>{' '}
                        {videoLabelFor(form.videoRecommendation.modelId)} —{' '}
                        {form.videoRecommendation.reason}.
                        {!form.videoRecommendation.configured && (
                          <span className="text-warning"> Add its API key to enable.</span>
                        )}
                      </span>
                    </div>
                  )}
                  <FaceLibrary onChange={form.onFaceChange} />
                </div>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="animate-fade-up space-y-4">
              <button
                type="button"
                onClick={() => form.setOnBrand(!form.onBrand)}
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
                    form.onBrand ? 'bg-[#FF5E3A]' : 'bg-white/15'
                  }`}
                >
                  <span
                    className={`h-5 w-5 rounded-full bg-white transition-transform ${
                      form.onBrand ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </span>
              </button>
              <p className="text-xs leading-relaxed text-white/40">
                {form.onBrand
                  ? 'The agent applies your brand voice, tone, and compliance rules throughout every concept.'
                  : 'Concepts will be generated without brand anchoring — the brief and inputs only.'}
              </p>
            </div>
          )}

          {step === 5 && (
            <div className="animate-fade-up space-y-4">
              <StrategicIntelligencePanel
                intelligence={form.intelligence}
                loading={form.intelligenceLoading}
              />

              <div className="space-y-1.5 rounded-lg border border-border bg-background/60 p-4 text-sm">
                <SummaryRow label="Angle" value={fieldSummary(form.angleField)} />
                <SummaryRow label="Audience" value={fieldSummary(form.audienceField)} />
                <SummaryRow label="Awareness" value={fieldSummary(form.awarenessField)} />
                <SummaryRow label="Offer" value={fieldSummary(form.offerField)} />
                <SummaryRow label="CTA name" value={form.offerName.trim() || '—'} />
                <SummaryRow label="On Brand" value={form.onBrand ? 'On' : 'Off'} />
                <SummaryRow
                  label="Outputs"
                  value={form.outputs.length ? form.outputs.join(', ') : 'Agent decides'}
                />
                <SummaryRow
                  label="Intelligence"
                  value={
                    form.activeInputs.length === form.intelligenceInputs.length
                      ? 'All systems'
                      : form.activeInputs.join(', ') || 'None'
                  }
                />
                {form.showImagePicker && (
                  <SummaryRow
                    label="Image model"
                    value={
                      form.imageModel === 'auto'
                        ? `Auto${form.imageRecommendation ? ` (${imageLabelFor(form.imageRecommendation.modelId)})` : ''}`
                        : imageLabelFor(form.imageModel)
                    }
                  />
                )}
                {form.showVideoPicker && (
                  <SummaryRow
                    label="Video model"
                    value={
                      form.videoModel === 'auto'
                        ? `Auto${form.videoRecommendation ? ` (${videoLabelFor(form.videoRecommendation.modelId)})` : ''}`
                        : videoLabelFor(form.videoModel)
                    }
                  />
                )}
                {form.brief.trim() && (
                  <div className="flex gap-3 border-t border-border pt-1.5">
                    <span className="w-24 shrink-0 text-[11px] uppercase tracking-[0.08em] text-white/35">
                      Brief
                    </span>
                    <span className="truncate text-white/70">{form.brief.trim()}</span>
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
                  OPUS · Strategic synthesis · Self-critique scoring
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
            Step {step} of 5
          </span>

          {step < 5 ? (
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

// The Strategic Intelligence read OPUS presents to explain the recommendations.
// This is intelligence — pains, desires, patterns, recommended structures —
// never exposed agent machinery.
function StrategicIntelligencePanel({
  intelligence,
  loading,
}: {
  intelligence: StrategicIntelligence | null
  loading: boolean
}) {
  const confTone =
    intelligence?.confidence === 'High'
      ? 'bg-success/15 text-success'
      : intelligence?.confidence === 'Medium'
        ? 'bg-warning/15 text-warning'
        : 'bg-white/10 text-white/55'

  return (
    <div className="rounded-xl border border-[#FF5E3A]/25 bg-[#FF5E3A]/[0.05] p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Brain size={15} className="text-[#FF5E3A]" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/80">
            Strategic Intelligence
          </span>
        </div>
        {loading ? (
          <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide text-white/40">
            <Loader2 size={11} className="animate-spin" /> analyzing…
          </span>
        ) : intelligence ? (
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${confTone}`}>
            <Gauge size={10} /> {intelligence.confidence} · {intelligence.confidenceScore}%
          </span>
        ) : null}
      </div>

      {loading && !intelligence ? (
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-3 w-full animate-pulse rounded bg-white/5" />
          ))}
        </div>
      ) : intelligence ? (
        <div className="space-y-2 text-sm">
          <IntelRow label="Awareness" value={intelligence.awareness} />
          <IntelRow label="Primary Pain" value={intelligence.primaryPain} />
          <IntelRow label="Primary Desire" value={intelligence.primaryDesire} />
          <IntelRow label="Primary Pattern" value={intelligence.primaryPattern} accent />
          <IntelRow label="Creative Structure" value={intelligence.recommendedCreativeStructure} />
          <IntelRow label="Copy Structure" value={intelligence.recommendedCopyStructure} />
          <IntelRow label="Offer Positioning" value={intelligence.recommendedOfferPositioning} />

          {(intelligence.knowledgeAssetsConsulted.length > 0 ||
            intelligence.researchSourcesConsulted.length > 0) && (
            <div className="space-y-2 border-t border-white/10 pt-2.5">
              {intelligence.knowledgeAssetsConsulted.length > 0 && (
                <ConsultedRow label="Knowledge Assets" items={intelligence.knowledgeAssetsConsulted} />
              )}
              {intelligence.researchSourcesConsulted.length > 0 && (
                <ConsultedRow label="Research Sources" items={intelligence.researchSourcesConsulted} />
              )}
            </div>
          )}
        </div>
      ) : (
        <p className="text-xs text-white/40">
          Add a brief on Step 1 and the platform will present its strategic read here.
        </p>
      )}
    </div>
  )
}

function IntelRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex gap-3">
      <span className="w-28 shrink-0 text-[11px] uppercase tracking-[0.08em] text-white/35">
        {label}
      </span>
      <span className={accent ? 'font-medium text-[#FF5E3A]' : 'text-white/75'}>{value}</span>
    </div>
  )
}

function ConsultedRow({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="flex gap-3">
      <span className="w-28 shrink-0 text-[11px] uppercase tracking-[0.08em] text-white/35">
        {label}
      </span>
      <div className="flex flex-wrap gap-1.5">
        {items.map((it) => (
          <span
            key={it}
            className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[10px] text-white/55"
          >
            {it}
          </span>
        ))}
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
