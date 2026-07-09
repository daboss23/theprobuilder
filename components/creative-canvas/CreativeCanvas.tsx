'use client'

/**
 * Creative Canvas — the structured creative operating layer.
 *
 * Sits between the Campaign Reactor (strategy → scored concepts) and the
 * Studio (one finished Meta ad). The system builds the first strategic
 * structure from the run — one lane per concept, a fixed message spine, scene
 * nodes in montage mode — and the user shapes it: edit, branch, regenerate one
 * node at a time, lock what works, render scenes, then send a lane to the
 * Studio for finishing.
 *
 * Never a blank whiteboard: with no run yet it teaches; with a run it arrives
 * pre-structured. Strategy (angle · awareness · sophistication · audience ·
 * offer) stays pinned at the top and travels with every regeneration.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Edge,
  type Node,
  type NodeProps,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import {
  ArrowRight,
  Atom,
  Check,
  Film,
  GitBranch,
  ImageIcon,
  Loader2,
  Lock,
  LockOpen,
  Plus,
  RefreshCw,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Workflow,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { accentClass } from '@/components/reactor/ui'
import { useReactorRun, type Concept } from '@/components/campaign-reactor/ReactorRunContext'
import type { MetaAdPackage, MetaCta } from '@/lib/meta-ads'
import {
  BRANCH_DY,
  buildCanvasGraph,
  canvasMode,
  isVisualConcept,
  KIND_DEFS,
  MODE_LABELS,
  NODE_W,
  type CanvasNodeData,
  type CanvasNodeKind,
} from '@/lib/creative-canvas/graph'

/* -------------------------------------------------------------------------- */
/*  Props + shared context                                                    */
/* -------------------------------------------------------------------------- */

export interface CanvasStrategy {
  campaignName?: string
  angle?: string
  awareness?: string
  sophistication?: string
  audience?: string
  offer?: string
  offerName?: string
  outputs?: string[]
  montage?: boolean
}

interface CreativeCanvasProps {
  strategy: CanvasStrategy
  imageModel?: string
  videoModel?: string
  onSendToStudio: (c: Concept) => void
  onConfigure: () => void
}

/** Render state for a visual/scene node's media. */
interface NodeMedia {
  status: 'idle' | 'rendering' | 'animating' | 'done' | 'error'
  imageUrl?: string
  videoUrl?: string
  error?: string
}

const IDLE_MEDIA: NodeMedia = { status: 'idle' }

interface CanvasCtx {
  mediaFor: (id: string) => NodeMedia
  renderStill: (id: string) => void
  regenBusy: (id: string) => boolean
}

const Ctx = createContext<CanvasCtx | null>(null)
const useCanvas = () => {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('Canvas node rendered outside CreativeCanvas')
  return ctx
}

type CanvasRFNode = Node<CanvasNodeData>

/* -------------------------------------------------------------------------- */
/*  The node card                                                             */
/* -------------------------------------------------------------------------- */

function CanvasNodeView({ id, data, selected }: NodeProps<CanvasRFNode>) {
  const { mediaFor, renderStill, regenBusy } = useCanvas()
  const def = KIND_DEFS[data.kind]
  const media = mediaFor(id)
  const visual = data.kind === 'scene' || data.kind === 'visual'
  const busy = regenBusy(id)

  return (
    <div
      className={cn('canvas-node', accentClass[def.accent])}
      data-selected={selected}
      data-branch={data.branchIdx > 0}
      data-approved={data.approved}
    >
      <div className="flex items-center justify-between gap-2 border-b border-white/[0.07] px-3 py-2">
        <span className="flex min-w-0 items-center gap-1.5">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[rgb(var(--acc))]" />
          <span className="acc-text-hi truncate text-[9px] font-bold uppercase tracking-[0.14em]">
            {def.label}
            {data.branchIdx > 0 ? ` · Alt ${data.branchIdx}` : ''}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-1">
          {busy && <Loader2 size={11} className="animate-spin text-[#FF9D4D]" />}
          {data.locked && <Lock size={10} className="text-white/45" />}
          {data.approved && <Check size={11} className="text-emerald-400" />}
        </span>
      </div>

      <div className="px-3 py-2.5">
        <p className="mb-1 line-clamp-1 text-[11px] font-semibold text-white/85">{data.title}</p>
        <p className="line-clamp-4 whitespace-pre-line text-[11px] leading-snug text-white/60">
          {data.text || <span className="text-white/30">Empty — select to write it.</span>}
        </p>
        {data.sub && <p className="mt-1.5 line-clamp-1 text-[9px] text-white/30">{data.sub}</p>}

        {visual && (
          <div className="mt-2">
            {media.status === 'done' && media.videoUrl ? (
              // eslint-disable-next-line jsx-a11y/media-has-caption
              <video src={media.videoUrl} muted loop playsInline autoPlay className="w-full rounded-lg border border-white/10" />
            ) : media.imageUrl ? (
              <span className="relative block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={media.imageUrl} alt={data.title} className="w-full rounded-lg border border-white/10 object-cover" />
                {(media.status === 'rendering' || media.status === 'animating') && (
                  <span className="absolute inset-0 grid place-items-center rounded-lg bg-black/50">
                    <Loader2 size={16} className="animate-spin text-white/80" />
                  </span>
                )}
              </span>
            ) : media.status === 'rendering' ? (
              <span className="grid h-20 w-full place-items-center rounded-lg border border-white/10 bg-white/[0.02]">
                <Loader2 size={15} className="animate-spin text-[#FF9D4D]" />
              </span>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  renderStill(id)
                }}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1.5 text-[10px] font-semibold text-white/55 transition-colors hover:border-[#FF9D4D]/40 hover:text-white"
              >
                <ImageIcon size={11} /> Render this {data.kind}
              </button>
            )}
            {media.status === 'error' && (
              <p className="mt-1 text-[9px] text-warning">{media.error ?? 'Render failed'}</p>
            )}
          </div>
        )}
      </div>

      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  )
}

const nodeTypes = { canvas: CanvasNodeView }

/* -------------------------------------------------------------------------- */
/*  Strategy chips — the pinned intelligence bar                              */
/* -------------------------------------------------------------------------- */

function StrategyChip({ label, value }: { label: string; value?: string }) {
  if (!value || value === 'No Preference') return null
  return (
    <span className="inline-flex max-w-[220px] items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] text-white/70">
      <span className="shrink-0 text-white/35">{label}</span>
      <span className="truncate">{value}</span>
    </span>
  )
}

/* -------------------------------------------------------------------------- */
/*  The Creative Canvas                                                       */
/* -------------------------------------------------------------------------- */

export function CreativeCanvas(props: CreativeCanvasProps) {
  return (
    <ReactFlowProvider>
      <CanvasInner {...props} />
    </ReactFlowProvider>
  )
}

function CanvasInner({ strategy, imageModel, videoModel, onSendToStudio, onConfigure }: CreativeCanvasProps) {
  const { concepts } = useReactorRun()
  const mode = canvasMode(strategy.outputs, Boolean(strategy.montage))

  const [nodes, setNodes, onNodesChange] = useNodesState<CanvasRFNode>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [media, setMedia] = useState<Record<string, NodeMedia>>({})
  const [regenerating, setRegenerating] = useState<Record<string, boolean>>({})
  const [direction, setDirection] = useState('')

  /* ------------------- Build the opening structure per run ------------------ */
  const rf = useReactFlow()
  const builtKeyRef = useRef<string | null>(null)
  useEffect(() => {
    const key = `${mode}:${concepts.map((c) => c.text).join('|')}`
    if (!concepts.length || builtKeyRef.current === key) return
    builtKeyRef.current = key
    const graph = buildCanvasGraph(concepts, mode)
    setNodes(
      graph.nodes.map((n) => ({ id: n.id, position: n.position, data: n.data, type: 'canvas' as const })),
    )
    setEdges(
      graph.edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        type: 'smoothstep' as const,
        className: e.branch ? 'canvas-edge-branch' : undefined,
      })),
    )
    setSelectedId(null)
    setMedia({})
    // Land the viewport on the opening of the first lane at a readable zoom —
    // the rest of the structure is one pan away, never a wall of tiny cards.
    const opening = graph.nodes
      .filter((n) => n.data.lane === 0)
      .slice(0, 4)
      .map((n) => ({ id: n.id }))
    window.setTimeout(() => {
      void rf.fitView({ nodes: opening, padding: 0.2, maxZoom: 0.9, duration: 500 })
    }, 300)
  }, [concepts, mode, setNodes, setEdges, rf])

  const laneConcepts = useMemo(() => {
    const lanes = concepts.filter(isVisualConcept).slice(0, 4)
    if (lanes.length === 0 && concepts.length > 0) {
      lanes.push([...concepts].sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0])
    }
    return lanes
  }, [concepts])

  const selected = nodes.find((n) => n.id === selectedId) ?? null

  /* ------------------------------ Node helpers ------------------------------ */

  const patchNode = useCallback(
    (id: string, patch: Partial<CanvasNodeData>) => {
      setNodes((ns) => ns.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...patch } } : n)))
    },
    [setNodes],
  )

  /** The lane's kept context for a coherent single-node regeneration. */
  const laneContext = useCallback(
    (lane: number, excludeId: string) =>
      nodes
        .filter((n) => n.data.lane === lane && n.id !== excludeId && n.data.text.trim())
        .filter((n) => n.data.branchIdx === 0 || n.data.approved)
        .map((n) => `${n.data.title}: ${n.data.text}`)
        .slice(0, 6),
    [nodes],
  )

  const regenerate = useCallback(
    async (id: string) => {
      const node = nodes.find((n) => n.id === id)
      if (!node || node.data.locked || regenerating[id]) return
      setRegenerating((r) => ({ ...r, [id]: true }))
      try {
        const res = await fetch('/api/canvas/regenerate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            kind: node.data.kind,
            title: node.data.title,
            current: node.data.text,
            strategy,
            context: laneContext(node.data.lane, id),
            direction: direction.trim() || undefined,
          }),
        }).then((r) => r.json())
        if (res.ok && res.text) patchNode(id, { text: res.text })
      } catch {
        /* regeneration is best-effort — the current version stands */
      } finally {
        setRegenerating((r) => ({ ...r, [id]: false }))
      }
    },
    [nodes, regenerating, strategy, laneContext, direction, patchNode],
  )

  /** Branch: a controlled alternate stacked under the original, dashed in. */
  const branchNode = useCallback(
    (id: string) => {
      const src = nodes.find((n) => n.id === id)
      if (!src) return
      const siblings = nodes.filter(
        (n) => n.data.lane === src.data.lane && n.data.kind === src.data.kind,
      )
      const idx = siblings.length
      const altId = `${id}-alt${idx}`
      const baseTitle = src.data.title.replace(/ — Alt \d+$/, '')
      setNodes((ns) => [
        ...ns,
        {
          id: altId,
          type: 'canvas' as const,
          position: { x: src.position.x + 24, y: src.position.y + BRANCH_DY * idx },
          data: {
            ...src.data,
            title: `${baseTitle} — Alt ${idx}`,
            branchIdx: idx,
            approved: false,
            locked: false,
          },
        },
      ])
      setEdges((es) => {
        const incoming = es.filter((e) => e.target === id)
        const outgoing = es.filter((e) => e.source === id)
        return [
          ...es,
          ...incoming.map((e) => ({
            id: `${e.source}→${altId}`,
            source: e.source,
            target: altId,
            type: 'smoothstep' as const,
            className: 'canvas-edge-branch',
          })),
          ...outgoing.map((e) => ({
            id: `${altId}→${e.target}`,
            source: altId,
            target: e.target,
            type: 'smoothstep' as const,
            className: 'canvas-edge-branch',
          })),
        ]
      })
      setSelectedId(altId)
    },
    [nodes, setNodes, setEdges],
  )

  /** Approve an alternate — it becomes the lane's active take for its kind. */
  const approveNode = useCallback(
    (id: string) => {
      const node = nodes.find((n) => n.id === id)
      if (!node) return
      const next = !node.data.approved
      setNodes((ns) =>
        ns.map((n) => {
          if (n.id === id) return { ...n, data: { ...n.data, approved: next } }
          if (n.data.lane === node.data.lane && n.data.kind === node.data.kind && next)
            return { ...n, data: { ...n.data, approved: false } }
          return n
        }),
      )
    },
    [nodes, setNodes],
  )

  /** Remove an alternate or a scene, reconnecting the spine around it. */
  const removeNode = useCallback(
    (id: string) => {
      const node = nodes.find((n) => n.id === id)
      if (!node) return
      const incoming = edges.filter((e) => e.target === id)
      const outgoing = edges.filter((e) => e.source === id)
      setNodes((ns) => ns.filter((n) => n.id !== id))
      setEdges((es) => {
        const kept = es.filter((e) => e.source !== id && e.target !== id)
        // Scenes sit on the spine — heal it so the sequence stays connected.
        if (node.data.kind === 'scene' && node.data.branchIdx === 0) {
          for (const i of incoming)
            for (const o of outgoing)
              kept.push({ id: `${i.source}→${o.target}`, source: i.source, target: o.target, type: 'smoothstep' as const })
        }
        return kept
      })
      if (selectedId === id) setSelectedId(null)
    },
    [nodes, edges, setNodes, setEdges, selectedId],
  )

  /** Insert a fresh scene right after the selected one (montage shaping). */
  const addSceneAfter = useCallback(
    (id: string) => {
      const src = nodes.find((n) => n.id === id)
      if (!src || src.data.kind !== 'scene') return
      const newId = `${id}-plus-${Date.now().toString(36)}`
      const lane = src.data.lane
      // Make room: everything on this lane to the right shifts one column.
      setNodes((ns) => [
        ...ns.map((n) =>
          n.data.lane === lane && n.position.x > src.position.x && n.data.branchIdx === 0
            ? { ...n, position: { ...n.position, x: n.position.x + NODE_W + 60 } }
            : n,
        ),
        {
          id: newId,
          type: 'canvas' as const,
          position: { x: src.position.x + NODE_W + 60, y: src.position.y },
          data: {
            ...src.data,
            title: 'New scene',
            text: '',
            sub: src.data.sub,
            approved: false,
            locked: false,
            branchIdx: 0,
            sceneIdx: (src.data.sceneIdx ?? 0) + 1,
          },
        },
      ])
      setEdges((es) => {
        const out = es.find((e) => e.source === id && !es.some((x) => x.id === e.id && x.className))
        const kept = es.filter((e) => e.id !== out?.id)
        kept.push({ id: `${id}→${newId}`, source: id, target: newId, type: 'smoothstep' as const })
        if (out) kept.push({ id: `${newId}→${out.target}`, source: newId, target: out.target, type: 'smoothstep' as const })
        return kept
      })
      setSelectedId(newId)
    },
    [nodes, setNodes, setEdges],
  )

  /* ------------------------------- Rendering -------------------------------- */

  const aspectRatio = mode === 'static' ? '1:1' : '9:16'

  const renderStill = useCallback(
    async (id: string) => {
      const node = nodes.find((n) => n.id === id)
      if (!node) return
      setMedia((m) => ({ ...m, [id]: { status: 'rendering' } }))
      try {
        const prompt = `${node.data.prompt ?? node.data.text}\n\nRender as a premium Meta ad creative for The Professional Builder — photographic, on-site builder context, high contrast, room for text overlay.${strategy.angle ? ` Campaign angle: ${strategy.angle}.` : ''}`
        const res = await fetch('/api/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, aspectRatio, model: imageModel }),
        }).then((r) => r.json())
        if (res.success && res.imageUrl) {
          setMedia((m) => ({ ...m, [id]: { status: 'done', imageUrl: res.imageUrl } }))
        } else {
          setMedia((m) => ({
            ...m,
            [id]: {
              status: 'error',
              error: res.error || (res.demo ? 'No image key set — add FAL_KEY or HF_CREDENTIALS' : 'Render failed'),
            },
          }))
        }
      } catch {
        setMedia((m) => ({ ...m, [id]: { status: 'error', error: 'Render failed' } }))
      }
    },
    [nodes, aspectRatio, imageModel, strategy.angle],
  )

  const pollVideo = useCallback(async (id: string, requestId: string, model?: string, responseUrl?: string) => {
    const q = `${model ? `&model=${encodeURIComponent(model)}` : ''}${responseUrl ? `&responseUrl=${encodeURIComponent(responseUrl)}` : ''}`
    for (let i = 0; i < 90; i++) {
      await new Promise((r) => setTimeout(r, 4000))
      try {
        const res = await fetch(`/api/generate-video?requestId=${encodeURIComponent(requestId)}${q}`).then((r) => r.json())
        if (res.status === 'completed' && res.videoUrl) {
          setMedia((m) => ({ ...m, [id]: { ...m[id], status: 'done', videoUrl: res.videoUrl } }))
          return
        }
        if (res.status === 'failed' || res.status === 'nsfw') {
          setMedia((m) => ({ ...m, [id]: { ...m[id], status: 'error', error: 'Animation failed' } }))
          return
        }
      } catch {
        /* transient — keep polling */
      }
    }
    setMedia((m) => ({ ...m, [id]: { ...m[id], status: 'error', error: 'Animation timed out' } }))
  }, [])

  const animateScene = useCallback(
    async (id: string) => {
      const node = nodes.find((n) => n.id === id)
      const still = media[id]?.imageUrl
      if (!node) return
      setMedia((m) => ({ ...m, [id]: { ...m[id], status: 'animating' } }))
      try {
        const body = still
          ? { imageUrl: still, mode: 'image-to-video', model: videoModel, aspectRatio, prompt: node.data.text }
          : { prompt: node.data.text, mode: 'text-to-video', model: videoModel, aspectRatio }
        const res = await fetch('/api/generate-video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }).then((r) => r.json())
        if (res.success && res.requestId) {
          void pollVideo(id, res.requestId, res.modelId, res.responseUrl)
        } else {
          setMedia((m) => ({
            ...m,
            [id]: {
              ...m[id],
              status: 'error',
              error: res.error || (res.demo ? 'No video key set — add FAL_KEY or HF_CREDENTIALS' : 'Animation failed'),
            },
          }))
        }
      } catch {
        setMedia((m) => ({ ...m, [id]: { ...m[id], status: 'error', error: 'Animation failed' } }))
      }
    },
    [nodes, media, videoModel, aspectRatio, pollVideo],
  )

  /* ---------------------------- Send to Studio ------------------------------ */

  /** The lane's active take for a kind — the approved alternate, else primary. */
  const activeText = useCallback(
    (lane: number, kind: CanvasNodeKind): string => {
      const pool = nodes.filter((n) => n.data.lane === lane && n.data.kind === kind)
      const chosen = pool.find((n) => n.data.approved) ?? pool.find((n) => n.data.branchIdx === 0)
      return chosen?.data.text.trim() ?? ''
    },
    [nodes],
  )

  const sendLaneToStudio = useCallback(
    (lane: number) => {
      const src = laneConcepts[lane]
      if (!src) return
      const hook = activeText(lane, 'hook')
      const message = activeText(lane, 'message')
      const headline = activeText(lane, 'cta')
      const primaryText = [hook, message].filter(Boolean).join('\n\n') || src.text
      const pkg: MetaAdPackage = {
        primaryText,
        headline: headline || src.adPackage?.headline || 'The Professional Builder',
        description: src.adPackage?.description,
        cta: (src.adPackage?.cta ?? 'LEARN_MORE') as MetaCta,
      }
      onSendToStudio({ ...src, text: primaryText, adPackage: pkg })
    },
    [laneConcepts, activeText, onSendToStudio],
  )

  /* ------------------------------- Empty state ------------------------------ */

  if (concepts.length === 0) {
    return (
      <div className="canvas-shell grid min-h-[560px] place-items-center p-8 text-center">
        <div className="max-w-lg">
          <span className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl border border-[#FF7C54]/25 bg-[#FF5E3A]/[0.06]">
            <Workflow size={26} className="text-[#FF9D4D]" />
          </span>
          <h3 className="font-display text-xl font-bold text-white">The Creative Canvas</h3>
          <p className="mx-auto mt-2 text-sm leading-relaxed text-white/50">
            Where strategy becomes creative structure. Fire the reactor and the system builds the
            first structure for you — hooks, message, proof, scenes, and CTA as connected nodes you
            can shape, branch, and regenerate one piece at a time.
          </p>
          <div className="mx-auto mt-6 grid max-w-md grid-cols-3 gap-2.5 text-left">
            {[
              { Icon: Sparkles, t: 'Pre-structured', d: 'Never a blank board — the run arrives organized.' },
              { Icon: GitBranch, t: 'Branch', d: 'Alternate hooks and CTAs as controlled variants.' },
              { Icon: RefreshCw, t: 'Regenerate', d: 'One node at a time, strategy held constant.' },
            ].map(({ Icon, t, d }) => (
              <div key={t} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                <Icon size={14} className="mb-1.5 text-[#FF9D4D]" />
                <p className="text-xs font-semibold text-white">{t}</p>
                <p className="mt-0.5 text-[10px] leading-snug text-white/40">{d}</p>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={onConfigure}
            className="mt-7 inline-flex items-center gap-2 rounded-full border border-[#FF7C54]/35 bg-[#FF5E3A]/10 px-5 py-2.5 text-sm font-semibold text-[#FF9D4D] transition-colors hover:bg-[#FF5E3A]/20"
          >
            <Atom size={14} /> Open the campaign brief
          </button>
        </div>
      </div>
    )
  }

  /* --------------------------------- Canvas --------------------------------- */

  const def = selected ? KIND_DEFS[selected.data.kind] : null

  return (
    <Ctx.Provider value={{ mediaFor: (id) => media[id] ?? IDLE_MEDIA, renderStill, regenBusy: (id) => Boolean(regenerating[id]) }}>
      <div className="canvas-shell flex h-[720px] flex-col">
        {/* ------------------------- Strategy bar ------------------------- */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] px-5 py-3.5">
          <div className="flex min-w-0 flex-wrap items-center gap-2.5">
            <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.26em] text-[#FF9D4D]/80">
              <Workflow size={13} /> Creative Canvas
            </span>
            <span className="hidden h-4 w-px bg-white/10 sm:block" />
            <span className="truncate font-display text-sm font-semibold text-white">
              {strategy.campaignName?.trim() || 'Untitled campaign'}
            </span>
            <span className="inline-flex items-center rounded-full border border-[#FF7C54]/30 bg-[#FF5E3A]/[0.08] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#FF9D4D]">
              {MODE_LABELS[mode]}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onConfigure}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.03] px-3.5 py-1.5 text-[11px] font-semibold text-white/60 transition-colors hover:border-white/25 hover:text-white"
            >
              <SlidersHorizontal size={12} /> Re-brief
            </button>
            <button
              type="button"
              onClick={() => sendLaneToStudio(selected?.data.lane ?? 0)}
              className="fire-btn inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-wide text-white"
            >
              Send to Studio <ArrowRight size={12} />
            </button>
          </div>
        </div>

        {/* Pinned strategic read — the canvas never loses the strategy */}
        <div className="flex flex-wrap items-center gap-1.5 border-b border-white/[0.06] px-5 py-2.5">
          <StrategyChip label="Angle" value={strategy.angle} />
          <StrategyChip label="Awareness" value={strategy.awareness} />
          <StrategyChip label="Sophistication" value={strategy.sophistication} />
          <StrategyChip label="Audience" value={strategy.audience} />
          <StrategyChip label="Offer" value={strategy.offerName?.trim() || strategy.offer} />
        </div>

        {/* --------------------- Canvas + detail panel --------------------- */}
        <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1fr)_330px]">
          <div className="relative min-h-[320px]">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              nodeTypes={nodeTypes}
              onNodeClick={(_, n) => setSelectedId(n.id)}
              onPaneClick={() => setSelectedId(null)}
              minZoom={0.25}
              maxZoom={1.4}
              proOptions={{ hideAttribution: true }}
            >
              <Background variant={BackgroundVariant.Cross} gap={30} size={3} color="rgba(255,150,110,0.10)" />
              <Controls showInteractive={false} position="bottom-left" />
            </ReactFlow>
          </div>

          {/* ------------------------- Detail panel ------------------------- */}
          <aside className="hidden min-h-0 overflow-y-auto border-l border-white/[0.08] p-4 lg:block">
            {!selected || !def ? (
              <div className="space-y-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-white/50">
                  Direction Deck
                </p>
                <p className="text-xs leading-relaxed text-white/45">
                  The system built this structure from your run — every lane is one concept, left to
                  right: hook → message → proof → {mode === 'montage' ? 'scenes' : 'visual'} → CTA →
                  output. Select any node to shape it.
                </p>
                <ul className="space-y-2">
                  {[
                    ['Edit', 'Rewrite any node by hand — your words always win.'],
                    ['Regenerate', 'One node at a time; strategy and locked nodes are held constant.'],
                    ['Branch', 'Spin controlled alternates of a hook or CTA, then approve the winner.'],
                    ['Render', 'Scenes and visuals render stills, then animate into clips.'],
                    ['Send to Studio', 'The active lane becomes a launch-ready Meta ad unit.'],
                  ].map(([t, d]) => (
                    <li key={t} className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-2">
                      <p className="text-[11px] font-semibold text-white/80">{t}</p>
                      <p className="mt-0.5 text-[10px] leading-snug text-white/40">{d}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className={cn('space-y-3.5', accentClass[def.accent])}>
                <div>
                  <p className="acc-text-hi flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[rgb(var(--acc))]" /> {def.label}
                  </p>
                  <p className="mt-1 font-display text-sm font-semibold text-white">{selected.data.title}</p>
                  <p className="mt-0.5 text-[10px] text-white/35">{def.hint}</p>
                </div>

                <textarea
                  value={selected.data.text}
                  onChange={(e) => patchNode(selected.id, { text: e.target.value })}
                  disabled={selected.data.locked}
                  rows={selected.data.kind === 'cta' ? 2 : 7}
                  placeholder={def.hint}
                  className="w-full resize-none rounded-xl border border-white/12 bg-black/40 px-3 py-2.5 text-[12px] leading-relaxed text-white placeholder:text-white/25 outline-none transition-colors focus:border-[#FF9D4D]/40 disabled:opacity-50"
                />

                {def.regen && (
                  <input
                    value={direction}
                    onChange={(e) => setDirection(e.target.value)}
                    placeholder={`Optional steer — e.g. "harder on identity, no numbers"`}
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-[11px] text-white placeholder:text-white/25 outline-none transition-colors focus:border-[#FF9D4D]/35"
                  />
                )}

                <div className="grid grid-cols-2 gap-2">
                  {def.regen && (
                    <button
                      type="button"
                      onClick={() => regenerate(selected.id)}
                      disabled={selected.data.locked || Boolean(regenerating[selected.id])}
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#FF7C54]/30 bg-[#FF5E3A]/[0.08] px-3 py-2 text-[11px] font-semibold text-[#FF9D4D] transition-colors hover:bg-[#FF5E3A]/15 disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      {regenerating[selected.id] ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <RefreshCw size={12} />
                      )}
                      Regenerate
                    </button>
                  )}
                  {def.branch && (
                    <button
                      type="button"
                      onClick={() => branchNode(selected.id)}
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/12 bg-white/[0.03] px-3 py-2 text-[11px] font-semibold text-white/65 transition-colors hover:border-white/25 hover:text-white"
                    >
                      <GitBranch size={12} /> Branch
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => patchNode(selected.id, { locked: !selected.data.locked })}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/12 bg-white/[0.03] px-3 py-2 text-[11px] font-semibold text-white/65 transition-colors hover:border-white/25 hover:text-white"
                  >
                    {selected.data.locked ? <LockOpen size={12} /> : <Lock size={12} />}
                    {selected.data.locked ? 'Unlock' : 'Lock'}
                  </button>
                  <button
                    type="button"
                    onClick={() => approveNode(selected.id)}
                    className={cn(
                      'inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-[11px] font-semibold transition-colors',
                      selected.data.approved
                        ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300'
                        : 'border-white/12 bg-white/[0.03] text-white/65 hover:border-emerald-400/35 hover:text-emerald-300',
                    )}
                  >
                    <Check size={12} /> {selected.data.approved ? 'Approved' : 'Approve'}
                  </button>
                  {selected.data.kind === 'scene' && (
                    <button
                      type="button"
                      onClick={() => addSceneAfter(selected.id)}
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/12 bg-white/[0.03] px-3 py-2 text-[11px] font-semibold text-white/65 transition-colors hover:border-white/25 hover:text-white"
                    >
                      <Plus size={12} /> Add scene after
                    </button>
                  )}
                  {(selected.data.branchIdx > 0 || selected.data.kind === 'scene') && (
                    <button
                      type="button"
                      onClick={() => removeNode(selected.id)}
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/12 bg-white/[0.03] px-3 py-2 text-[11px] font-semibold text-white/50 transition-colors hover:border-danger/40 hover:text-danger"
                    >
                      <Trash2 size={12} /> Remove
                    </button>
                  )}
                </div>

                {(selected.data.kind === 'scene' || selected.data.kind === 'visual') && (
                  <div className="space-y-2 border-t border-white/[0.07] pt-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-white/45">
                      Production
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => renderStill(selected.id)}
                        disabled={media[selected.id]?.status === 'rendering'}
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/12 bg-white/[0.03] px-3 py-2 text-[11px] font-semibold text-white/65 transition-colors hover:border-[#FF9D4D]/40 hover:text-white disabled:opacity-45"
                      >
                        <ImageIcon size={12} /> Render still
                      </button>
                      <button
                        type="button"
                        onClick={() => animateScene(selected.id)}
                        disabled={media[selected.id]?.status === 'animating'}
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/12 bg-white/[0.03] px-3 py-2 text-[11px] font-semibold text-white/65 transition-colors hover:border-[#FF9D4D]/40 hover:text-white disabled:opacity-45"
                      >
                        <Film size={12} /> Animate
                      </button>
                    </div>
                    <p className="text-[10px] leading-snug text-white/30">
                      Stills render on {imageModel ?? 'the best configured model'}; animation runs on{' '}
                      {videoModel ?? 'the best configured model'} at {aspectRatio}.
                    </p>
                  </div>
                )}

                {selected.data.sub && (
                  <p className="border-t border-white/[0.07] pt-3 text-[10px] leading-snug text-white/35">
                    {selected.data.sub}
                  </p>
                )}
                {typeof selected.data.score === 'number' && (
                  <p className="text-[10px] text-white/35">
                    Lane rubric score:{' '}
                    <span className="font-semibold text-white/60">{selected.data.score}/10</span>
                  </p>
                )}

                <button
                  type="button"
                  onClick={() => sendLaneToStudio(selected.data.lane)}
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-[#FF7C54]/30 bg-[#FF5E3A]/[0.08] px-3 py-2.5 text-[11px] font-bold uppercase tracking-wide text-[#FF9D4D] transition-colors hover:bg-[#FF5E3A]/15"
                >
                  Send this lane to Studio <ArrowRight size={12} />
                </button>
              </div>
            )}
          </aside>
        </div>
      </div>
    </Ctx.Provider>
  )
}
