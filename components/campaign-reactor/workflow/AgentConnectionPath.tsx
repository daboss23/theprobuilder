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
 * Discrete energy particles riding each active channel. Varied radius, speed and
 * phase keep the stream organic instead of mechanical; the negative `begin`
 * values start each particle mid-flight so the branch is populated immediately
 * rather than filling from one end.
 */
const ENERGY_PARTICLES = [
  { r: 2.2, dur: 1.9, begin: 0 },
  { r: 1.3, dur: 2.5, begin: -0.6 },
  { r: 1.8, dur: 1.6, begin: -1.0 },
  { r: 1.1, dur: 2.9, begin: -1.5 },
  { r: 2.0, dur: 2.1, begin: -0.35 },
  { r: 1.5, dur: 1.75, begin: -1.25 },
] as const

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
          {/* Soft current shimmer carried inside the channel */}
          <path
            d={d}
            fill="none"
            stroke={`url(#${gid})`}
            strokeWidth={1.6}
            strokeLinecap="round"
            strokeDasharray="6 12"
            className={cn(reverse ? 'nrg-flow-rev' : 'nrg-flow')}
          />
          {/* Discrete energy particles riding the branch toward the convergence */}
          {ENERGY_PARTICLES.map((p, i) => (
            <circle key={i} r={p.r} fill={tipColor} className="nrg-particle">
              <animateMotion
                path={d}
                dur={`${p.dur}s`}
                begin={`${p.begin}s`}
                repeatCount="indefinite"
                calcMode="linear"
                keyPoints={reverse ? '1;0' : '0;1'}
                keyTimes="0;1"
              />
            </circle>
          ))}
        </>
      )}
    </g>
  )
}
