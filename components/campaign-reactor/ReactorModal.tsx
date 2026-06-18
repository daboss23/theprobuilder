'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Atom,
  Brain,
  Check,
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

// Everything the modal needs to render the full input set lives in Workbench
// state and is threaded through here so the manual controls keep their existing
// recommendation / reference-library wiring.
export interface ReactorForm {
  // Slide 1 — brief, angle, outputs
  brief: string
  setBrief: (v: string) => void
  angleOptions: string[]
  angle: string
  setAngle: (v: string) => void
  outputTypeList: string[]
  outputs: string[]
  toggleOutput: (v: string) => void
  // Slide 2 — awareness, audience, offer
  awarenessOptions: DirectiveOption[]
  awareness: DirectiveOption
  setAwareness: (v: DirectiveOption) => void
  audienceOptions: DirectiveOption[]
  audience: DirectiveOption
  setAudience: (v: DirectiveOption) => void
  offerOptions: DirectiveOption[]
  offer: DirectiveOption
  setOffer: (v: DirectiveOption) => void
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
  // Intelligence pre-selection — which fields already carry a recommendation,
  // and whether the system is currently analyzing the brief.
  agentPicked: Record<string, boolean>
  suggesting: boolean
  // Strategic Intelligence — the read OPUS presents before the reactor fires.
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

// Label for an intelligence-assisted field — shows that the system has a
// recommendation in place (overridable), or that it is still analyzing. We
// present intelligence, never "chosen by agent".
function AgentFieldLabel({
  children,
  picked,
  thinking,
}: {
  children: React.ReactNode
  picked?: boolean
  thinking?: boolean
}) {
  return (
    <div className="mb-1.5 flex items-center gap-2">
      <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-white/40">{children}</p>
      {picked ? (
        <span className="inline-flex items-center gap-1 rounded-full border border-[#FF5E3A]/40 bg-[#FF5E3A]/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[#FF5E3A]">
          <Sparkles size={9} /> Recommended
        </span>
      ) : thinking ? (
        <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-wide text-white/35">
          <Loader2 size={9} className="animate-spin" /> analyzing…
        </span>
      ) : null}
    </div>
  )
}

const selectClass =
  'w-full rounded-lg border border-border bg-surface/60 px-3 py-2.5 text-sm text-white outline-none focus:border-[#FF5E3A]/60'

export function ReactorModal({ open, onClose, onFire, form }: ReactorModalProps) {
  const [step, setStep] = useState(1)

  useEffect(() => {
    if (open) setStep(1)
  }, [open])

  const dirty = useMemo(
    () =>
      form.brief.trim() !== '' ||
      form.offerName.trim() !== '' ||
      form.awareness !== form.awarenessOptions[0] ||
      form.audience !== form.audienceOptions[0] ||
      form.offer !== form.offerOptions[0] ||
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

  useEffect(() => {
    if (open && step === 5) form.loadIntelligence()
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

  const agentDecidesAngle = form.angle === form.angleOptions[0]
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
                <AgentFieldLabel picked={form.agentPicked.angle} thinking={form.suggesting}>
                  Campaign Angle
                </AgentFieldLabel>
                <select
                  value={form.angle}
                  onChange={(e) => form.setAngle(e.target.value)}
                  className={selectClass}
                >
                  {form.angleOptions.map((a, i) => (
                    <option key={a} value={a} className="bg-card">
                      {i === 0 ? 'Recommended' : a}
                    </option>
                  ))}
                </select>
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
              <p className="rounded-lg border border-[#FF5E3A]/25 bg-[#FF5E3A]/[0.06] px-3 py-2 text-[11px] leading-relaxed text-white/55">
                Strategic intelligence has set these from your brief. Change any of them — your
                choice stays locked.
              </p>
              <div>
                <AgentFieldLabel picked={form.agentPicked.awareness} thinking={form.suggesting}>
                  Awareness Stage
                </AgentFieldLabel>
                <select
                  value={form.awareness.label}
                  onChange={(e) =>
                    form.setAwareness(
                      form.awarenessOptions.find((o) => o.label === e.target.value)!,
                    )
                  }
                  className={selectClass}
                >
                  {form.awarenessOptions.map((o, i) => (
                    <option key={o.label} value={o.label} className="bg-card">
                      {i === 0 ? 'Recommended' : o.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <AgentFieldLabel picked={form.agentPicked.audience} thinking={form.suggesting}>
                  Audience Type
                </AgentFieldLabel>
                <select
                  value={form.audience.label}
                  onChange={(e) =>
                    form.setAudience(form.audienceOptions.find((o) => o.label === e.target.value)!)
                  }
                  className={selectClass}
                >
                  {form.audienceOptions.map((o, i) => (
                    <option key={o.label} value={o.label} className="bg-card">
                      {i === 0 ? 'Recommended' : o.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <AgentFieldLabel picked={form.agentPicked.offer} thinking={form.suggesting}>
                  Offer Type
                </AgentFieldLabel>
                <select
                  value={form.offer.label}
                  onChange={(e) =>
                    form.setOffer(form.offerOptions.find((o) => o.label === e.target.value)!)
                  }
                  className={selectClass}
                >
                  {form.offerOptions.map((o, i) => (
                    <option key={o.label} value={o.label} className="bg-card">
                      {i === 0 ? 'Recommended' : o.label}
                    </option>
                  ))}
                </select>
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
                <SummaryRow label="Angle" value={agentDecidesAngle ? 'Agent decides' : form.angle} />
                <SummaryRow
                  label="Audience"
                  value={
                    form.audience === form.audienceOptions[0] ? 'Agent decides' : form.audience.label
                  }
                />
                <SummaryRow
                  label="Awareness"
                  value={
                    form.awareness === form.awarenessOptions[0]
                      ? 'Agent decides'
                      : form.awareness.label
                  }
                />
                <SummaryRow
                  label="Offer"
                  value={form.offer === form.offerOptions[0] ? 'Agent decides' : form.offer.label}
                />
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

// The Strategic Intelligence read OPUS presents before the reactor fires. This
// is intelligence — pains, desires, patterns, recommended structures — never
// exposed agent machinery.
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
