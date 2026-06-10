import type { ReactNode } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

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
    <div className={cn('glass shadow-panel', hover && 'glass-hover', className)}>{children}</div>
  )
}

export function PanelHeader({
  title,
  subtitle,
  icon,
  accessory,
}: {
  title: string
  subtitle?: string
  icon?: ReactNode
  accessory?: ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
      <div className="flex items-center gap-3">
        {icon && (
          <span className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-surface/60 text-glow">
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
        <p className="mt-2 font-mono text-[11px] uppercase tracking-widest text-white/30">
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
    up: { Icon: TrendingUp, cls: 'text-success bg-success/10' },
    down: { Icon: TrendingDown, cls: 'text-danger bg-danger/10' },
    flat: { Icon: Minus, cls: 'text-white/40 bg-white/5' },
  } as const
  const { Icon, cls } = map[trend]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium tabular',
        cls,
      )}
    >
      <Icon size={12} />
      {value}
    </span>
  )
}

/* ------------------------------- KPI card --------------------------------- */

export function KpiCard({
  label,
  value,
  delta,
  trend,
}: {
  label: string
  value: number
  delta: string
  trend: 'up' | 'down' | 'flat'
}) {
  return (
    <Panel hover className="relative overflow-hidden p-4">
      <div className="pointer-events-none absolute -right-6 -top-8 h-20 w-20 rounded-full bg-primary/10 blur-2xl" />
      <p className="text-[11px] font-medium uppercase tracking-wider text-white/40">{label}</p>
      <div className="mt-2 flex items-end justify-between">
        <span className="font-display text-3xl font-bold tabular text-white">
          {value.toLocaleString()}
        </span>
        <TrendBadge trend={trend} value={delta} />
      </div>
    </Panel>
  )
}

/* ------------------------------ Progress bar ------------------------------ */

export function ProgressBar({ value, max = 100 }: { value: number; max?: number }) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
      <div
        className="h-full rounded-full bg-gradient-to-r from-primary to-cyan shadow-[0_0_12px_0_rgba(46,168,255,0.6)]"
        style={{ width: `${pct}%` }}
      />
    </div>
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
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium',
        tones[tone],
      )}
    >
      {children}
    </span>
  )
}
