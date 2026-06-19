'use client'

import { AlertTriangle, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PhaseEntry, PhaseStatus } from '@/lib/campaign-reactor/workflow'

const NODE: Record<PhaseStatus, string> = {
  complete: 'border-success/50 bg-success/15 text-success',
  active: 'border-glow/60 bg-glow/15 text-glow phase-node--active',
  error: 'border-danger/50 bg-danger/15 text-danger',
  skipped: 'border-white/10 bg-white/[0.02] text-white/25',
  pending: 'border-white/10 bg-white/[0.02] text-white/30',
}

export function ReactorPhaseTimeline({
  phases,
  reduced,
}: {
  phases: PhaseEntry[]
  reduced: boolean
}) {
  return (
    <div className="reactor-panel glass p-4">
      <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">
        Execution Phases
      </p>
      <ol className="flex items-start gap-1 overflow-x-auto pb-1">
        {phases.map((phase, i) => (
          <li key={phase.id} className="flex min-w-[64px] flex-1 flex-col items-center">
            <div className="flex w-full items-center">
              <span className={cn('h-px flex-1', i === 0 ? 'opacity-0' : 'bg-white/10')} />
              <span
                className={cn(
                  'grid h-6 w-6 shrink-0 place-items-center rounded-full border text-[10px] font-bold',
                  NODE[phase.status],
                  phase.status === 'active' && !reduced && 'animate-pulse-glow',
                )}
              >
                {phase.status === 'complete' ? (
                  <Check size={12} />
                ) : phase.status === 'error' ? (
                  <AlertTriangle size={11} />
                ) : phase.status === 'skipped' ? (
                  <span className="text-[10px]">–</span>
                ) : (
                  i + 1
                )}
              </span>
              <span
                className={cn(
                  'h-px flex-1',
                  i === phases.length - 1 ? 'opacity-0' : 'bg-white/10',
                )}
              />
            </div>
            <span
              className={cn(
                'mt-1.5 text-center text-[9px] font-medium leading-tight',
                phase.status === 'active'
                  ? 'text-glow'
                  : phase.status === 'complete'
                    ? 'text-white/55'
                    : phase.status === 'error'
                      ? 'text-danger'
                      : 'text-white/30',
              )}
            >
              {phase.label}
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
}
