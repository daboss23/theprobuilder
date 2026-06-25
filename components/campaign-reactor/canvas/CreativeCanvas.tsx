'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useReducedMotion } from 'motion/react'
import {
  Atom,
  Check,
  Copy as CopyIcon,
  GripVertical,
  Hand,
  Maximize2,
  Minus,
  Plus,
  RotateCcw,
  Sparkles,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { accentClass } from '@/components/reactor/ui'
import { useReactorRun } from '@/components/campaign-reactor/ReactorRunContext'
import { AgentConnectionPath, type Point } from '../workflow/AgentConnectionPath'
import { AdPreviewCard } from './AdPreviewCard'
import {
  autoComposition,
  blocksInCategory,
  buildBlocks,
  CATEGORY_DEFS,
  CATEGORY_ORDER,
  CATEGORY_STROKE,
  COL_W,
  COMP_W,
  composeAd,
  composedToText,
  EST_ROW_H,
  initialLayout,
  NODE_W,
  themeById,
  type BlockCategory,
  type CanvasBlock,
  type Composition,
  type Pt,
} from '@/lib/campaign-reactor/canvas'

const MIN_SCALE = 0.4
const MAX_SCALE = 1.6
const COMP_FALLBACK_H = 540

interface ViewState {
  tx: number
  ty: number
  scale: number
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

/* -------------------------------------------------------------------------- */
/*  Fit-to-content                                                            */
/* -------------------------------------------------------------------------- */

function sizeFallback(id: string): { w: number; h: number } {
  return id === 'composition' ? { w: COMP_W, h: COMP_FALLBACK_H } : { w: NODE_W, h: EST_ROW_H }
}

function computeFit(
  pos: Record<string, Pt>,
  sizes: Record<string, { w: number; h: number }>,
  rect: { width: number; height: number },
): ViewState {
  const ids = Object.keys(pos)
  if (!ids.length || rect.width === 0) return { tx: 24, ty: 16, scale: 0.8 }
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const id of ids) {
    const p = pos[id]
    const s = sizes[id] ?? sizeFallback(id)
    minX = Math.min(minX, p.x)
    minY = Math.min(minY, p.y)
    maxX = Math.max(maxX, p.x + s.w)
    maxY = Math.max(maxY, p.y + s.h)
  }
  const pad = 56
  const scale = clamp(
    Math.min(rect.width / (maxX - minX + pad * 2), rect.height / (maxY - minY + pad * 2)),
    MIN_SCALE,
    1,
  )
  return {
    scale,
    tx: (rect.width - (minX + maxX) * scale) / 2,
    ty: (rect.height - (minY + maxY) * scale) / 2,
  }
}

/* -------------------------------------------------------------------------- */
/*  A draggable building block                                                */
/* -------------------------------------------------------------------------- */

interface BlockNodeProps {
  block: CanvasBlock
  pos: Pt
  selected: boolean
  scale: number
  onMeasure: (id: string, w: number, h: number) => void
  onMove: (id: string, dxWorld: number, dyWorld: number) => void
  onSelect: (block: CanvasBlock) => void
}

function BlockNode({ block, pos, selected, scale, onMeasure, onMove, onSelect }: BlockNodeProps) {
  const def = CATEGORY_DEFS[block.category]
  const ref = useRef<HTMLButtonElement>(null)
  const drag = useRef<{ x: number; y: number; moved: boolean } | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const report = () => onMeasure(block.id, el.offsetWidth, el.offsetHeight)
    report()
    const ro = new ResizeObserver(report)
    ro.observe(el)
    return () => ro.disconnect()
  }, [block.id, onMeasure])

  const onPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation()
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    drag.current = { x: e.clientX, y: e.clientY, moved: false }
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return
    const dx = e.clientX - drag.current.x
    const dy = e.clientY - drag.current.y
    if (!drag.current.moved && Math.abs(dx) < 4 && Math.abs(dy) < 4) return
    drag.current.moved = true
    drag.current.x = e.clientX
    drag.current.y = e.clientY
    onMove(block.id, dx / scale, dy / scale)
  }
  const onPointerUp = () => {
    const moved = drag.current?.moved
    drag.current = null
    if (!moved) onSelect(block)
  }

  const theme = block.themeId ? themeById(block.themeId) : null

  return (
    <button
      ref={ref}
      type="button"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={{ transform: `translate3d(${pos.x}px, ${pos.y}px, 0)` }}
      className={cn(
        'canvas-node absolute left-0 top-0 w-[236px] cursor-grab touch-none select-none rounded-xl p-2.5 text-left active:cursor-grabbing',
        accentClass[def.accent],
        selected && 'is-selected',
      )}
      aria-pressed={selected}
    >
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="acc-text-hi truncate text-[10px] font-semibold uppercase tracking-wider">
          {block.label}
        </span>
        {typeof block.score === 'number' && (
          <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-1.5 text-[10px] font-medium text-white/60">
            {block.score}/10
          </span>
        )}
        {selected && <Check size={12} className="acc-text shrink-0" />}
      </div>

      {theme ? (
        <div className="flex items-center gap-2">
          <span className={cn('h-7 w-10 shrink-0 rounded-md bg-gradient-to-br', theme.swatchFrom, theme.swatchTo)} />
          <span className="text-[12px] font-medium text-white/85">{theme.label}</span>
        </div>
      ) : block.category === 'visual' ? (
        <div className="space-y-1.5">
          {block.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={block.imageUrl} alt={block.label} className="h-16 w-full rounded-md object-cover" />
          )}
          <p className="line-clamp-3 text-[11px] leading-snug text-white/70">{block.text}</p>
        </div>
      ) : (
        <p className="line-clamp-3 text-[12px] leading-snug text-white/80">{block.text}</p>
      )}

      {block.basis && (
        <p className="mt-1.5 line-clamp-1 text-[10px] text-white/35">
          <span className="acc-text">Grounded in</span> · {block.basis}
        </p>
      )}
    </button>
  )
}

/* -------------------------------------------------------------------------- */
/*  The composition node — drag handle + live preview + slot controls         */
/* -------------------------------------------------------------------------- */

interface CompositionNodeProps {
  pos: Pt
  scale: number
  blocks: CanvasBlock[]
  composition: Composition
  copied: boolean
  image?: string
  imageBusy?: boolean
  imageError?: string
  canGenerate?: boolean
  onGenerateImage?: () => void
  onMeasure: (id: string, w: number, h: number) => void
  onMove: (id: string, dxWorld: number, dyWorld: number) => void
  onClear: (cat: BlockCategory) => void
  onCopy: () => void
  onReset: () => void
}

function CompositionNode({
  pos,
  scale,
  blocks,
  composition,
  copied,
  image,
  imageBusy,
  imageError,
  canGenerate,
  onGenerateImage,
  onMeasure,
  onMove,
  onClear,
  onCopy,
  onReset,
}: CompositionNodeProps) {
  const ref = useRef<HTMLDivElement>(null)
  const drag = useRef<{ x: number; y: number } | null>(null)
  const ad = useMemo(() => composeAd(blocks, composition), [blocks, composition])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const report = () => onMeasure('composition', el.offsetWidth, el.offsetHeight)
    report()
    const ro = new ResizeObserver(report)
    ro.observe(el)
    return () => ro.disconnect()
  }, [onMeasure])

  const onPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation()
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    drag.current = { x: e.clientX, y: e.clientY }
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return
    const dx = e.clientX - drag.current.x
    const dy = e.clientY - drag.current.y
    drag.current.x = e.clientX
    drag.current.y = e.clientY
    onMove('composition', dx / scale, dy / scale)
  }
  const onPointerUp = () => {
    drag.current = null
  }

  const labelFor = (cat: BlockCategory) => blocks.find((b) => b.id === composition[cat])

  return (
    <div
      ref={ref}
      style={{ transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`, width: COMP_W }}
      className="reactor-panel glass absolute left-0 top-0 select-none p-3"
    >
      {/* Drag handle */}
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        className="mb-2.5 flex cursor-grab touch-none items-center justify-between gap-2 active:cursor-grabbing"
      >
        <span className="flex items-center gap-1.5 font-display text-xs font-bold uppercase tracking-[0.16em] text-white">
          <Atom size={13} className="text-glow" /> Live Ad Composition
        </span>
        <GripVertical size={14} className="text-white/30" />
      </div>

      <AdPreviewCard
        ad={ad}
        image={image}
        imageBusy={imageBusy}
        imageError={imageError}
        canGenerate={canGenerate}
        onGenerateImage={onGenerateImage}
      />

      {/* Selected parts — click an X to free a slot */}
      <div className="mt-3 space-y-1">
        {CATEGORY_ORDER.map((cat) => {
          const sel = labelFor(cat)
          const def = CATEGORY_DEFS[cat]
          return (
            <div key={cat} className={cn('flex items-center gap-2 text-[11px]', accentClass[def.accent])}>
              <span className="acc-text w-[4.5rem] shrink-0 font-semibold uppercase tracking-wide">
                {def.label.replace(' Copy', '').replace('Calls to Action', 'CTA').replace('Colour Themes', 'Theme')}
              </span>
              <span className="min-w-0 flex-1 truncate text-white/65">
                {sel ? (sel.themeId ? themeById(sel.themeId).label : sel.text) : <span className="text-white/25">— empty —</span>}
              </span>
              {sel && (
                <button
                  type="button"
                  onClick={() => onClear(cat)}
                  aria-label={`Clear ${def.label}`}
                  className="shrink-0 cursor-pointer rounded text-white/30 transition-colors hover:text-danger"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Actions */}
      <div className="mt-3 flex items-center gap-2 border-t border-border pt-2.5">
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-glow/30 bg-glow/10 px-3 py-1.5 text-[11px] font-semibold text-glow transition-colors hover:bg-glow/20"
        >
          {copied ? <Check size={12} /> : <CopyIcon size={12} />}
          {copied ? 'Copied' : 'Copy ad copy'}
        </button>
        <button
          type="button"
          onClick={onReset}
          aria-label="Reset to the best-scoring parts"
          title="Reset to the best-scoring parts"
          className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-white/12 bg-white/[0.04] px-3 py-1.5 text-[11px] font-medium text-white/60 transition-colors hover:text-white"
        >
          <RotateCcw size={12} /> Reset
        </button>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Lane header (world-space)                                                 */
/* -------------------------------------------------------------------------- */

function LaneHeader({ category, count }: { category: BlockCategory; count: number }) {
  const def = CATEGORY_DEFS[category]
  const col = CATEGORY_ORDER.indexOf(category)
  return (
    <div
      style={{ transform: `translate3d(${24 + col * COL_W}px, 24px, 0)` }}
      className={cn('absolute left-0 top-0 w-[236px] select-none', accentClass[def.accent])}
    >
      <div className="flex items-center gap-2">
        <span className="acc-text text-[11px] font-bold uppercase tracking-[0.18em]">{def.label}</span>
        <span className="rounded-full border border-white/10 bg-white/[0.04] px-1.5 text-[10px] font-medium text-white/50">
          {count}
        </span>
      </div>
      <p className="text-[10px] text-white/30">{def.hint}</p>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  The canvas                                                                */
/* -------------------------------------------------------------------------- */

export function CreativeCanvas({
  offerName,
  onConfigure,
}: {
  offerName?: string
  onConfigure: () => void
}) {
  const { concepts, generateCreative, imageFor, creativeStateFor } = useReactorRun()
  const prefersReduced = useReducedMotion()
  const reduced = prefersReduced ?? false

  const blocks = useMemo(() => buildBlocks(concepts, offerName), [concepts, offerName])
  const contentBlocks = useMemo(() => concepts.length, [concepts])

  const viewportRef = useRef<HTMLDivElement>(null)
  const [positions, setPositions] = useState<Record<string, Pt>>({})
  const [sizes, setSizes] = useState<Record<string, { w: number; h: number }>>({})
  const [composition, setComposition] = useState<Composition>(() => autoComposition(blocks))
  const [view, setView] = useState<ViewState>({ tx: 24, ty: 16, scale: 0.8 })
  const [panning, setPanning] = useState(false)
  const [copied, setCopied] = useState(false)

  // Reseed the board whenever a new run lands (blocks identity changes): lay the
  // nodes out, auto-pick the best part in each lane, and frame the whole board.
  useEffect(() => {
    const layout = initialLayout(blocks)
    setPositions(layout)
    setComposition(autoComposition(blocks))
    setSizes({})
    const rect = viewportRef.current?.getBoundingClientRect()
    if (rect) setView(computeFit(layout, {}, { width: rect.width, height: rect.height }))
  }, [blocks])

  /* ------------------------------- Measuring ------------------------------- */
  const onMeasure = useCallback((id: string, w: number, h: number) => {
    setSizes((prev) => (prev[id]?.w === w && prev[id]?.h === h ? prev : { ...prev, [id]: { w, h } }))
  }, [])

  /* --------------------------------- Pan ----------------------------------- */
  const pan = useRef<{ sx: number; sy: number; tx: number; ty: number } | null>(null)
  const onBgPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return
    pan.current = { sx: e.clientX, sy: e.clientY, tx: view.tx, ty: view.ty }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    setPanning(true)
  }
  const onBgPointerMove = (e: React.PointerEvent) => {
    const p = pan.current
    if (!p) return
    setView((v) => ({ ...v, tx: p.tx + (e.clientX - p.sx), ty: p.ty + (e.clientY - p.sy) }))
  }
  const onBgPointerUp = () => {
    pan.current = null
    setPanning(false)
  }

  /* --------------------------------- Zoom ---------------------------------- */
  // Native non-passive wheel listener so we can preventDefault the page scroll.
  useEffect(() => {
    const el = viewportRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const rect = el.getBoundingClientRect()
      const mx = e.clientX - rect.left
      const my = e.clientY - rect.top
      setView((v) => {
        const ns = clamp(v.scale * (e.deltaY < 0 ? 1.1 : 0.9), MIN_SCALE, MAX_SCALE)
        const wx = (mx - v.tx) / v.scale
        const wy = (my - v.ty) / v.scale
        return { scale: ns, tx: mx - wx * ns, ty: my - wy * ns }
      })
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  const zoomBy = (factor: number) => {
    const rect = viewportRef.current?.getBoundingClientRect()
    const mx = rect ? rect.width / 2 : 0
    const my = rect ? rect.height / 2 : 0
    setView((v) => {
      const ns = clamp(v.scale * factor, MIN_SCALE, MAX_SCALE)
      const wx = (mx - v.tx) / v.scale
      const wy = (my - v.ty) / v.scale
      return { scale: ns, tx: mx - wx * ns, ty: my - wy * ns }
    })
  }
  const fit = useCallback(() => {
    const rect = viewportRef.current?.getBoundingClientRect()
    if (rect) setView(computeFit(positions, sizes, { width: rect.width, height: rect.height }))
  }, [positions, sizes])

  /* ------------------------------ Node actions ----------------------------- */
  const moveNode = useCallback((id: string, dx: number, dy: number) => {
    setPositions((p) => (p[id] ? { ...p, [id]: { x: p[id].x + dx, y: p[id].y + dy } } : p))
  }, [])
  const selectBlock = useCallback((block: CanvasBlock) => {
    setComposition((c) => ({ ...c, [block.category]: block.id }))
  }, [])
  const clearSlot = useCallback((cat: BlockCategory) => {
    setComposition((c) => ({ ...c, [cat]: null }))
  }, [])
  const reset = useCallback(() => setComposition(autoComposition(blocks)), [blocks])

  /* ------------------------- Live preview (context) ------------------------ */
  const ad = useMemo(() => composeAd(blocks, composition), [blocks, composition])
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

  /* ------------------------------- Connectors ------------------------------ */
  const sizeOf = useCallback(
    (id: string) => sizes[id] ?? sizeFallback(id),
    [sizes],
  )
  const toScreen = useCallback(
    (wx: number, wy: number): Point => ({ x: wx * view.scale + view.tx, y: wy * view.scale + view.ty }),
    [view],
  )
  const connectors = useMemo(() => {
    const compPos = positions.composition
    if (!compPos) return []
    const compSize = sizeOf('composition')
    const out: { cat: BlockCategory; from: Point; to: Point }[] = []
    CATEGORY_ORDER.forEach((cat, i) => {
      const id = composition[cat]
      if (!id) return
      const bpos = positions[id]
      if (!bpos) return
      const bs = sizeOf(id)
      const from = toScreen(bpos.x + bs.w, bpos.y + bs.h / 2)
      const portY = compPos.y + compSize.h * ((i + 0.5) / CATEGORY_ORDER.length)
      const to = toScreen(compPos.x, portY)
      out.push({ cat, from, to })
    })
    return out
  }, [positions, composition, sizeOf, toScreen])

  /* --------------------------------- Empty --------------------------------- */
  if (contentBlocks === 0) {
    return (
      <div className="reactor-panel glass grid min-h-[460px] place-items-center p-8 text-center">
        <div className="max-w-sm">
          <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-white/[0.03]">
            <Sparkles size={26} className="text-glow/60" />
          </span>
          <h3 className="font-display text-base font-semibold text-white">The canvas is empty</h3>
          <p className="mx-auto mt-1.5 text-sm text-white/45">
            Fire the reactor first. Every hook, headline, body, CTA and visual it generates lands here as a
            building block you can drag, connect and remix into a live ad.
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
        <div className="flex items-center gap-2.5">
          <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-glow/70">Creative Canvas</span>
          <span className="hidden items-center gap-1.5 text-[11px] text-white/40 sm:flex">
            <Hand size={12} /> Drag to pan · scroll to zoom · click a block to swap it in
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => zoomBy(0.9)}
            aria-label="Zoom out"
            className="grid h-7 w-7 cursor-pointer place-items-center rounded-md border border-white/10 bg-white/[0.04] text-white/60 transition-colors hover:text-white"
          >
            <Minus size={14} />
          </button>
          <span className="w-10 text-center text-[11px] tabular text-white/45">{Math.round(view.scale * 100)}%</span>
          <button
            type="button"
            onClick={() => zoomBy(1.1)}
            aria-label="Zoom in"
            className="grid h-7 w-7 cursor-pointer place-items-center rounded-md border border-white/10 bg-white/[0.04] text-white/60 transition-colors hover:text-white"
          >
            <Plus size={14} />
          </button>
          <button
            type="button"
            onClick={fit}
            aria-label="Fit to screen"
            title="Fit to screen"
            className="ml-1 grid h-7 w-7 cursor-pointer place-items-center rounded-md border border-white/10 bg-white/[0.04] text-white/60 transition-colors hover:text-white"
          >
            <Maximize2 size={13} />
          </button>
        </div>
      </div>

      {/* Viewport */}
      <div
        ref={viewportRef}
        className={cn('creative-canvas relative h-[68vh] min-h-[480px] w-full touch-none overflow-hidden', panning && 'is-panning')}
      >
        {/* Background — pan starts here, clicks fall through gaps in the world */}
        <div
          data-canvas-bg
          onPointerDown={onBgPointerDown}
          onPointerMove={onBgPointerMove}
          onPointerUp={onBgPointerUp}
          style={{ backgroundPosition: `${view.tx}px ${view.ty}px` }}
          className="canvas-grid absolute inset-0"
        />

        {/* Connector overlay (screen space, reuses the reactor's energy channels) */}
        <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
          {connectors.map((c) => (
            <AgentConnectionPath
              key={c.cat}
              gid={`canvas-conn-${c.cat}`}
              from={c.from}
              to={c.to}
              color={CATEGORY_STROKE[c.cat]}
              toColor="#E9F2FF"
              active={!reduced}
              complete={reduced}
              dim={false}
              reduced={reduced}
            />
          ))}
        </svg>

        {/* World — transformed; pointer-events pass through to nodes only */}
        <div
          style={{ transform: `translate3d(${view.tx}px, ${view.ty}px, 0) scale(${view.scale})`, transformOrigin: '0 0' }}
          className="pointer-events-none absolute left-0 top-0"
        >
          <div className="pointer-events-auto">
            {CATEGORY_ORDER.map((cat) => (
              <LaneHeader key={cat} category={cat} count={blocksInCategory(blocks, cat).length} />
            ))}

            {blocks.map((b) =>
              positions[b.id] ? (
                <BlockNode
                  key={b.id}
                  block={b}
                  pos={positions[b.id]}
                  selected={composition[b.category] === b.id}
                  scale={view.scale}
                  onMeasure={onMeasure}
                  onMove={moveNode}
                  onSelect={selectBlock}
                />
              ) : null,
            )}

            {positions.composition && (
              <CompositionNode
                pos={positions.composition}
                scale={view.scale}
                blocks={blocks}
                composition={composition}
                copied={copied}
                image={previewImage}
                imageBusy={creativeState?.status === 'working'}
                imageError={creativeState?.status === 'error' ? creativeState.message : undefined}
                canGenerate={canGenerate}
                onGenerateImage={onGenerateImage}
                onMeasure={onMeasure}
                onMove={moveNode}
                onClear={clearSlot}
                onCopy={copy}
                onReset={reset}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
