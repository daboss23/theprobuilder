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

/**
 * A single directional connection rendered inside the workflow SVG overlay:
 * a soft halo, a colour-gradient base line, and (when live) an animated flow +
 * travelling pulse. Direction runs from → to, so the gradient and pulse always
 * read as energy moving toward the destination.
 */
export function AgentConnectionPath({
  gid,
  from,
  to,
  color,
  toColor,
  active,
  complete,
  dim,
  reduced,
}: {
  gid: string
  from: Point
  to: Point
  color: string
  toColor: string
  active: boolean
  complete: boolean
  dim: boolean
  reduced: boolean
}) {
  const d = connectionPath(from, to)
  const baseOpacity = dim ? 0.16 : active ? 0.92 : complete ? 0.6 : 0.4

  return (
    <g>
      <defs>
        <linearGradient id={gid} gradientUnits="userSpaceOnUse" x1={from.x} y1={from.y} x2={to.x} y2={to.y}>
          <stop offset="0%" stopColor={color} />
          <stop offset="100%" stopColor={toColor} />
        </linearGradient>
      </defs>

      {/* Soft halo under the line */}
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={6}
        strokeLinecap="round"
        opacity={dim ? 0.03 : active ? 0.16 : 0.07}
      />

      {/* Gradient base line */}
      <path
        d={d}
        fill="none"
        stroke={`url(#${gid})`}
        strokeWidth={1.5}
        strokeLinecap="round"
        opacity={baseOpacity}
      />

      {/* Animated flow + travelling pulse — only when genuinely active */}
      {active && !reduced && (
        <>
          <path
            d={d}
            fill="none"
            stroke={`url(#${gid})`}
            strokeWidth={1.6}
            strokeLinecap="round"
            strokeDasharray="7 11"
            className="conn-flow"
          />
          <path
            d={d}
            fill="none"
            stroke="#FFFFFF"
            strokeWidth={2.6}
            strokeLinecap="round"
            strokeDasharray="2.5 999"
            className={cn('conn-pulse')}
          />
        </>
      )}
    </g>
  )
}
