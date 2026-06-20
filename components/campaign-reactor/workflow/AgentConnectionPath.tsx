'use client'

import { cn } from '@/lib/utils'

export interface Point {
  x: number
  y: number
}

/** Smooth horizontal-handled cubic between two anchors (convergence curve). */
export function connectionPath(from: Point, to: Point): string {
  const dx = to.x - from.x
  const handle = Math.max(48, Math.abs(dx) * 0.5)
  return `M ${from.x} ${from.y} C ${from.x + handle} ${from.y}, ${to.x - handle} ${to.y}, ${to.x} ${to.y}`
}

export type ConnDirection = 'forward' | 'reverse'

/**
 * A single directional energy channel rendered inside the workflow SVG overlay.
 * Four stacked layers create depth instead of a flat coloured wire:
 *
 *   1. Atmospheric glow — wide, blurred, low-opacity colour spread for depth.
 *   2. Energy body      — medium gradient stroke with a soft internal glow.
 *   3. Sharp core       — crisp, high-contrast centre line, agent-coloured.
 *   4. Travelling energy — a flow shimmer plus a low-count particle stream.
 *
 * `direction` controls which way the energy travels:
 *   forward = from → to  (agent → OPUS: intelligence returned)
 *   reverse = to → from  (OPUS → agent: delegation / activation request)
 *
 * Only the active connection animates; completed paths settle to a faint stable
 * glow and dormant paths stay almost invisible. The gradient warms toward OPUS
 * so every channel converges into the core without losing its agent identity.
 */
export function AgentConnectionPath({
  gid,
  from,
  to,
  color,
  toColor,
  tipColor = '#FFF1E6',
  active,
  complete,
  dim,
  reduced,
  direction = 'forward',
}: {
  gid: string
  from: Point
  to: Point
  color: string
  toColor: string
  tipColor?: string
  active: boolean
  complete: boolean
  dim: boolean
  reduced: boolean
  direction?: ConnDirection
}) {
  const d = connectionPath(from, to)
  const reverse = direction === 'reverse'

  const coreOpacity = dim ? 0.12 : active ? 0.95 : complete ? 0.55 : 0.32
  const bodyOpacity = dim ? 0.1 : active ? 0.8 : complete ? 0.4 : 0.22
  const bodyWidth = active ? 5 : complete ? 3 : 2
  const atmosOpacity = dim ? 0.04 : active ? 0.28 : complete ? 0.12 : 0.07
  const atmosWidth = active ? 18 : complete ? 9 : 6

  return (
    <g>
      <defs>
        <linearGradient
          id={gid}
          gradientUnits="userSpaceOnUse"
          x1={from.x}
          y1={from.y}
          x2={to.x}
          y2={to.y}
        >
          <stop offset="0%" stopColor={color} />
          <stop offset="52%" stopColor={color} />
          <stop offset="86%" stopColor={toColor} />
          <stop offset="100%" stopColor={tipColor} />
        </linearGradient>
      </defs>

      {/* Layer 1 — atmospheric glow */}
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={atmosWidth}
        strokeLinecap="round"
        opacity={atmosOpacity}
        className="nrg-atmos"
      />

      {/* Layer 2 — energy body */}
      <path
        d={d}
        fill="none"
        stroke={`url(#${gid})`}
        strokeWidth={bodyWidth}
        strokeLinecap="round"
        opacity={bodyOpacity}
        className="nrg-body"
      />

      {/* Layer 3 — sharp core */}
      <path
        d={d}
        fill="none"
        stroke={`url(#${gid})`}
        strokeWidth={active ? 2 : 1.4}
        strokeLinecap="round"
        opacity={coreOpacity}
      />

      {/* Layer 4 — travelling energy (only on the live exchange) */}
      {active && !reduced && (
        <>
          <path
            d={d}
            fill="none"
            stroke={`url(#${gid})`}
            strokeWidth={1.6}
            strokeLinecap="round"
            strokeDasharray="6 12"
            className={cn(reverse ? 'nrg-flow-rev' : 'nrg-flow')}
          />
          <path
            d={d}
            fill="none"
            stroke={tipColor}
            strokeWidth={3}
            strokeLinecap="round"
            strokeDasharray="2.6 40"
            className={cn(reverse ? 'nrg-stream-rev' : 'nrg-stream')}
          />
        </>
      )}
    </g>
  )
}
