import type { ReactNode } from 'react'
import Link from 'next/link'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

/* ----------------------------------------------------------------------------
   Accent channels — neon colour identities shared across the command center.
   The .acc-* classes (globals.css) expose --acc / --acc-hi to every child.
---------------------------------------------------------------------------- */

export type Accent = 'blue' | 'cyan' | 'violet' | 'emerald' | 'pink' | 'amber'

export const accentClass: Record<Accent, string> = {
  blue: 'acc-blue',
  cyan: 'acc-cyan',
  violet: 'acc-violet',
  emerald: 'acc-emerald',
  pink: 'acc-pink',
  amber: 'acc-amber',
}

/* ------------------------------- Panel ----------------------------------- */

export function Panel({
  children,
  className,
  hover,
}: {
  children: ReactNode
  className?: string
  hover?: boolean
}) {
  return (
    <div className={cn('glass reactor-panel shadow-panel', hover && 'glass-hover', className)}>
      <div className="panel-sheen" aria-hidden="true" />
      {children}
    </div>
  )
}

export function PanelHeader({
  title,
  subtitle,
  icon,
  accessory,
  accent = 'blue',
}: {
  title: string
  subtitle?: string
  icon?: ReactNode
  accessory?: ReactNode
  accent?: Accent
}) {
  return (
    <div className="panel-header flex items-start justify-between gap-3 border-b border-border px-5 py-4">
      <div className="flex items-center gap-3">
        {icon && (
          <span
            className={cn(
              'panel-icon grid h-9 w-9 place-items-center rounded-lg',
              accentClass[accent],
            )}
          >
            {icon}
          </span>
        )}
        <div>
          <h2 className="font-display text-sm font-semibold tracking-tight text-white">{title}</h2>
          {subtitle && <p className="text-xs text-white/40">{subtitle}</p>}
        </div>
      </div>
      {accessory}
    </div>
  )
}

export function PanelFooterLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="panel-footer-btn">
      {children}
      <ChevronRight size={13} />
    </Link>
  )
}

/* ------------------------------ Page header ------------------------------- */

export function PageHeader({
  system,
  title,
  subtitle,
  tagline,
}: {
  system?: string
  title: string
  subtitle: string
  tagline?: string
}) {
  return (
    <div className="animate-fade-up">
      {system && (
        <span className="font-mono text-[11px] tracking-[0.3em] text-glow/70">
          INTELLIGENCE SYSTEM {system}
        </span>
      )}
      <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-white md:text-3xl">
        {title}
      </h1>
      <p className="mt-1 max-w-2xl text-sm text-white/50">{subtitle}</p>
      {tagline && (
        <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.28em] text-white/30">
          {tagline}
        </p>
      )}
    </div>
  )
}

/* -------------------------------- Trend ----------------------------------- */

export function TrendBadge({
  trend,
  value,
}: {
  trend: 'up' | 'down' | 'flat'
  value: string
}) {
  const map = {
    up: { Icon: TrendingUp, cls: 'text-emerald bg-emerald/10' },
    down: { Icon: TrendingDown, cls: 'text-danger bg-danger/10' },
    flat: { Icon: Minus, cls: 'text-white/40 bg-white/5' },
  } as const
  const { Icon, cls } = map[trend]
  return (
    <span
      className={cn(
        'trend-badge inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium tabular',
        cls,
      )}
    >
      <Icon size={12} />
      {value}
    </span>
  )
}

/* ------------------------------- KPI card --------------------------------- */

const sparkPaths = [
  'M1 26L11 23L20 25L30 17L39 21L49 12L60 18L71 15L81 16L92 6L101 13L111 9',
  'M1 24L11 26L20 19L30 22L39 14L49 17L60 10L71 14L81 9L92 12L101 6L111 10',
  'M1 27L11 22L20 24L30 18L39 20L49 15L60 17L71 11L81 14L92 8L101 11L111 5',
] as const

function Sparkline({ seed }: { seed: number }) {
  const d = sparkPaths[seed % sparkPaths.length]
  return (
    <svg aria-hidden="true" className="kpi-sparkline" viewBox="0 0 112 32">
      <path d={`${d}V32H1Z`} fill="currentColor" className="opacity-15" stroke="none" />
      <path
        d={d}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
    </svg>
  )
}

export function KpiCard({
  label,
  value,
  delta,
  trend,
  accent = 'blue',
  icon: Icon = Activity,
}: {
  label: string
  value: number
  delta: string
  trend: 'up' | 'down' | 'flat'
  accent?: Accent
  icon?: LucideIcon
}) {
  const TrendIcon = trend === 'down' ? TrendingDown : trend === 'flat' ? Minus : TrendingUp
  return (
    <div className={cn('kpi-card group p-4', accentClass[accent])}>
      <div className="kpi-bloom" aria-hidden="true" />
      <div className="kpi-scanline" aria-hidden="true" />
      <div className="relative flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3">
          <span className="kpi-icon">
            <Icon size={20} />
          </span>
          <p className="truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-white/60">
            {label}
          </p>
        </div>
        <span className="accent-chip tabular">
          <TrendIcon size={12} />
          {delta.replace('+', '')}
        </span>
      </div>
      <span className="relative mt-3 block font-display text-[2.1rem] font-bold leading-none tabular text-white drop-shadow-[0_1px_10px_rgba(0,0,0,0.5)]">
        {value.toLocaleString()}
      </span>
      <Sparkline seed={label.length + value} />
    </div>
  )
}

/* ------------------------------ Progress bar ------------------------------ */

export function ProgressBar({ value, max = 100 }: { value: number; max?: number }) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  return (
    <div className="progress-track h-1.5 w-full overflow-hidden rounded-full bg-white/5">
      <div
        className="h-full rounded-full bg-gradient-to-r from-primary via-glow to-cyan"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

/* ------------------------------ Radial gauge ------------------------------ */

export function RadialGauge({
  value,
  accent = 'blue',
  size = 64,
  stroke = 5,
}: {
  value: number
  accent?: Accent
  size?: number
  stroke?: number
}) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c * (1 - Math.min(100, Math.max(0, value)) / 100)
  return (
    <span className={cn('gauge-wrap shrink-0', accentClass[accent])}>
      <svg
        className="gauge-svg"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-hidden="true"
      >
        <circle
          className="gauge-track"
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
        />
        <circle
          className="gauge-bar"
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="gauge-value font-display text-[13px] font-bold">{value}%</span>
    </span>
  )
}

/* --------------------------------- Pill ----------------------------------- */

export function Pill({
  children,
  tone = 'default',
}: {
  children: ReactNode
  tone?: 'default' | 'primary' | 'success' | 'warning' | 'danger'
}) {
  const tones = {
    default: 'border-border bg-surface/60 text-white/60',
    primary: 'border-primary/30 bg-primary/10 text-glow',
    success: 'border-success/30 bg-success/10 text-success',
    warning: 'border-warning/30 bg-warning/10 text-warning',
    danger: 'border-danger/30 bg-danger/10 text-danger',
  } as const
  return (
    <span
      className={cn(
        'reactor-pill inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium',
        tones[tone],
      )}
    >
      {children}
    </span>
  )
}
