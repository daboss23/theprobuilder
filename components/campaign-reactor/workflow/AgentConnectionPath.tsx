'use client'

import { useEffect, useMemo, useRef } from 'react'
import gsap from 'gsap'
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

/* ----------------------------- Tendril geometry --------------------------- */

/** Deterministic PRNG seeded from the channel id — stable across re-renders. */
function seededRandom(seed: string): () => number {
  let h = 1779033703
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    h ^= h >>> 16
    return (h >>> 0) / 4294967296
  }
}

interface CubicRefs {
  p0: Point
  c1: Point
  c2: Point
  p1: Point
}

function baseCubic(from: Point, to: Point): CubicRefs {
  const dx = to.x - from.x
  const handle = Math.max(48, Math.abs(dx) * 0.5)
  return {
    p0: from,
    c1: { x: from.x + handle, y: from.y },
    c2: { x: to.x - handle, y: to.y },
    p1: to,
  }
}

function cubicAt({ p0, c1, c2, p1 }: CubicRefs, t: number): Point {
  const u = 1 - t
  return {
    x: u * u * u * p0.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * p1.x,
    y: u * u * u * p0.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * p1.y,
  }
}

function cubicTangent({ p0, c1, c2, p1 }: CubicRefs, t: number): Point {
  const u = 1 - t
  return {
    x: 3 * u * u * (c1.x - p0.x) + 6 * u * t * (c2.x - c1.x) + 3 * t * t * (p1.x - c2.x),
    y: 3 * u * u * (c1.y - p0.y) + 6 * u * t * (c2.y - c1.y) + 3 * t * t * (p1.y - c2.y),
  }
}

/** Catmull-Rom through the sampled points → smooth cubic path string. */
function smoothPath(pts: Point[]): string {
  if (pts.length < 2) return ''
  let d = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[Math.min(pts.length - 1, i + 2)]
    const c1x = p1.x + (p2.x - p0.x) / 6
    const c1y = p1.y + (p2.y - p0.y) / 6
    const c2x = p2.x - (p3.x - p1.x) / 6
    const c2y = p2.y - (p3.y - p1.y) / 6
    d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`
  }
  return d
}

const SAMPLES = 14

/**
 * One organic filament: the base cubic displaced along its normal by a sine
 * envelope anchored at both endpoints. `phase` shifts the wave so the two
 * morph targets (A/B) breathe against each other.
 */
function filamentPath(cubic: CubicRefs, amp: number, waves: number, phase: number): string {
  const pts: Point[] = []
  for (let i = 0; i <= SAMPLES; i++) {
    const t = i / SAMPLES
    const p = cubicAt(cubic, t)
    const tan = cubicTangent(cubic, t)
    const len = Math.hypot(tan.x, tan.y) || 1
    const nx = -tan.y / len
    const ny = tan.x / len
    const offset = Math.sin(t * Math.PI * waves + phase) * amp * Math.sin(Math.PI * t)
    pts.push({ x: p.x + nx * offset, y: p.y + ny * offset })
  }
  return smoothPath(pts)
}

interface Filament {
  a: string
  b: string
  width: number
  opacity: number
  dashDur: number
}

interface HeadSpec {
  r: number
  dur: number
  start: number
}

/* -------------------------------- Component -------------------------------- */

/**
 * A living energy tendril between an agent and the OPUS core. Instead of one
 * flat wire, each channel is a braid of organic filaments displaced off the
 * convergence curve, plus an atmospheric glow underneath:
 *
 *   1. Atmospheric glow — wide, blurred colour spread for depth.
 *   2. Filament braid   — three sine-displaced strands, GSAP-morphed between
 *                         two wobble targets so the braid visibly breathes.
 *   3. Electric current — dash-offset flow driven along each active strand.
 *   4. Energy heads     — bright charges GSAP-tweened along the base curve
 *                         (direction-aware: delegation flows out, findings
 *                         flow back into the core).
 *
 * Honest-state rules hold: only the live exchange animates; complete settles
 * to a faint stable braid; dormant stays almost invisible. All tweens live in
 * a gsap.context scoped to the group and are rebuilt only when the geometry
 * or activity state changes; `paused` (tab hidden) suspends the whole context.
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
  paused = false,
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
  paused?: boolean
  direction?: ConnDirection
}) {
  const groupRef = useRef<SVGGElement | null>(null)
  const basePathRef = useRef<SVGPathElement | null>(null)
  const tweensRef = useRef<gsap.core.Tween[]>([])
  const pausedRef = useRef(paused)
  const reverse = direction === 'reverse'

  const cubic = useMemo(() => baseCubic(from, to), [from, to])
  const baseD = useMemo(() => connectionPath(from, to), [from, to])

  const { filaments, heads } = useMemo(() => {
    const rand = seededRandom(gid)
    const filaments: Filament[] = Array.from({ length: 3 }, (_, i) => {
      const amp = 3.5 + rand() * 6.5 + i * 1.5
      const waves = 1.6 + rand() * 1.8
      const phase = rand() * Math.PI * 2
      return {
        a: filamentPath(cubic, amp, waves, phase),
        b: filamentPath(cubic, amp * 0.85, waves, phase + Math.PI),
        width: i === 0 ? 1.7 : 1.1,
        opacity: i === 0 ? 0.9 : 0.55,
        dashDur: 0.8 + rand() * 0.9,
      }
    })
    const heads: HeadSpec[] = Array.from({ length: 5 }, () => ({
      r: 1.2 + rand() * 1.4,
      dur: 1.5 + rand() * 1.4,
      start: rand(),
    }))
    return { filaments, heads }
  }, [gid, cubic])

  /* GSAP: breathe the braid, drive the current, fly the charges. */
  useEffect(() => {
    const group = groupRef.current
    const basePath = basePathRef.current
    if (!group || !basePath || reduced || !active) return

    const tweens: gsap.core.Tween[] = []
    const ctx = gsap.context(() => {
      const strands = Array.from(group.querySelectorAll<SVGPathElement>('[data-strand]'))
      strands.forEach((el, i) => {
        const f = filaments[i]
        if (!f) return
        // Organic breathing between the two wobble targets.
        tweens.push(
          gsap.to(el, {
            attr: { d: f.b },
            duration: 2.2 + i * 0.5,
            ease: 'sine.inOut',
            yoyo: true,
            repeat: -1,
          }),
        )
        // Electric current riding the strand.
        tweens.push(
          gsap.to(el, {
            strokeDashoffset: reverse ? 22 : -22,
            duration: f.dashDur,
            ease: 'none',
            repeat: -1,
          }),
        )
      })

      // Bright charges travelling the base curve.
      const total = basePath.getTotalLength()
      const headEls = Array.from(group.querySelectorAll<SVGCircleElement>('[data-head]'))
      headEls.forEach((el, i) => {
        const spec = heads[i]
        if (!spec) return
        const state = { p: spec.start }
        tweens.push(
          gsap.to(state, {
            p: spec.start + 1,
            duration: spec.dur,
            ease: 'none',
            repeat: -1,
            onUpdate: () => {
              const frac = state.p % 1
              const at = reverse ? 1 - frac : frac
              const pt = basePath.getPointAtLength(total * at)
              gsap.set(el, { attr: { cx: pt.x, cy: pt.y }, opacity: Math.sin(frac * Math.PI) })
            },
          }),
        )
      })
    }, group)

    tweensRef.current = tweens
    if (pausedRef.current) tweens.forEach((t) => t.paused(true))
    return () => {
      tweensRef.current = []
      ctx.revert()
    }
  }, [active, reduced, reverse, filaments, heads])

  /* Suspend/resume this channel's motion with the tab. */
  useEffect(() => {
    pausedRef.current = paused
    tweensRef.current.forEach((t) => t.paused(paused))
  }, [paused])

  const coreOpacity = dim ? 0.12 : active ? 0.95 : complete ? 0.55 : 0.32
  const atmosOpacity = dim ? 0.04 : active ? 0.3 : complete ? 0.12 : 0.07
  const atmosWidth = active ? 20 : complete ? 9 : 6

  return (
    <g ref={groupRef}>
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
        d={baseD}
        fill="none"
        stroke={color}
        strokeWidth={atmosWidth}
        strokeLinecap="round"
        opacity={atmosOpacity}
        className="nrg-atmos"
      />

      {/* Layer 2 — base guide (also the motion rail for the energy heads) */}
      <path
        ref={basePathRef}
        d={baseD}
        fill="none"
        stroke={`url(#${gid})`}
        strokeWidth={active ? 1.6 : 1.3}
        strokeLinecap="round"
        opacity={coreOpacity * 0.7}
        className={cn(active && 'nrg-body')}
      />

      {/* Layer 3 — the filament braid */}
      {filaments.map((f, i) => (
        <path
          key={i}
          data-strand
          d={f.a}
          fill="none"
          stroke={`url(#${gid})`}
          strokeWidth={active ? f.width : f.width * 0.75}
          strokeLinecap="round"
          strokeDasharray={active && !reduced ? '7 4' : undefined}
          opacity={
            dim ? (i === 0 ? 0.1 : 0) : active ? f.opacity : complete ? f.opacity * 0.5 : f.opacity * 0.3
          }
          className="nrg-strand"
        />
      ))}

      {/* Layer 4 — travelling energy charges (live exchange only) */}
      {active &&
        !reduced &&
        heads.map((h, i) => (
          <circle key={i} data-head r={h.r} cx={from.x} cy={from.y} fill={tipColor} opacity={0} className="nrg-particle" />
        ))}
    </g>
  )
}
