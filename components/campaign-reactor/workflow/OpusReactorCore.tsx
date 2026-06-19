'use client'

import { AnimatePresence, motion } from 'motion/react'
import { cn } from '@/lib/utils'
import { OPUS_PHASE_LABEL, type OpusPhase } from '@/lib/campaign-reactor/workflow'

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

export function OpusReactorCore({
  phase,
  activeCodename,
  inputs,
  receiveSignal,
  reduced,
  coreRef,
}: {
  phase: OpusPhase
  activeCodename?: string
  inputs: number
  receiveSignal: number
  reduced: boolean
  coreRef?: (el: HTMLDivElement | null) => void
}) {
  const synthesising = phase === 'synthesising' || phase === 'evaluating' || phase === 'generating'
  const ready = phase === 'ready'
  const error = phase === 'error'

  return (
    <div className="flex flex-col items-center text-center">
      <div
        ref={coreRef}
        data-phase={phase}
        className={cn(
          'opus-core',
          synthesising && 'opus-core--synth',
          ready && 'opus-core--ready',
          error && 'opus-core--error',
          reduced && 'opus-core--static',
        )}
      >
        {/* Electric-blue outer rings */}
        <span aria-hidden className="opus-ring opus-ring--outer" />
        <span aria-hidden className="opus-ring opus-ring--mid" />
        {/* Blood-orange / red energy heart */}
        <span aria-hidden className="opus-heart" />
        <span aria-hidden className="opus-heart-core" />

        {/* Light flare each time a finding lands at the core */}
        <AnimatePresence>
          {!reduced && receiveSignal > 0 && (
            <motion.span
              key={receiveSignal}
              aria-hidden
              className="opus-flare"
              initial={{ opacity: 0.85, scale: 0.55 }}
              animate={{ opacity: 0, scale: 1.55 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
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
