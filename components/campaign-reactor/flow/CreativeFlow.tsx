'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  MiniMap,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  type Edge,
  type Node,
  type NodeProps,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import {
  Atom,
  Check,
  Copy as CopyIcon,
  Film,
  ImageIcon,
  Loader2,
  Play,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useReactorRun, type Concept } from '@/components/campaign-reactor/ReactorRunContext'
import { AdPreviewCard } from '@/components/campaign-reactor/canvas/AdPreviewCard'
import {
  autoComposition,
  buildBlocks,
  composeAd,
  composedToText,
  type Composition,
} from '@/lib/campaign-reactor/canvas'
import {
  ASPECT_OPTIONS,
  aspectBox,
  DEFAULT_ASPECT,
  mediaConcepts,
} from '@/lib/campaign-reactor/flow'

interface ModelOption {
  id: string
  label: string
  configured: boolean
}

/* -------------------------------------------------------------------------- */
/*  Shared flow context — nodes read live run state + controls from here, so   */
/*  React Flow's node `data` can stay minimal and never goes stale.            */
/* -------------------------------------------------------------------------- */

interface FlowCtx {
  conceptAt: (i: number) => Concept | undefined
  control: (i: number) => { model: string; aspect: string }
  setModel: (i: number, m: string) => void
  setAspect: (i: number, a: string) => void
  run: (i: number) => void
  imageFor: (c: Concept) => string | undefined
  videoUrlFor: (c: Concept) => string | undefined
  stateFor: (c: Concept) => { busy: boolean; error?: string }
  imageModels: ModelOption[]
  videoModels: ModelOption[]
  angle?: string
  offerName?: string
  composition: { ad: ReturnType<typeof composeAd>; copy: () => void; copied: boolean }
}

const FlowContext = createContext<FlowCtx | null>(null)
const useFlow = () => {
  const ctx = useContext(FlowContext)
  if (!ctx) throw new Error('Flow node rendered outside CreativeFlow')
  return ctx
}

/* -------------------------------------------------------------------------- */
/*  Small styled selects (native — no extra UI dependency)                     */
/* -------------------------------------------------------------------------- */

function MiniSelect({
  value,
  onChange,
  children,
  title,
}: {
  value: string
  onChange: (v: string) => void
  children: ReactNode
  title?: string
}) {
  return (
    <select
      value={value}
      title={title}
      onChange={(e) => onChange(e.target.value)}
      className="nodrag w-full cursor-pointer rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-[11px] text-white/80 outline-none transition-colors hover:border-white/20 focus:border-glow/40"
    >
      {children}
    </select>
  )
}

/* -------------------------------------------------------------------------- */
/*  Brief node — the campaign root                                            */
/* -------------------------------------------------------------------------- */

function BriefNode() {
  const { angle, offerName } = useFlow()
  return (
    <div className="w-[220px] rounded-xl border border-glow/30 bg-[#0b0f17]/90 p-3 shadow-[0_0_40px_-20px_rgba(94,168,255,0.8)] backdrop-blur">
      <div className="mb-1.5 flex items-center gap-1.5">
        <Atom size={13} className="text-glow" />
        <span className="font-display text-[11px] font-bold uppercase tracking-[0.16em] text-white">
          Campaign Brief
        </span>
      </div>
      <p className="text-[12px] font-medium text-white/85">{angle?.trim() || 'Agent-decided angle'}</p>
      {offerName?.trim() && <p className="mt-0.5 text-[11px] text-white/45">Offer · {offerName}</p>}
      <p className="mt-2 text-[10px] text-white/30">Every node below is grounded in this run.</p>
      <Handle type="source" position={Position.Right} className="!h-2 !w-2 !border-glow/60 !bg-glow" />
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Media node — a runnable image / video generation step                     */
/* -------------------------------------------------------------------------- */

function MediaNode({ data }: NodeProps) {
  const { conceptIndex } = data as { conceptIndex: number }
  const flow = useFlow()
  const concept = flow.conceptAt(conceptIndex)
  if (!concept) return null

  const isVideo = /video|testimonial/i.test(concept.type)
  const ctrl = flow.control(conceptIndex)
  const image = flow.imageFor(concept)
  const videoUrl = flow.videoUrlFor(concept)
  const { busy, error } = flow.stateFor(concept)
  const models = isVideo ? flow.videoModels : flow.imageModels
  const hasOutput = Boolean(image || videoUrl)

  return (
    <div className="w-[260px] overflow-hidden rounded-xl border border-white/10 bg-[#0b0f17]/92 backdrop-blur">
      <Handle type="target" position={Position.Left} className="!h-2 !w-2 !border-white/30 !bg-white/40" />

      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] px-3 py-2">
        <span className="flex items-center gap-1.5 truncate text-[11px] font-semibold uppercase tracking-wider text-white/80">
          {isVideo ? <Film size={12} className="text-violet-300" /> : <ImageIcon size={12} className="text-cyan-300" />}
          {concept.type}
        </span>
        {typeof concept.score === 'number' && (
          <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-1.5 text-[10px] text-white/55">
            {concept.score}/10
          </span>
        )}
      </div>

      {/* Preview */}
      <div className={cn('relative w-full overflow-hidden border-b border-white/[0.06] bg-black/40', aspectBox(ctrl.aspect))}>
        {videoUrl ? (
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <video src={videoUrl} controls className="h-full w-full object-cover" />
        ) : image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt={concept.type} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-3 text-center">
            {busy ? (
              <Loader2 size={22} className="animate-spin text-glow/70" />
            ) : (
              <span className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/[0.03]">
                {isVideo ? <Film size={18} className="text-white/40" /> : <ImageIcon size={18} className="text-white/40" />}
              </span>
            )}
            <p className="line-clamp-3 text-[11px] leading-snug text-white/45">{concept.text}</p>
          </div>
        )}
        {error && (
          <span className="absolute inset-x-0 bottom-0 bg-danger/20 px-2 py-1 text-[10px] text-danger">{error}</span>
        )}
      </div>

      {/* Controls */}
      <div className="space-y-2 p-3">
        {concept.basis && (
          <p className="line-clamp-1 text-[10px] text-white/35">
            <span className="text-glow/70">Grounded in</span> · {concept.basis}
          </p>
        )}
        <div className="grid grid-cols-2 gap-1.5">
          <MiniSelect value={ctrl.model} onChange={(v) => flow.setModel(conceptIndex, v)} title="Model">
            <option value="auto">Auto model</option>
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
                {m.configured ? '' : ' (no key)'}
              </option>
            ))}
          </MiniSelect>
          <MiniSelect value={ctrl.aspect} onChange={(v) => flow.setAspect(conceptIndex, v)} title="Ad dimensions">
            {ASPECT_OPTIONS.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label} {a.ratio}
              </option>
            ))}
          </MiniSelect>
        </div>
        <button
          type="button"
          onClick={() => flow.run(conceptIndex)}
          disabled={busy}
          className="nodrag inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-glow/30 bg-glow/10 px-3 py-1.5 text-[11px] font-semibold text-glow transition-colors hover:bg-glow/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
          {busy ? 'Rendering…' : hasOutput ? 'Re-run' : isVideo ? 'Generate video' : 'Generate image'}
        </button>
      </div>

      <Handle type="source" position={Position.Right} className="!h-2 !w-2 !border-glow/60 !bg-glow" />
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Composition node — the live finished ad (reuses the Studio preview card)   */
/* -------------------------------------------------------------------------- */

function CompositionNode() {
  const { composition } = useFlow()
  return (
    <div className="w-[340px] rounded-xl border border-white/10 bg-[#0b0f17]/92 p-3 backdrop-blur">
      <Handle type="target" position={Position.Left} className="!h-2 !w-2 !border-white/30 !bg-white/40" />
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 font-display text-[11px] font-bold uppercase tracking-[0.16em] text-white">
          <Sparkles size={12} className="text-glow" /> Live Ad Composition
        </span>
        <button
          type="button"
          onClick={composition.copy}
          className="nodrag inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-glow/30 bg-glow/10 px-2 py-1 text-[10px] font-semibold text-glow transition-colors hover:bg-glow/20"
        >
          {composition.copied ? <Check size={11} /> : <CopyIcon size={11} />}
          {composition.copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <AdPreviewCard ad={composition.ad} />
      <p className="mt-2 text-[10px] text-white/30">
        Assembled from OPUS&rsquo;s top-scoring copy + the run&rsquo;s visual. Switch to Studio to remix the copy.
      </p>
    </div>
  )
}

const nodeTypes = { brief: BriefNode, media: MediaNode, composition: CompositionNode }

/* -------------------------------------------------------------------------- */
/*  The canvas                                                                */
/* -------------------------------------------------------------------------- */

function FlowInner({ offerName, angle }: { offerName?: string; angle?: string }) {
  const { concepts, generateCreative, imageFor, videoFor, creativeStateFor } = useReactorRun()

  const media = useMemo(() => mediaConcepts(concepts), [concepts])
  const blocks = useMemo(() => buildBlocks(concepts, offerName), [concepts, offerName])

  /* ------------------------------ Controls -------------------------------- */
  const [overrides, setOverrides] = useState<Record<number, { model?: string; aspect?: string }>>({})
  const [defaultAspect, setDefaultAspect] = useState<string>(DEFAULT_ASPECT)
  const [imageModels, setImageModels] = useState<ModelOption[]>([])
  const [videoModels, setVideoModels] = useState<ModelOption[]>([])
  const [composition, setComposition] = useState<Composition>(() => autoComposition(blocks))
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetch('/api/image/models')
      .then((r) => r.json())
      .then((d) => Array.isArray(d.models) && setImageModels(d.models))
      .catch(() => {})
    fetch('/api/video/models')
      .then((r) => r.json())
      .then((d) => Array.isArray(d.models) && setVideoModels(d.models))
      .catch(() => {})
  }, [])

  useEffect(() => {
    setComposition(autoComposition(blocks))
    setOverrides({})
  }, [blocks])

  const control = useCallback(
    (i: number) => ({
      model: overrides[i]?.model ?? 'auto',
      aspect: overrides[i]?.aspect ?? defaultAspect,
    }),
    [overrides, defaultAspect],
  )
  const setModel = useCallback(
    (i: number, model: string) => setOverrides((o) => ({ ...o, [i]: { ...o[i], model } })),
    [],
  )
  const setAspect = useCallback(
    (i: number, aspect: string) => setOverrides((o) => ({ ...o, [i]: { ...o[i], aspect } })),
    [],
  )

  const run = useCallback(
    (i: number) => {
      const c = concepts[i]
      if (!c) return
      const { model, aspect } = control(i)
      const isVideo = /video|testimonial/i.test(c.type)
      generateCreative(c, {
        imageModel: !isVideo && model !== 'auto' ? model : undefined,
        videoModel: isVideo && model !== 'auto' ? model : undefined,
        aspectRatio: aspect,
      })
    },
    [concepts, control, generateCreative],
  )

  const ad = useMemo(() => composeAd(blocks, composition), [blocks, composition])
  const copy = useCallback(() => {
    navigator.clipboard?.writeText(composedToText(ad))
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }, [ad])

  const ctxValue: FlowCtx = useMemo(
    () => ({
      conceptAt: (i: number) => concepts[i],
      control,
      setModel,
      setAspect,
      run,
      imageFor,
      videoUrlFor: (c: Concept) => {
        const v = videoFor(c)
        return v?.status === 'done' ? v.url : undefined
      },
      stateFor: (c: Concept) => {
        const cs = creativeStateFor(c)
        const v = videoFor(c)
        return {
          busy: cs?.status === 'working' || v?.status === 'rendering',
          error: cs?.status === 'error' ? cs.message || 'Failed' : v?.status === 'error' ? 'Render failed' : undefined,
        }
      },
      imageModels,
      videoModels,
      angle,
      offerName,
      composition: { ad, copy, copied },
    }),
    [
      concepts, control, setModel, setAspect, run, imageFor, videoFor, creativeStateFor,
      imageModels, videoModels, angle, offerName, ad, copy, copied,
    ],
  )

  /* ------------------------------- Graph ---------------------------------- */
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])

  // Re-seed whenever the set of media concepts changes (a new run lands).
  const seedKey = useMemo(() => media.map((m) => `${m.index}:${m.concept.type}`).join('|'), [media])
  useEffect(() => {
    const colX = 360
    const gap = 260
    const totalH = Math.max(media.length, 1) * gap
    const seededNodes: Node[] = [
      { id: 'brief', type: 'brief', position: { x: 0, y: totalH / 2 - 60 }, data: {} },
      ...media.map((m, row) => ({
        id: `media-${m.index}`,
        type: 'media',
        position: { x: colX, y: row * gap },
        data: { conceptIndex: m.index },
      })),
      { id: 'composition', type: 'composition', position: { x: colX + 360, y: totalH / 2 - 200 }, data: {} },
    ]
    const seededEdges: Edge[] = [
      ...media.map((m) => ({ id: `e-brief-${m.index}`, source: 'brief', target: `media-${m.index}` })),
      ...media.map((m) => ({ id: `e-${m.index}-comp`, source: `media-${m.index}`, target: 'composition' })),
    ]
    setNodes(seededNodes)
    setEdges(seededEdges)
  }, [seedKey, media, setNodes, setEdges])

  return (
    <FlowContext.Provider value={ctxValue}>
      <div className="tpb-flow relative h-[72vh] min-h-[520px] w-full">
        {/* Flow-level default dimensions */}
        <div className="absolute left-3 top-3 z-10 flex items-center gap-2 rounded-lg border border-white/10 bg-[#0b0f17]/90 px-2.5 py-1.5 backdrop-blur">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-white/45">Default size</span>
          <select
            value={defaultAspect}
            onChange={(e) => setDefaultAspect(e.target.value)}
            className="cursor-pointer rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-[11px] text-white/80 outline-none hover:border-white/20"
          >
            {ASPECT_OPTIONS.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label} {a.ratio}
              </option>
            ))}
          </select>
        </div>

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.2}
          maxZoom={1.5}
          proOptions={{ hideAttribution: true }}
          defaultEdgeOptions={{ animated: true, style: { stroke: 'rgb(94 168 255 / 0.45)', strokeWidth: 1.5 } }}
        >
          <Background variant={BackgroundVariant.Dots} gap={22} size={1} color="rgb(255 255 255 / 0.06)" />
          <MiniMap pannable zoomable className="!bg-[#0b0f17]" maskColor="rgb(5 8 14 / 0.7)" nodeColor="rgb(94 168 255 / 0.4)" />
          <Controls className="!border-white/10 !bg-[#0b0f17]" />
        </ReactFlow>
      </div>
    </FlowContext.Provider>
  )
}

export function CreativeFlow({
  offerName,
  angle,
  onConfigure,
}: {
  offerName?: string
  angle?: string
  onConfigure: () => void
}) {
  const { concepts } = useReactorRun()

  if (concepts.length === 0) {
    return (
      <div className="reactor-panel glass grid min-h-[460px] place-items-center p-8 text-center">
        <div className="max-w-sm">
          <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-white/[0.03]">
            <Atom size={26} className="text-glow/60" />
          </span>
          <h3 className="font-display text-base font-semibold text-white">The flow is empty</h3>
          <p className="mx-auto mt-1.5 text-sm text-white/45">
            Fire the reactor first. Every concept it generates lands here as a runnable node — pick a model and
            ad size, generate the visual, and watch it flow into the live composition.
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
      <ReactFlowProvider>
        <FlowInner offerName={offerName} angle={angle} />
      </ReactFlowProvider>
    </div>
  )
}
