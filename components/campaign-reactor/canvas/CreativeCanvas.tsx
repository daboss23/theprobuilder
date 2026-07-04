'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Atom,
  Check,
  Copy as CopyIcon,
  ImageIcon,
  Layers,
  RotateCcw,
  Sparkles,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { accentClass } from '@/components/reactor/ui'
import { useReactorRun } from '@/components/campaign-reactor/ReactorRunContext'
import { AdPreviewCard } from './AdPreviewCard'
import {
  autoComposition,
  blocksInCategory,
  buildBlocks,
  CATEGORY_DEFS,
  CATEGORY_ORDER,
  composeAd,
  composedToText,
  themeById,
  type BlockCategory,
  type CanvasBlock,
  type Composition,
} from '@/lib/campaign-reactor/canvas'

/* -------------------------------------------------------------------------- */
/*  A single swappable option in the remix rail                               */
/* -------------------------------------------------------------------------- */

function RemixRow({
  block,
  selected,
  recommended,
  onSelect,
}: {
  block: CanvasBlock
  selected: boolean
  recommended: boolean
  onSelect: (cat: BlockCategory, id: string) => void
}) {
  const theme = block.themeId ? themeById(block.themeId) : null
  const isVisual = block.category === 'visual'

  return (
    <button
      type="button"
      onClick={() => onSelect(block.category, block.id)}
      aria-pressed={selected}
      className={cn(
        'flex w-full items-start gap-2.5 rounded-lg border p-2.5 text-left transition-colors',
        selected
          ? 'border-[rgb(var(--acc)/0.55)] bg-[rgb(var(--acc)/0.10)]'
          : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]',
      )}
    >
      {/* Leading thumbnail — theme swatch, visual still, or nothing for copy */}
      {theme ? (
        <span className={cn('mt-0.5 h-9 w-9 shrink-0 rounded-md bg-gradient-to-br', theme.swatchFrom, theme.swatchTo)} />
      ) : isVisual ? (
        block.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={block.imageUrl} alt={block.label} className="mt-0.5 h-9 w-9 shrink-0 rounded-md object-cover" />
        ) : (
          <span className="acc-text mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-md bg-white/[0.04]">
            <ImageIcon size={14} />
          </span>
        )
      ) : null}

      <span className="min-w-0 flex-1">
        {(recommended || typeof block.score === 'number') && (
          <span className="mb-0.5 flex items-center gap-1.5">
            {recommended && (
              <span className="acc-text-hi inline-flex items-center gap-0.5 rounded-full bg-[rgb(var(--acc)/0.14)] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide">
                <Sparkles size={9} /> Opus pick
              </span>
            )}
            {typeof block.score === 'number' && (
              <span className="rounded-full border border-white/10 px-1.5 text-[9px] font-medium text-white/50">
                {block.score}/10
              </span>
            )}
          </span>
        )}
        <span
          className={cn(
            'block line-clamp-2 text-[12px] leading-snug',
            selected ? 'text-white' : 'text-white/75',
          )}
        >
          {theme ? theme.label : block.text}
        </span>
        {block.basis && (
          <span className="mt-0.5 block line-clamp-1 text-[10px] text-white/35">
            <span className="acc-text">Grounded in</span> · {block.basis}
          </span>
        )}
      </span>

      {selected && <Check size={14} className="acc-text mt-0.5 shrink-0" />}
    </button>
  )
}

/* -------------------------------------------------------------------------- */
/*  One lane of the remix rail                                                */
/* -------------------------------------------------------------------------- */

function RemixSection({
  category,
  blocks,
  selectedId,
  recommendedId,
  onSelect,
  onClear,
}: {
  category: BlockCategory
  blocks: CanvasBlock[]
  selectedId: string | null
  recommendedId: string | null
  onSelect: (cat: BlockCategory, id: string) => void
  onClear: (cat: BlockCategory) => void
}) {
  const def = CATEGORY_DEFS[category]
  const options = blocksInCategory(blocks, category)
  if (!options.length) return null

  return (
    <div className={cn('space-y-1.5', accentClass[def.accent])}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[rgb(var(--acc))]" />
          <span className="acc-text-hi text-[11px] font-bold uppercase tracking-wider">{def.label}</span>
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-1.5 text-[10px] font-medium text-white/45">
            {options.length}
          </span>
        </div>
        {selectedId && (
          <button
            type="button"
            onClick={() => onClear(category)}
            className="inline-flex items-center gap-1 text-[10px] font-medium text-white/30 transition-colors hover:text-danger"
          >
            <X size={11} /> clear
          </button>
        )}
      </div>
      <div className="grid gap-1.5">
        {options.map((b) => (
          <RemixRow
            key={b.id}
            block={b}
            selected={selectedId === b.id}
            recommended={recommendedId === b.id}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  The Creative Canvas — finished brief on the left, remix rail on the right */
/* -------------------------------------------------------------------------- */

export function CreativeCanvas({
  offerName,
  onConfigure,
}: {
  offerName?: string
  onConfigure: () => void
}) {
  const { concepts, generateCreative, imageFor, creativeStateFor } = useReactorRun()

  const blocks = useMemo(() => buildBlocks(concepts, offerName), [concepts, offerName])
  // OPUS's recommendation: the best-scoring part in every lane. Drives the badges
  // and the "reset" target so the user always has the finished brief to return to.
  const recommended = useMemo(() => autoComposition(blocks), [blocks])

  const [composition, setComposition] = useState<Composition>(recommended)
  const [copied, setCopied] = useState(false)

  // A new run lands → snap back to OPUS's freshly-recommended brief.
  useEffect(() => {
    setComposition(autoComposition(blocks))
  }, [blocks])

  const select = useCallback(
    (cat: BlockCategory, id: string) => setComposition((c) => ({ ...c, [cat]: id })),
    [],
  )
  const clear = useCallback((cat: BlockCategory) => setComposition((c) => ({ ...c, [cat]: null })), [])
  const reset = useCallback(() => setComposition(autoComposition(blocks)), [blocks])

  const ad = useMemo(() => composeAd(blocks, composition), [blocks, composition])

  /* ------------------------- Live visual rendering ------------------------- */
  const visualConcept = ad.visual?.concept
  const previewImage = visualConcept ? imageFor(visualConcept) : ad.visual?.imageUrl
  const creativeState = visualConcept ? creativeStateFor(visualConcept) : undefined
  const isVideo = visualConcept ? /video|testimonial/i.test(visualConcept.type) : false
  const canGenerate = Boolean(visualConcept) && !isVideo && !previewImage
  const onGenerateImage = useCallback(() => {
    if (visualConcept) generateCreative(visualConcept, {})
  }, [visualConcept, generateCreative])

  const copy = useCallback(() => {
    navigator.clipboard?.writeText(composedToText(ad))
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }, [ad])

  // Has the user deviated from OPUS's recommended brief?
  const isRemixed = useMemo(
    () => CATEGORY_ORDER.some((cat) => composition[cat] !== recommended[cat]),
    [composition, recommended],
  )

  // Brief strength — the average rubric score of the scored parts in play.
  const strength = useMemo(() => {
    const scored = CATEGORY_ORDER.map((cat) => blocks.find((b) => b.id === composition[cat])).filter(
      (b): b is CanvasBlock => Boolean(b) && typeof b!.score === 'number',
    )
    if (!scored.length) return null
    return Math.round((scored.reduce((s, b) => s + (b.score ?? 0), 0) / scored.length) * 10) / 10
  }, [blocks, composition])

  /* --------------------------------- Empty --------------------------------- */
  if (concepts.length === 0) {
    return (
      <div className="reactor-panel glass grid min-h-[460px] place-items-center p-8 text-center">
        <div className="max-w-sm">
          <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-white/[0.03]">
            <Sparkles size={26} className="text-glow/60" />
          </span>
          <h3 className="font-display text-base font-semibold text-white">The canvas is empty</h3>
          <p className="mx-auto mt-1.5 text-sm text-white/45">
            Fire the reactor first. OPUS assembles a finished ad from everything it generates — then you
            can swap any part from a clean menu and watch the ad update live.
          </p>
          <button
            type="button"
            onClick={onConfigure}
            className="fire-btn mt-5 inline-flex items-center gap-2 rounded-full px-5 py-3 font-display text-sm font-bold uppercase tracking-wide text-white"
          >
            <Atom size={15} /> New Creative Campaign
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="reactor-panel glass overflow-hidden p-0">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-glow/70">Creative Canvas</span>
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold',
              isRemixed
                ? 'border-warning/30 bg-warning/[0.08] text-warning'
                : 'border-glow/30 bg-glow/10 text-glow',
            )}
          >
            {isRemixed ? <Layers size={11} /> : <Sparkles size={11} />}
            {isRemixed ? 'Remixed' : "OPUS's recommended brief"}
          </span>
          {strength !== null && (
            <span className="hidden items-center gap-1 text-[11px] text-white/45 sm:inline-flex">
              Strength <span className="font-semibold text-white/70">{strength}/10</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={reset}
            disabled={!isRemixed}
            title="Reset to OPUS's recommended brief"
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/12 bg-white/[0.04] px-3 py-1.5 text-[11px] font-medium text-white/60 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            <RotateCcw size={12} /> Reset
          </button>
          <button
            type="button"
            onClick={copy}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-glow/30 bg-glow/10 px-3 py-1.5 text-[11px] font-semibold text-glow transition-colors hover:bg-glow/20"
          >
            {copied ? <Check size={12} /> : <CopyIcon size={12} />}
            {copied ? 'Copied' : 'Copy ad copy'}
          </button>
        </div>
      </div>

      {/* Studio — finished ad (left) + remix rail (right) */}
      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        {/* The finished, recommended ad */}
        <section className="border-b border-border p-5 lg:border-b-0 lg:border-r">
          <div className="mx-auto max-w-[400px]">
            <p className="mb-3 flex items-center gap-1.5 text-[12px] text-white/45">
              <Atom size={13} className="text-glow" />
              {isRemixed
                ? 'Your remix — built on OPUS’s recommended parts.'
                : 'OPUS assembled this from the highest-scoring parts of your run.'}
            </p>
            <AdPreviewCard
              ad={ad}
              image={previewImage}
              imageBusy={creativeState?.status === 'working'}
              imageError={creativeState?.status === 'error' ? creativeState.message : undefined}
              canGenerate={canGenerate}
              onGenerateImage={onGenerateImage}
            />
          </div>
        </section>

        {/* Remix rail */}
        <section className="flex min-h-0 flex-col p-4">
          <div className="mb-3 flex items-center gap-2">
            <Layers size={14} className="text-white/40" />
            <span className="font-display text-sm font-semibold text-white">Remix</span>
            <span className="text-[11px] text-white/40">— tap any option to swap it into the ad</span>
          </div>
          <div className="grid max-h-[58vh] gap-4 overflow-y-auto pr-1">
            {CATEGORY_ORDER.map((cat) => (
              <RemixSection
                key={cat}
                category={cat}
                blocks={blocks}
                selectedId={composition[cat]}
                recommendedId={recommended[cat]}
                onSelect={select}
                onClear={clear}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
