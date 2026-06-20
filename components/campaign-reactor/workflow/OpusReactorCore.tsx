'use client'

import { AnimatePresence, motion } from 'motion/react'
import { cn } from '@/lib/utils'
import { accentClass, type Accent } from '@/components/reactor/ui'
import { OPUS_PHASE_LABEL, type OpusPhase } from '@/lib/campaign-reactor/workflow'

/** One ring segment per intelligence layer — lights when that layer reports. */
export interface OpusSegment {
  accent: Accent
  lit: boolean
}

/** A deliberate, honest sub-line for the core's current operation. */
function actionFor(phase: OpusPhase, activeCodename?: string): string {
  switch (phase) {
    case 'initialising':
      return 'Bringing the intelligence network online'
    case 'delegating':
      return activeCodename ? `Consulting ${activeCodename}` : 'Delegating to the intelligence network'
    case 'receiving':
      return 'Integrating returned intelligence'
    case 'synthesising':
      return 'Synthesising strategy from evidence'
    case 'evaluating':
      return 'Scoring concepts against learnings'
    case 'generating':
      return 'Producing launch-ready creative'
    case 'ready':
      return 'Campaign intelligence ready'
    case 'error':
      return 'Run halted'
    default:
      return 'Standing by'
  }
}

/* ---- Static ring geometry (viewBox 0 0 200 200, centred on 100,100) ------- */

const SEG_R = 86
const SEG_C = 2 * Math.PI * SEG_R
const SEG_ARC = ((360 / 5 - 16) / 360) * SEG_C // five slots, 16° gap each
const FIELD_R = 96
const FIELD_C = 2 * Math.PI * FIELD_R

// Etched radial marks on the structural ring.
const TICKS = Array.from({ length: 48 }, (_, i) => {
  const a = (i / 48) * Math.PI * 2
  return {
    key: i,
    x1: 100 + Math.cos(a) * 72,
    y1: 100 + Math.sin(a) * 72,
    x2: 100 + Math.cos(a) * (i % 4 === 0 ? 65.5 : 67.5),
    y2: 100 + Math.sin(a) * (i % 4 === 0 ? 65.5 : 67.5),
  }
})

export function OpusReactorCore({
  phase,
  activeCodename,
  inputs,
  receiveSignal,
  reduced,
  coreRef,
  segments = [],
}: {
  phase: OpusPhase
  activeCodename?: string
  inputs: number
  receiveSignal: number
  reduced: boolean
  coreRef?: (el: HTMLDivElement | null) => void
  segments?: OpusSegment[]
}) {
  const synthesising = phase === 'synthesising' || phase === 'evaluating' || phase === 'generating'
  const ready = phase === 'ready'
  const error = phase === 'error'
  const delegating = phase === 'delegating'
  const receiving = phase === 'receiving'

  return (
    <div className="flex flex-col items-center text-center">
      <div
        ref={coreRef}
        data-phase={phase}
        className={cn(
          'opus-core',
          synthesising && 'opus-core--synth',
          receiving && 'opus-core--recv',
          ready && 'opus-core--ready',
          error && 'opus-core--error',
          reduced && 'opus-core--static',
        )}
      >
        {/* ---- Concentric ring system (SVG) ---- */}
        <svg className="opus-rings" viewBox="0 0 200 200" aria-hidden="true">
          {/* Outer intelligence field + slow rotating highlight */}
          <circle cx="100" cy="100" r={FIELD_R} className="opus-field" fill="none" />
          {!reduced && (
            <g className="opus-field-rot">
              <circle
                cx="100"
                cy="100"
                r={FIELD_R}
                className="opus-field-arc"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${FIELD_C * 0.14} ${FIELD_C}`}
              />
            </g>
          )}

          {/* Structural ring + etched radial marks */}
          <circle cx="100" cy="100" r="69.5" className="opus-struct" fill="none" />
          <g className="opus-ticks">
            {TICKS.map((t) => (
              <line key={t.key} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} />
            ))}
          </g>

          {/* One segment per intelligence layer — lights as each reports */}
          <g className="opus-segs">
            {segments.map((s, i) => (
              <g
                key={i}
                className={cn('opus-seg', accentClass[s.accent], s.lit && 'opus-seg--lit')}
                transform={`rotate(${-90 + i * 72} 100 100)`}
              >
                <circle
                  cx="100"
                  cy="100"
                  r={SEG_R}
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${SEG_ARC} ${SEG_C - SEG_ARC}`}
                />
              </g>
            ))}
          </g>
        </svg>

        {/* ---- Energy chamber + central core (CSS layers) ---- */}
        <span aria-hidden className="opus-chamber" />
        <span aria-hidden className="opus-heart" />
        <span aria-hidden className="opus-heart-core" />
        <span aria-hidden className="opus-hotspot" />

        {/* Delegating — thin outward pulses toward the agents */}
        {delegating && !reduced && (
          <>
            <span aria-hidden className="opus-emit" />
            <span aria-hidden className="opus-emit opus-emit--2" />
          </>
        )}

        {/* Receiving — a soft flare each time a finding lands at the core */}
        <AnimatePresence>
          {!reduced && receiveSignal > 0 && (
            <motion.span
              key={receiveSignal}
              aria-hidden
              className="opus-flare"
              initial={{ opacity: 0.85, scale: 0.55 }}
              animate={{ opacity: 0, scale: 1.5 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          )}
        </AnimatePresence>

        {/* Campaign Ready — one short controlled ignition pulse */}
        <AnimatePresence>
          {ready && !reduced && (
            <motion.span
              key="ignition"
              aria-hidden
              className="opus-ignition"
              initial={{ opacity: 0.7, scale: 0.4 }}
              animate={{ opacity: 0, scale: 1.7 }}
              transition={{ duration: 0.85, ease: 'easeOut' }}
            />
          )}
        </AnimatePresence>

        <div className="opus-label">
          <p className="font-display text-xl font-black tracking-[0.18em] text-white drop-shadow-[0_1px_8px_rgba(0,0,0,0.6)]">
            OPUS
          </p>
          <p className="text-[8.5px] font-semibold uppercase tracking-[0.28em] text-amber-100/80">
            Master Strategist
          </p>
        </div>
      </div>

      <div className="mt-4 max-w-[15rem]">
        <motion.p
          key={phase}
          initial={reduced ? false : { opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className={cn(
            'font-display text-xs font-bold uppercase tracking-[0.16em]',
            error ? 'text-danger' : ready ? 'text-success' : 'text-[#FFB68A]',
          )}
        >
          {OPUS_PHASE_LABEL[phase]}
        </motion.p>
        <p className="mt-1 text-[11px] leading-snug text-white/45">{actionFor(phase, activeCodename)}</p>
        {inputs > 0 && (
          <p className="mt-1.5 font-mono text-[10px] uppercase tracking-wider text-white/35">
            {inputs} intelligence input{inputs === 1 ? '' : 's'} received
          </p>
        )}
      </div>
    </div>
  )
}
