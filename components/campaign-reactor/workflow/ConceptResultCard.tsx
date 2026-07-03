'use client'

import { useState } from 'react'
import {
  Activity,
  AlertTriangle,
  Check,
  Copy as CopyIcon,
  Film,
  Hexagon,
  ImageIcon,
  Loader2,
  Megaphone,
  Trophy,
  Users,
} from 'lucide-react'
import { Pill } from '@/components/reactor/ui'
import { NEURO_AXES, NEURO_PASS_MARK, type NeuroScore } from '@/lib/reactor-inputs'
import {
  DESCRIPTION_MAX,
  HEADLINE_MAX,
  PRIMARY_TEXT_FOLD,
  ctaLabel,
  formatForAdsManager,
  validateAdPackage,
  type MetaAdPackage,
} from '@/lib/meta-ads'
import type {
  Concept,
  CreativeState,
  MediaMeta,
  VideoUiState,
} from '@/components/campaign-reactor/ReactorRunContext'
import type { Verdict } from '@/lib/outcomes'

// Non-destructive provider/model chip overlaid on a generated still or clip.
// The asset pixels are never touched, so the downloadable creative stays clean.
function ProviderChip({ model, provider }: { model?: string; provider?: string }) {
  if (!model && !provider) return null
  return (
    <span className="absolute right-2 top-2 z-10 inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white/85 backdrop-blur-sm">
      <Hexagon size={9} className="text-glow" />
      {provider && <span className="uppercase tracking-wide text-white/60">{provider}</span>}
      {model && (
        <>
          {provider && <span className="text-white/25">·</span>}
          <span>{model}</span>
        </>
      )}
    </span>
  )
}

// One axis of the NEURO predicted-response pre-test, drawn as a 10-segment bar
// (pure Tailwind — no inline widths). Colour bands the score: emerald = strong,
// glow = solid, warning = below the pass mark.
function NeuroBar({ label, value }: { label: string; value: number }) {
  const tone = value >= 8 ? 'bg-success' : value >= NEURO_PASS_MARK ? 'bg-glow' : 'bg-warning'
  return (
    <div className="flex items-center gap-2">
      <span className="w-[4.5rem] shrink-0 text-[10px] uppercase tracking-wide text-white/45">{label}</span>
      <div className="flex flex-1 gap-0.5" aria-hidden>
        {Array.from({ length: 10 }).map((_, i) => (
          <span key={i} className={`h-1.5 flex-1 rounded-sm ${i < value ? tone : 'bg-white/10'}`} />
        ))}
      </div>
      <span className="w-7 shrink-0 text-right text-[10px] font-medium text-white/70">{value}</span>
    </div>
  )
}

// The NEURO predicted-response pre-test block. A TRIBE-inspired estimate of how
// the brain is likely to react to the concept — clearly labelled as a prediction,
// never measured brain data.
function NeuroPanel({ neuro }: { neuro: NeuroScore }) {
  return (
    <div className="mt-2.5 rounded-lg border border-glow/15 bg-glow/[0.04] p-2.5">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-glow/80">
          <Activity size={11} /> Predicted Response
        </span>
        <Pill tone={neuro.overall >= 8 ? 'success' : neuro.overall >= NEURO_PASS_MARK ? 'primary' : 'warning'}>
          {neuro.overall}/10
        </Pill>
      </div>
      <div className="space-y-1">
        {NEURO_AXES.map(({ key, label }) => (
          <NeuroBar key={key} label={label} value={neuro[key]} />
        ))}
      </div>
      {neuro.reason && (
        <p className="mt-2 text-[11px] text-white/55">
          {neuro.reason}
          {neuro.principle && <span className="text-white/30"> · {neuro.principle}</span>}
        </p>
      )}
      <p className="mt-1 text-[10px] italic text-white/30">
        Estimate from neuromarketing principles — a prediction, not measured brain data.
      </p>
    </div>
  )
}

// One labelled field of the Meta ad unit with a live character count that
// warns when Meta would truncate it.
function AdField({ label, value, max }: { label: string; value: string; max: number }) {
  const over = value.length > max
  return (
    <div className="flex items-baseline gap-2">
      <span className="w-[4.5rem] shrink-0 text-[10px] uppercase tracking-wide text-white/45">{label}</span>
      <span className="min-w-0 flex-1 text-[12px] text-white/80">{value}</span>
      <span className={`shrink-0 text-[10px] tabular ${over ? 'font-semibold text-warning' : 'text-white/30'}`}>
        {value.length}/{max}
      </span>
    </div>
  )
}

/**
 * The launch-ready Meta ad unit for a concept: primary text with the mobile
 * "See more" fold made visible at 125 chars, headline/description with live
 * char counts against Meta's limits, the CTA button, compliance issues from
 * the shared validator, and a paste-ready copy for Ads Manager.
 */
function MetaAdUnit({ conceptType, pkg }: { conceptType: string; pkg: MetaAdPackage }) {
  const [copied, setCopied] = useState(false)
  const issues = validateAdPackage(pkg)
  const primary = pkg.primaryText ?? ''
  const above = primary.slice(0, PRIMARY_TEXT_FOLD)
  const below = primary.slice(PRIMARY_TEXT_FOLD)

  const copyForAdsManager = async () => {
    try {
      await navigator.clipboard.writeText(formatForAdsManager(conceptType, pkg))
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      /* clipboard unavailable — leave the button as-is */
    }
  }

  return (
    <div className="mt-2.5 rounded-lg border border-success/15 bg-success/[0.03] p-2.5">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-success/80">
          <Megaphone size={11} /> Meta Ad Unit
        </span>
        <button
          type="button"
          onClick={copyForAdsManager}
          className="flex items-center gap-1 text-[11px] text-white/40 hover:text-success"
        >
          {copied ? <Check size={12} /> : <CopyIcon size={12} />}
          {copied ? 'Copied' : 'Copy for Ads Manager'}
        </button>
      </div>

      <p className="whitespace-pre-line text-[12px] leading-relaxed">
        <span className="text-white/85">{above}</span>
        {below && (
          <>
            <span
              className="mx-1 rounded border border-white/15 bg-white/[0.05] px-1 py-px align-middle text-[9px] font-medium uppercase tracking-wide text-white/40"
              title={`Meta shows the first ${PRIMARY_TEXT_FOLD} characters before the "See more" fold on mobile`}
            >
              …See more
            </span>
            <span className="text-white/40">{below}</span>
          </>
        )}
      </p>

      <div className="mt-2 space-y-1 border-t border-white/[0.06] pt-2">
        <AdField label="Headline" value={pkg.headline ?? ''} max={HEADLINE_MAX} />
        {pkg.description && <AdField label="Descrip." value={pkg.description} max={DESCRIPTION_MAX} />}
        <div className="flex items-center gap-2">
          <span className="w-[4.5rem] shrink-0 text-[10px] uppercase tracking-wide text-white/45">CTA</span>
          <span className="inline-flex rounded-md border border-white/15 bg-white/[0.06] px-2 py-0.5 text-[11px] font-semibold text-white/85">
            {ctaLabel(pkg)}
          </span>
        </div>
      </div>

      {issues.length > 0 && (
        <ul className="mt-2 space-y-1 border-t border-white/[0.06] pt-2">
          {issues.map((issue, ii) => (
            <li
              key={ii}
              className={`flex items-start gap-1.5 text-[11px] ${
                issue.severity === 'error' ? 'text-danger' : 'text-warning'
              }`}
            >
              <AlertTriangle size={11} className="mt-0.5 shrink-0" />
              {issue.message}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/**
 * A single generated concept — text, production brief, evidence, and any
 * generated still/clip — with the full production action set (Generate Image /
 * Video, Animate, UGC, Log outcome, Copy). Lifted verbatim from the Workbench so
 * every existing capability is preserved; the live workflow now renders these.
 */
export function ConceptResultCard({
  concept: c,
  index: i,
  image,
  imageMeta,
  video,
  creativeState,
  wantsVideo,
  hasRefs,
  faceCount,
  refVideoCount,
  copied,
  logged,
  verdictOptions,
  onCopy,
  onGenerateCreative,
  onAnimate,
  onGenerateUGC,
  onMarkOutcome,
}: {
  concept: Concept
  index: number
  image?: string
  imageMeta?: MediaMeta
  video?: VideoUiState
  creativeState?: CreativeState
  wantsVideo: boolean
  hasRefs: boolean
  faceCount: number
  refVideoCount: number
  copied: boolean
  logged: boolean
  verdictOptions: { value: Verdict; label: string }[]
  onCopy: () => void
  onGenerateCreative: () => void
  onAnimate: (image: string) => void
  onGenerateUGC: () => void
  onMarkOutcome: (verdict: Verdict) => void
}) {
  const creativeBusy = creativeState?.status === 'working' || video?.status === 'rendering'

  return (
    <div
      className={`glass-hover animate-fade-up stagger-${(i % 8) + 1} rounded-xl border border-border bg-surface/40 p-4`}
    >
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Pill tone="primary">{c.type}</Pill>
          {typeof c.score === 'number' && (
            <Pill tone={c.score >= 8 ? 'success' : 'warning'}>{c.score}/10</Pill>
          )}
        </div>
        <div className="flex items-center gap-3">
          {c.type.includes('Concept') && (
            <button
              type="button"
              onClick={onGenerateCreative}
              disabled={creativeBusy}
              className="flex items-center gap-1 text-[11px] text-white/40 hover:text-cyan disabled:opacity-60"
            >
              {creativeBusy ? (
                <Loader2 size={12} className="animate-spin" />
              ) : wantsVideo ? (
                <Film size={12} />
              ) : (
                <ImageIcon size={12} />
              )}
              {wantsVideo ? 'Generate Video Creative' : 'Generate Image Creative'}
            </button>
          )}
          {wantsVideo && hasRefs && (
            <button
              type="button"
              onClick={onGenerateUGC}
              disabled={creativeBusy}
              className="flex items-center gap-1 text-[11px] text-white/40 hover:text-cyan disabled:opacity-60"
              title={`Generate with ${faceCount} reference image${faceCount === 1 ? '' : 's'}${refVideoCount ? ` + ${refVideoCount} video${refVideoCount === 1 ? '' : 's'}` : ''} (Seedance 2.0 reference-to-video)`}
            >
              <Users size={12} />
              Generate UGC
            </button>
          )}
          {image && !video && (
            <button
              type="button"
              onClick={() => onAnimate(image)}
              className="flex items-center gap-1 text-[11px] text-white/40 hover:text-cyan"
            >
              <Film size={12} />
              Animate
            </button>
          )}
          {logged ? (
            <span className="flex items-center gap-1 text-[11px] text-success">
              <Trophy size={12} /> Logged
            </span>
          ) : (
            <select
              defaultValue=""
              title="Log performance outcome"
              onChange={(e) => {
                const v = e.target.value as Verdict
                if (v) onMarkOutcome(v)
              }}
              className="rounded-md border border-border bg-surface/60 px-1.5 py-1 text-[11px] text-white/50 outline-none hover:text-white focus:border-success/50"
            >
              <option value="" className="bg-card">
                Log outcome…
              </option>
              {verdictOptions.map((o) => (
                <option key={o.value} value={o.value} className="bg-card">
                  {o.label}
                </option>
              ))}
            </select>
          )}
          <button
            type="button"
            onClick={onCopy}
            className="flex items-center gap-1 text-[11px] text-white/40 hover:text-glow"
          >
            {copied ? <Check size={12} /> : <CopyIcon size={12} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>
      <p className="text-sm text-white/80">{c.text}</p>

      {c.adPackage && <MetaAdUnit conceptType={c.type} pkg={c.adPackage} />}

      {c.productionBrief && c.productionBrief.frames?.length > 0 && (
        <div className="mt-2.5 rounded-lg border border-primary/15 bg-primary/[0.04] p-2.5">
          <div className="mb-1.5 flex flex-wrap items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-glow/80">
            <Film size={11} /> Production Brief
            {c.productionBrief.pattern && (
              <span className="font-normal text-white/30">· {c.productionBrief.pattern}</span>
            )}
          </div>
          <ol className="space-y-1">
            {c.productionBrief.frames.map((f, fi) => (
              <li key={fi} className="flex gap-2 text-[11px] text-white/60">
                <span className="shrink-0 font-mono text-glow/60">{f.label}</span>
                <span>{f.description}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {(c.basis || c.learningCheck) && (
        <div className="mt-2 space-y-1 border-t border-border pt-2 text-[11px] text-white/40">
          {c.basis && (
            <p>
              <span className="text-glow/70">Grounded in:</span> {c.basis}
            </p>
          )}
          {c.learningCheck && (
            <p>
              <span className="text-success/70">Rubric:</span> {c.learningCheck}
            </p>
          )}
        </div>
      )}

      {c.neuro && <NeuroPanel neuro={c.neuro} />}

      {/* Generated still creative (agent or manual) — provider chip overlaid on
          the card only; the image file stays untouched. */}
      {image && (
        <div className="relative mt-3">
          <ProviderChip model={imageMeta?.model} provider={imageMeta?.provider} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt={c.type} className="w-full rounded-lg border border-border" />
        </div>
      )}

      {/* Generated video — provider chip overlaid on the player only. */}
      {video?.status === 'done' && video.url && (
        <div className="relative mt-3">
          <ProviderChip model={video.model} provider={video.provider} />
          <video src={video.url} controls playsInline className="w-full rounded-lg border border-border" />
        </div>
      )}
      {video?.status === 'rendering' && (
        <div className="mt-3 grid aspect-video w-full place-items-center rounded-lg border border-border bg-background/40">
          <span className="flex items-center gap-2 text-xs text-cyan">
            <Loader2 size={14} className="animate-spin" /> Rendering video…
          </span>
        </div>
      )}
      {video?.status === 'error' && (
        <p className="mt-3 rounded-lg border border-warning/30 bg-warning/[0.06] p-2 text-[11px] text-warning">
          {video.message || 'Video render failed — check FAL_KEY / HF_CREDENTIALS or try again.'}
        </p>
      )}

      {/* Creative render status (in-flight / error) */}
      {creativeState?.status === 'working' && (
        <div className="mt-3 grid aspect-square w-full place-items-center rounded-lg border border-border bg-background/40">
          <span className="flex items-center gap-2 text-xs text-cyan">
            <Loader2 size={14} className="animate-spin" /> Rendering creative…
          </span>
        </div>
      )}
      {creativeState?.status === 'error' && (
        <p className="mt-3 rounded-lg border border-warning/30 bg-warning/[0.06] p-2 text-[11px] text-warning">
          {creativeState.message}
        </p>
      )}
    </div>
  )
}
