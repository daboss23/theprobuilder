'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Activity,
  Atom,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleOff,
  Clapperboard,
  Gauge,
  ImageIcon,
  Loader2,
  Radio,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react'
import type { AngleEvidence } from '@/lib/reactor-inputs'

// The launch sequence — five bold steps, each a moment, not a form field.
const STEPS = [
  { label: 'The Brief', sub: 'Set the direction, the angle, and what to build.' },
  { label: 'Audience & Offer', sub: 'Who you are speaking to — and what you are selling.' },
  { label: 'Performance Feed', sub: 'Plug live Meta ad performance into this run.' },
  { label: 'On Brand', sub: 'Apply your brand voice, tone, and compliance.' },
  { label: 'Ignition', sub: 'Review the configuration and fire the reactor.' },
] as const

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
  /** Strategic reasoning behind the recommendation (angle field). */
  recommendation?: {
    reason?: string
    confidence?: number
    evidence?: AngleEvidence | null
  }
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
// recommendation wiring.
export interface ReactorForm {
  // Step 1 — brief, angle, deliverables
  brief: string
  setBrief: (v: string) => void
  angleField: StrategicField
  // Creative Deliverables — Static / Video creative. OPUS recommends from the
  // brief; the user approves or overrides.
  outputTypeList: string[]
  outputs: string[]
  toggleOutput: (v: string) => void
  recommendedDeliverables: string[]
  deliverablesReason: string
  // Step 2 — awareness, audience, offer
  awarenessField: StrategicField
  audienceField: StrategicField
  offerField: StrategicField
  offerName: string
  setOfferName: (v: string) => void
  // Step 3 — Meta Ads performance feed: 'off' (standalone), 'pipeboard', 'meta'.
  metaProvider: string
  setMetaProvider: (v: string) => void
  // Step 4 — on brand
  onBrand: boolean
  setOnBrand: (v: boolean) => void
  // Whether the system is currently analyzing the brief.
  suggesting: boolean
}

interface ReactorModalProps {
  open: boolean
  onClose: () => void
  onFire: () => void
  form: ReactorForm
}

// Section label — brighter and larger than the old dull micro-caps.
function SectionLabel({
  children,
  thinking,
}: {
  children: React.ReactNode
  thinking?: boolean
}) {
  return (
    <div className="mb-2.5 flex items-center gap-2">
      <p className="sec-label">{children}</p>
      {thinking ? (
        <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide text-[#FF9D4D]/80">
          <Loader2 size={10} className="animate-spin" /> analyzing…
        </span>
      ) : null}
    </div>
  )
}

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
    if (!recommended) return field.options
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
        className={`flex w-full items-center justify-between gap-2 rounded-xl border px-4 py-3.5 text-left text-[15px] outline-none transition-all ${
          isRecommendedSelected
            ? 'border-[#FF7C54]/55 bg-[#FF5E3A]/[0.08] text-white shadow-[0_0_0_1px_rgba(255,94,58,0.16),0_0_26px_-6px_rgba(255,94,58,0.5)]'
            : 'border-white/12 bg-black/40 text-white hover:border-[#FF9D4D]/40'
        }`}
      >
        <span className="flex min-w-0 items-center gap-2.5">
          {isRecommendedSelected && <Sparkles size={15} className="shrink-0 text-[#FF9D4D]" />}
          <span className="truncate">
            {custom.active ? (
              custom.value || 'Custom…'
            ) : noPreference ? (
              <span className="text-white/50">No Preference</span>
            ) : value ? (
              <>
                {value}
                {isRecommendedSelected && (
                  <span className="ml-2 text-[13px] text-[#FF9D4D]">• Recommended</span>
                )}
              </>
            ) : (
              <span className="text-white/40">Select…</span>
            )}
          </span>
        </span>
        <ChevronDown
          size={17}
          className={`shrink-0 text-white/40 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute z-[70] mt-2 max-h-64 w-full overflow-y-auto rounded-xl border border-white/12 bg-[#0B0B12] p-1.5 shadow-2xl">
          {ordered.map((opt) => {
            const isRec = opt === recommended
            const isSel = !custom.active && !noPreference && opt === value
            return (
              <button
                key={opt}
                type="button"
                onClick={() => choose(opt)}
                className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                  isRec
                    ? 'bg-[#FF5E3A]/[0.09] text-white hover:bg-[#FF5E3A]/15'
                    : 'text-white/80 hover:bg-white/[0.06]'
                }`}
              >
                <span className="flex min-w-0 items-center gap-2">
                  {isRec ? (
                    <Check size={14} className="shrink-0 text-[#FF9D4D]" />
                  ) : isSel ? (
                    <Check size={14} className="shrink-0 text-white/60" />
                  ) : (
                    <span className="w-[14px] shrink-0" />
                  )}
                  <span className={`truncate ${isRec ? 'font-semibold' : ''}`}>{opt}</span>
                </span>
                {isRec && (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#FF7C54]/40 bg-[#FF5E3A]/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[#FF9D4D]">
                    <Sparkles size={9} /> Recommended
                  </span>
                )}
              </button>
            )
          })}

          <div className="my-1.5 h-px bg-white/10" />

          {custom.allowed && (
            <button
              type="button"
              onClick={() => choose(CUSTOM_SENTINEL)}
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                custom.active ? 'bg-white/[0.06] text-white' : 'text-white/70 hover:bg-white/[0.06]'
              }`}
            >
              {custom.active ? (
                <Check size={14} className="shrink-0 text-white/60" />
              ) : (
                <span className="w-[14px] shrink-0" />
              )}
              <span>Custom…</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => choose(NO_PREF_LABEL)}
            className={`flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
              noPreference ? 'bg-white/[0.06] text-white' : 'text-white/55 hover:bg-white/[0.06]'
            }`}
          >
            {noPreference ? (
              <Check size={14} className="shrink-0 text-white/60" />
            ) : (
              <span className="w-[14px] shrink-0" />
            )}
            <span>No Preference</span>
          </button>
        </div>
      )}

      {custom.active && (
        <div className="mt-2.5">
          <input
            value={custom.value}
            onChange={(e) => field.onCustomChange(e.target.value)}
            placeholder={custom.placeholder}
            autoFocus
            className="launch-input px-4 py-3 text-[15px]"
          />
          {custom.examples.length > 0 && (
            <p className="mt-2 text-xs text-white/35">e.g. {custom.examples.join(' · ')}</p>
          )}
        </div>
      )}
    </div>
  )
}

// Strategic reasoning behind the recommended angle — confidence, the why, and
// ORACLE memory evidence. Makes the dropdown feel like a strategist, not a form.
function AngleRecommendation({ field }: { field: StrategicField }) {
  const rec = field.recommendation
  if (!rec?.reason || field.custom.active || field.noPreference) return null
  const ev = rec.evidence
  return (
    <div className="mt-2.5 rounded-xl border border-[#FF7C54]/20 bg-[#FF5E3A]/[0.06] px-4 py-3 text-xs">
      <div className="mb-1.5 flex items-center gap-2">
        <span className="text-sm font-semibold text-white/90">{field.value || field.recommended}</span>
        {typeof rec.confidence === 'number' && (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#FF5E3A]/15 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[#FF9D4D]">
            <Gauge size={9} /> {rec.confidence}% confidence
          </span>
        )}
      </div>
      <p className="leading-relaxed text-white/55">{rec.reason}</p>
      {ev && ev.similar > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1 border-t border-white/10 pt-2.5 text-[10px] text-white/45">
          <span>
            <span className="text-white/65">{ev.similar}</span> similar stored campaign
            {ev.similar === 1 ? '' : 's'}
          </span>
          <span>
            <span className="text-success">{ev.winners}</span> historical winner
            {ev.winners === 1 ? '' : 's'}
          </span>
          {ev.avgWinScore !== null && (
            <span>
              avg win score <span className="text-white/65">{ev.avgWinScore}</span>
            </span>
          )}
        </div>
      )}
    </div>
  )
}

// Icon + one-line blurb for each of the two creative deliverables.
function deliverableMeta(label: string) {
  return /video/i.test(label)
    ? {
        Icon: Clapperboard,
        blurb: 'Founder VSLs, testimonials, UGC & cinematic on-site B-roll.',
      }
    : {
        Icon: ImageIcon,
        blurb: 'Proof statics, founder photos & campaign concept stills.',
      }
}

// The three Meta performance feed options, rendered as bold selectable cards.
const FEED_OPTIONS = [
  {
    id: 'off',
    Icon: CircleOff,
    title: 'Standalone',
    tag: 'No Meta data',
    desc: 'Fire on your intelligence vault alone. No live ad performance is read.',
  },
  {
    id: 'pipeboard',
    Icon: Activity,
    title: 'Pipeboard',
    tag: 'Hosted Meta Ads MCP',
    desc: 'OPUS reads live Meta ad performance through Pipeboard’s hosted connector.',
  },
  {
    id: 'meta',
    Icon: Radio,
    title: 'Meta Direct',
    tag: 'First-party Ads MCP',
    desc: 'Connect straight to Meta’s first-party Ads MCP at mcp.facebook.com.',
  },
] as const

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

  if (!open) return null

  const fire = () => {
    onClose()
    onFire()
  }

  const meta = STEPS[step - 1]
  const progress = (step / 5) * 100
  const feedTitle = FEED_OPTIONS.find((f) => f.id === form.metaProvider)?.title ?? 'Standalone'

  return (
    <div
      className="launch-overlay fixed inset-0 z-50 grid place-items-center px-4 py-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) requestClose()
      }}
    >
      <div className="launch-panel flex max-h-[92vh] w-[760px] max-w-[calc(100vw-2rem)] flex-col rounded-[1.75rem]">
        {/* Ignition progress */}
        <div className="launch-progress">
          <i style={{ width: `${progress}%` }} />
        </div>

        {/* Header — eyebrow, stepper, title */}
        <div className="border-b border-white/10 px-7 pb-5 pt-5">
          <div className="mb-5 flex items-center justify-between gap-3">
            <span className="launch-eyebrow">
              <Atom size={14} className="text-[#FF9D4D]" />
              New Creative Campaign
            </span>
            <button
              type="button"
              onClick={requestClose}
              className="grid h-8 w-8 place-items-center rounded-full text-white/40 transition-colors hover:bg-white/5 hover:text-white"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          {/* Stepper */}
          <div className="flex items-center gap-1.5">
            {STEPS.map((s, i) => {
              const n = i + 1
              const state = n === step ? 'active' : n < step ? 'done' : 'upcoming'
              return (
                <div key={s.label} className="flex flex-1 items-center gap-1.5 last:flex-none">
                  <div className="flex flex-col items-center gap-2">
                    <button
                      type="button"
                      disabled={state === 'upcoming'}
                      onClick={() => state === 'done' && setStep(n)}
                      data-state={state}
                      className={`launch-orb ${state === 'done' ? 'cursor-pointer' : 'cursor-default'}`}
                    >
                      {state === 'done' ? <Check size={14} /> : n}
                    </button>
                    <span
                      className={`hidden whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.1em] sm:block ${
                        state === 'active'
                          ? 'text-[#FF9D4D]'
                          : state === 'done'
                            ? 'text-white/55'
                            : 'text-white/25'
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                  {n < STEPS.length && (
                    <div className="launch-orb-line -mt-6" data-done={n < step} />
                  )}
                </div>
              )
            })}
          </div>

          <div className="mt-6">
            <h2 className="font-display text-2xl font-bold tracking-tight text-white">{meta.label}</h2>
            <p className="mt-1 text-sm text-white/45">{meta.sub}</p>
          </div>
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto px-7 py-6">
          {step === 1 && (
            <div className="animate-fade-up space-y-6">
              <div>
                <SectionLabel>Campaign Brief</SectionLabel>
                <p className="-mt-1 mb-2.5 text-sm text-white/40">
                  Optional but high-leverage. Direction, tone, proof asset, creative constraints —
                  the agents read this first.
                </p>
                <textarea
                  value={form.brief}
                  onChange={(e) => form.setBrief(e.target.value)}
                  placeholder={`e.g. "Targeting operators $1.5M–$3M still on the tools. Lead with Jason — 14 months, off tools, margin up. Want identity shift, not another hustle ad."`}
                  className="launch-input h-28 resize-none px-4 py-3.5 text-[15px] leading-relaxed"
                />
              </div>

              <div>
                <SectionLabel thinking={form.suggesting}>Campaign Angle</SectionLabel>
                <StrategicSelect field={form.angleField} />
                <AngleRecommendation field={form.angleField} />
              </div>

              <div>
                <SectionLabel>Creative Deliverables</SectionLabel>
                <p className="-mt-1 mb-3 text-sm text-white/40">
                  What should the reactor build? Copy is written into every concept.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {form.outputTypeList.map((o) => {
                    const on = form.outputs.includes(o)
                    const rec = form.recommendedDeliverables.includes(o)
                    const { Icon, blurb } = deliverableMeta(o)
                    return (
                      <button
                        key={o}
                        type="button"
                        onClick={() => form.toggleOutput(o)}
                        className={`pick-card p-4 text-left ${on ? 'is-on' : ''}`}
                      >
                        <div className="mb-3 flex items-start justify-between">
                          <span className="pick-ic">
                            <Icon size={20} />
                          </span>
                          <span className="pick-check">
                            <Check size={13} strokeWidth={3} />
                          </span>
                        </div>
                        <p className="font-display text-base font-semibold text-white">{o}</p>
                        <p className="mt-1 text-xs leading-relaxed text-white/45">{blurb}</p>
                        {rec && (
                          <span className="mt-2.5 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-[#FF9D4D]">
                            <Sparkles size={10} /> Recommended
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
                {form.deliverablesReason && form.recommendedDeliverables.length > 0 && (
                  <p className="mt-3 flex items-start gap-1.5 text-xs text-white/45">
                    <Sparkles size={12} className="mt-0.5 shrink-0 text-[#FF9D4D]" />
                    <span>{form.deliverablesReason}</span>
                  </p>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-fade-up space-y-6">
              <div>
                <SectionLabel thinking={form.suggesting}>Awareness Stage</SectionLabel>
                <StrategicSelect field={form.awarenessField} />
              </div>

              <div>
                <SectionLabel thinking={form.suggesting}>Audience Type</SectionLabel>
                <StrategicSelect field={form.audienceField} />
              </div>

              <div>
                <SectionLabel thinking={form.suggesting}>Offer Type</SectionLabel>
                <StrategicSelect field={form.offerField} />
              </div>

              <div>
                <SectionLabel>Offer Name</SectionLabel>
                <input
                  value={form.offerName}
                  onChange={(e) => form.setOfferName(e.target.value)}
                  placeholder={`e.g. "The Owner Freedom Roadmap"`}
                  className="launch-input px-4 py-3.5 text-[15px]"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-fade-up space-y-3">
              <SectionLabel>Meta Performance Feed</SectionLabel>
              <p className="-mt-1 text-sm text-white/40">
                Controls whether OPUS reads live Meta ad performance during this run. Unconfigured
                sources fall back automatically.
              </p>
              <div className="space-y-2.5 pt-1">
                {FEED_OPTIONS.map(({ id, Icon, title, tag, desc }) => {
                  const on = form.metaProvider === id
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => form.setMetaProvider(id)}
                      className={`pick-card flex w-full items-center gap-4 p-4 text-left ${on ? 'is-on' : ''}`}
                    >
                      <span className="pick-ic shrink-0">
                        <Icon size={20} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="font-display text-base font-semibold text-white">{title}</span>
                          <span className="rounded-full border border-white/12 bg-white/[0.04] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white/50">
                            {tag}
                          </span>
                        </span>
                        <span className="mt-1 block text-xs leading-relaxed text-white/45">{desc}</span>
                      </span>
                      <span className="pick-check shrink-0">
                        <Check size={13} strokeWidth={3} />
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="animate-fade-up space-y-4">
              <button
                type="button"
                onClick={() => form.setOnBrand(!form.onBrand)}
                className={`pick-card flex w-full items-start gap-4 p-5 text-left ${form.onBrand ? 'is-on' : ''}`}
              >
                <span className="pick-ic shrink-0">
                  <ShieldCheck size={20} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-lg font-semibold text-white">On Brand</p>
                  <p className="mt-1 text-sm leading-relaxed text-white/45">
                    Brand voice, tone, and compliance are pulled from Settings and applied across
                    every concept the reactor writes.
                  </p>
                </div>
                <span
                  className={`mt-1 flex h-7 w-12 shrink-0 items-center rounded-full p-0.5 transition-colors ${
                    form.onBrand ? 'bg-[#FF5E3A]' : 'bg-white/15'
                  }`}
                >
                  <span
                    className={`h-6 w-6 rounded-full bg-white shadow transition-transform ${
                      form.onBrand ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </span>
              </button>
              <p className="px-1 text-sm leading-relaxed text-white/40">
                {form.onBrand
                  ? 'The agent applies your brand voice, tone, and compliance rules throughout every concept.'
                  : 'Concepts will be generated without brand anchoring — the brief and inputs only.'}
              </p>
            </div>
          )}

          {step === 5 && (
            <div className="animate-fade-up space-y-5">
              <div className="space-y-2 rounded-2xl border border-white/10 bg-black/30 p-5">
                <SummaryRow label="Angle" value={fieldSummary(form.angleField)} />
                <SummaryRow label="Audience" value={fieldSummary(form.audienceField)} />
                <SummaryRow label="Awareness" value={fieldSummary(form.awarenessField)} />
                <SummaryRow label="Offer" value={fieldSummary(form.offerField)} />
                <SummaryRow label="CTA name" value={form.offerName.trim() || '—'} />
                <SummaryRow
                  label="Deliverables"
                  value={form.outputs.length ? form.outputs.join(' · ') : 'Reactor decides'}
                />
                <SummaryRow label="Perf. feed" value={feedTitle} />
                <SummaryRow label="On Brand" value={form.onBrand ? 'On' : 'Off'} />
                {form.brief.trim() && (
                  <div className="flex gap-3 border-t border-white/10 pt-2.5">
                    <span className="w-24 shrink-0 text-[11px] uppercase tracking-[0.08em] text-white/35">
                      Brief
                    </span>
                    <span className="line-clamp-2 text-white/70">{form.brief.trim()}</span>
                  </div>
                )}
              </div>

              <div>
                <button
                  type="button"
                  onClick={fire}
                  className="fire-btn flex w-full items-center justify-center gap-2 rounded-full px-4 py-4 font-display text-lg font-bold uppercase tracking-wide text-white"
                >
                  <Atom size={18} /> ⚡ Fire Reactor
                </button>
                <p className="mt-2.5 text-center text-[11px] uppercase tracking-[0.14em] text-white/35">
                  OPUS · Strategic synthesis · Self-critique scoring
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-white/10 px-7 py-4">
          {step > 1 ? (
            <button type="button" onClick={() => setStep((s) => s - 1)} className="launch-nav">
              <ChevronLeft size={16} /> Back
            </button>
          ) : (
            <span />
          )}

          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/30">
            Step {step} of 5
          </span>

          {step < 5 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              className="launch-nav launch-nav--primary"
            >
              Next <ChevronRight size={16} />
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
    <div className="flex gap-3 text-sm">
      <span className="w-24 shrink-0 text-[11px] uppercase tracking-[0.08em] text-white/35">
        {label}
      </span>
      <span className="text-white/85">{value}</span>
    </div>
  )
}
