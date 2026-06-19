'use client'

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, useReducedMotion } from 'motion/react'
import { AlertTriangle, FlaskConical, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { accentClass } from '@/components/reactor/ui'
import { INTELLIGENCE, INTELLIGENCE_IDS, type IntelligenceId } from '@/lib/agents'
import { useReactorRun, type Concept } from '@/components/campaign-reactor/ReactorRunContext'
import type { Verdict } from '@/lib/outcomes'
import { ACTIVE_STATUSES, derivePhases } from '@/lib/campaign-reactor/workflow'
import { AGENT_VISUAL, OPUS_CORE, OPUS_OUTPUT_STROKE } from './visuals'
import { AgentIntelligenceCard } from './AgentIntelligenceCard'
import { OpusReactorCore } from './OpusReactorCore'
import { AgentConnectionPath, type Point } from './AgentConnectionPath'
import { IntelligencePacket } from './IntelligencePacket'
import { EmergingStrategyPanel } from './EmergingStrategyPanel'
import { ReactorPhaseTimeline } from './ReactorPhaseTimeline'
import { TechnicalTelemetryDrawer } from './TechnicalTelemetryDrawer'
import { ConceptResultCard } from './ConceptResultCard'

export interface WorkflowControls {
  angle: string
  isVideoConcept: (c: Concept) => boolean
  hasRefs: boolean
  faceCount: number
  refVideoCount: number
  copied: string | null
  verdictOptions: { value: Verdict; label: string }[]
  onCopy: (text: string) => void
  onGenerateCreative: (c: Concept) => void
  onAnimate: (c: Concept, image: string) => void
  onGenerateUGC: (c: Concept) => void
  onMarkOutcome: (c: Concept, verdict: Verdict) => void
  onRetry: () => void
}

interface Geo {
  w: number
  h: number
  agents: Partial<Record<IntelligenceId, Point>>
  opusIn: Point
  opusOut: Point
  out: Point
}

interface Flying {
  id: number
  from: Point
  to: Point
  label: string
  colorClass?: string
  opus?: boolean
}

export function LiveAgentWorkflow(controls: WorkflowControls) {
  const {
    workflow,
    concepts,
    telemetry,
    phase,
    error,
    imageFor,
    imageMetaFor,
    videoFor,
    creativeStateFor,
    logged,
  } = useReactorRun()

  const prefersReduced = useReducedMotion()
  const reduced = prefersReduced ?? false

  /* ----------------------------- Responsiveness ---------------------------- */
  const [isDesktop, setIsDesktop] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const update = () => setIsDesktop(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  /* ------------------------------ Measurement ------------------------------ */
  const stageRef = useRef<HTMLDivElement | null>(null)
  const opusRef = useRef<HTMLDivElement | null>(null)
  const outputRef = useRef<HTMLDivElement | null>(null)
  const agentEls = useRef<Partial<Record<IntelligenceId, HTMLDivElement | null>>>({})
  const setAgentEl = useCallback(
    (id: IntelligenceId) => (el: HTMLDivElement | null) => {
      agentEls.current[id] = el
    },
    [],
  )
  const [geo, setGeo] = useState<Geo | null>(null)

  const measure = useCallback(() => {
    const stage = stageRef.current
    if (!stage || !isDesktop) {
      setGeo(null)
      return
    }
    const sr = stage.getBoundingClientRect()
    const agents: Partial<Record<IntelligenceId, Point>> = {}
    for (const id of INTELLIGENCE_IDS) {
      const el = agentEls.current[id]
      if (el) {
        const r = el.getBoundingClientRect()
        agents[id] = { x: r.right - sr.left, y: r.top + r.height / 2 - sr.top }
      }
    }
    let opusIn: Point = { x: sr.width / 2, y: sr.height / 2 }
    let opusOut: Point = opusIn
    if (opusRef.current) {
      const r = opusRef.current.getBoundingClientRect()
      const cy = r.top + r.height / 2 - sr.top
      opusIn = { x: r.left - sr.left, y: cy }
      opusOut = { x: r.right - sr.left, y: cy }
    }
    let out: Point = { x: sr.width, y: sr.height / 2 }
    if (outputRef.current) {
      const r = outputRef.current.getBoundingClientRect()
      out = { x: r.left - sr.left, y: r.top - sr.top + 44 }
    }
    setGeo({ w: sr.width, h: sr.height, agents, opusIn, opusOut, out })
  }, [isDesktop])

  // Recompute when layout-affecting state changes (statuses, phase, concept count).
  const layoutSig = useMemo(
    () =>
      INTELLIGENCE_IDS.map((id) => workflow.agents[id].status).join('|') +
      workflow.opusPhase +
      concepts.length +
      (isDesktop ? 'd' : 'm'),
    [workflow.agents, workflow.opusPhase, concepts.length, isDesktop],
  )
  useLayoutEffect(() => {
    measure()
  }, [measure, layoutSig])

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    const ro = new ResizeObserver(() => measure())
    ro.observe(stage)
    window.addEventListener('resize', measure)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [measure])

  /* ----------------------------- Flying packets ---------------------------- */
  const [flying, setFlying] = useState<Flying[]>([])
  const seenRef = useRef(0)

  // New run resets the packet log to empty — clear in-flight + the cursor.
  useEffect(() => {
    if (workflow.packets.length === 0) {
      seenRef.current = 0
      setFlying([])
    }
  }, [workflow.packets.length])

  useEffect(() => {
    const all = workflow.packets
    if (all.length <= seenRef.current) return
    const fresh = all.slice(seenRef.current)
    seenRef.current = all.length
    if (!geo || reduced || !isDesktop) return
    const add: Flying[] = []
    for (const p of fresh) {
      if (p.from === 'opus') {
        add.push({ id: p.id, from: geo.opusOut, to: geo.out, label: p.label, opus: true })
      } else {
        const from = geo.agents[p.from]
        if (from) {
          add.push({
            id: p.id,
            from,
            to: geo.opusIn,
            label: p.label,
            colorClass: accentClass[AGENT_VISUAL[p.from].accent],
          })
        }
      }
    }
    if (add.length) setFlying((f) => [...f, ...add])
  }, [workflow.packets, geo, reduced, isDesktop])

  const removeFlying = useCallback((id: number) => {
    setFlying((f) => f.filter((x) => x.id !== id))
  }, [])

  /* -------------------------------- Derived -------------------------------- */
  const phases = useMemo(() => derivePhases(workflow), [workflow])
  const activeCodename = workflow.activeAgent ? INTELLIGENCE[workflow.activeAgent].codename : undefined
  const opusProps = {
    phase: workflow.opusPhase,
    activeCodename,
    inputs: workflow.receiveCount,
    receiveSignal: workflow.receiveCount,
    reduced,
  }
  const runError = workflow.error || error

  /* ------------------------------- Renderers ------------------------------- */
  const renderAgents = (withRefs: boolean) =>
    INTELLIGENCE_IDS.map((id) => (
      <AgentIntelligenceCard
        key={id}
        id={id}
        agent={workflow.agents[id]}
        reduced={reduced}
        cardRef={withRefs ? setAgentEl(id) : undefined}
      />
    ))

  const conceptsBlock =
    concepts.length > 0 ? (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <h3 className="font-display text-xs font-bold uppercase tracking-[0.18em] text-white">
            Generated Concepts
          </h3>
          <span className="rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success">
            {concepts.length}
          </span>
        </div>
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          {concepts.map((c, i) => (
            <ConceptResultCard
              key={`${c.type}-${i}`}
              concept={c}
              index={i}
              image={imageFor(c)}
              imageMeta={imageMetaFor(c)}
              video={videoFor(c)}
              creativeState={creativeStateFor(c)}
              wantsVideo={controls.isVideoConcept(c)}
              hasRefs={controls.hasRefs}
              faceCount={controls.faceCount}
              refVideoCount={controls.refVideoCount}
              copied={controls.copied === c.text}
              logged={logged.has(c.text)}
              verdictOptions={controls.verdictOptions}
              onCopy={() => controls.onCopy(c.text)}
              onGenerateCreative={() => controls.onGenerateCreative(c)}
              onAnimate={(img) => controls.onAnimate(c, img)}
              onGenerateUGC={() => controls.onGenerateUGC(c)}
              onMarkOutcome={(v) => controls.onMarkOutcome(c, v)}
            />
          ))}
        </div>
      </div>
    ) : null

  return (
    <div className="space-y-5">
      {/* Status header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-glow/70">
            Live Agent Workflow
          </span>
          {workflow.demo && (
            <span className="inline-flex items-center gap-1 rounded-full border border-warning/35 bg-warning/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-warning">
              <FlaskConical size={10} /> Demo Intelligence Run
            </span>
          )}
        </div>
        {phase === 'firing' && !runError && (
          <span className="flex items-center gap-1.5 text-[11px] text-white/45">
            <span className="h-1.5 w-1.5 rounded-full bg-glow animate-pulse-glow" />
            Reactor operating
          </span>
        )}
      </div>

      {runError && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-danger/30 bg-danger/[0.06] p-3">
          <div className="flex items-start gap-2 text-sm text-danger">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">{runError}</p>
              <p className="text-[11px] text-danger/70">
                Completed intelligence is preserved above. Technical details are in the telemetry
                drawer.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={controls.onRetry}
            className="inline-flex items-center gap-1.5 rounded-full border border-danger/40 bg-danger/10 px-3 py-1.5 text-[11px] font-semibold text-danger hover:bg-danger/20"
          >
            <RotateCcw size={12} /> Retry Reactor
          </button>
        </div>
      )}

      {/* ------------------------------- Desktop ------------------------------ */}
      {isDesktop ? (
        <div className="reactor-panel glass p-6 xl:p-8">
          <div ref={stageRef} className="relative">
            {geo && (
              <svg
                className="pointer-events-none absolute inset-0 h-full w-full"
                viewBox={`0 0 ${geo.w} ${geo.h}`}
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                {INTELLIGENCE_IDS.map((id) => {
                  const from = geo.agents[id]
                  if (!from) return null
                  const status = workflow.agents[id].status
                  return (
                    <AgentConnectionPath
                      key={id}
                      gid={`conn-${id}`}
                      from={from}
                      to={geo.opusIn}
                      color={AGENT_VISUAL[id].stroke}
                      toColor={OPUS_CORE}
                      active={ACTIVE_STATUSES.includes(status)}
                      complete={status === 'complete'}
                      dim={status === 'dormant' || status === 'notRequired' || status === 'queued'}
                      reduced={reduced}
                    />
                  )
                })}
                <AgentConnectionPath
                  gid="conn-output"
                  from={geo.opusOut}
                  to={geo.out}
                  color={OPUS_CORE}
                  toColor={OPUS_OUTPUT_STROKE}
                  active={workflow.opusPhase === 'generating'}
                  complete={workflow.opusPhase === 'ready'}
                  dim={!workflow.generationStarted && workflow.opusPhase !== 'ready'}
                  reduced={reduced}
                />
              </svg>
            )}

            <div className="relative grid grid-cols-[minmax(0,290px)_minmax(0,1fr)_minmax(0,380px)] items-center gap-8 xl:gap-10">
              <div className="space-y-3">{renderAgents(true)}</div>
              <div className="flex justify-center">
                <OpusReactorCore
                  {...opusProps}
                  coreRef={(el) => {
                    opusRef.current = el
                  }}
                />
              </div>
              <div ref={outputRef}>
                <EmergingStrategyPanel workflow={workflow} conceptCount={concepts.length} />
              </div>
            </div>

            {/* Flying intelligence packets (desktop, motion enabled) */}
            {!reduced && (
              <div className="pointer-events-none absolute inset-0 overflow-visible">
                <AnimatePresence>
                  {flying.map((p) => (
                    <IntelligencePacket
                      key={p.id}
                      from={p.from}
                      to={p.to}
                      label={p.label}
                      colorClass={p.colorClass}
                      opus={p.opus}
                      onDone={() => removeFlying(p.id)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* --------------------------- Tablet / Mobile -------------------------- */
        <div className="reactor-panel glass space-y-5 p-4 sm:p-6">
          <div className="flex justify-center py-2">
            <OpusReactorCore {...opusProps} />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{renderAgents(false)}</div>
          <EmergingStrategyPanel workflow={workflow} conceptCount={concepts.length} />
        </div>
      )}

      {/* Generated concepts (full width, below the network) */}
      {conceptsBlock}

      {/* Execution phases + raw telemetry */}
      <ReactorPhaseTimeline phases={phases} reduced={reduced} />
      <TechnicalTelemetryDrawer telemetry={telemetry} firing={phase === 'firing'} />
    </div>
  )
}
