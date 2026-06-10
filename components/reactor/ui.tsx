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
    <div className={cn('glass shadow-panel', hover && 'glass-hover', className)}>
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
}: {
  title: string
  subtitle?: string
  icon?: ReactNode
  accessory?: ReactNode
}) {
  return (
    <div className="panel-header flex items-start justify-between gap-3 border-b border-border px-5 py-4">
      <div className="flex items-center gap-3">
        {icon && (
          <span className="panel-icon grid h-9 w-9 place-items-center rounded-lg border border-border bg-surface/60 text-glow">
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

// Restrained channel tints for the dashboard's performance telemetry modules.
export type KpiTint = 'blue' | 'green' | 'purple' | 'teal' | 'amber' | 'rose'

const kpiTints: Record<KpiTint, { wash: string; ring: string; glow: string }> = {
  blue: {
    wash: 'linear-gradient(150deg, rgba(86,140,255,0.22), rgba(46,168,255,0.06) 55%, rgba(11,15,23,0.35))',
    ring: 'rgba(120,160,255,0.28)',
    glow: 'rgba(86,140,255,0.45)',
  },
  green: {
    wash: 'linear-gradient(150deg, rgba(74,222,170,0.20), rgba(32,201,151,0.05) 55%, rgba(11,15,23,0.35))',
    ring: 'rgba(96,224,184,0.26)',
    glow: 'rgba(74,222,170,0.4)',
  },
  purple: {
    wash: 'linear-gradient(150deg, rgba(168,142,255,0.22), rgba(140,120,240,0.05) 55%, rgba(11,15,23,0.35))',
    ring: 'rgba(176,150,255,0.28)',
    glow: 'rgba(168,142,255,0.42)',
  },
  teal: {
    wash: 'linear-gradient(150deg, rgba(94,224,234,0.20), rgba(0,212,255,0.05) 55%, rgba(11,15,23,0.35))',
    ring: 'rgba(120,226,236,0.26)',
    glow: 'rgba(94,224,234,0.4)',
  },
  amber: {
    wash: 'linear-gradient(150deg, rgba(255,196,112,0.20), rgba(255,176,32,0.05) 55%, rgba(11,15,23,0.35))',
    ring: 'rgba(255,202,130,0.26)',
    glow: 'rgba(255,196,112,0.4)',
  },
  rose: {
    wash: 'linear-gradient(150deg, rgba(255,138,170,0.20), rgba(255,77,128,0.05) 55%, rgba(11,15,23,0.35))',
    ring: 'rgba(255,158,184,0.26)',
    glow: 'rgba(255,138,170,0.4)',
  },
}

export function KpiCard({
  label,
  value,
  delta,
  trend,
  tint = 'blue',
}: {
  label: string
  value: number
  delta: string
  trend: 'up' | 'down' | 'flat'
  tint?: KpiTint
}) {
  const t = kpiTints[tint]
  return (
    <div
      className="kpi-instrument group relative overflow-hidden rounded-2xl p-4 backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5"
      style={{
        background: t.wash,
        boxShadow: `inset 0 1px 0 0 rgba(255,255,255,0.10), inset 0 0 0 1px ${t.ring}, 0 18px 40px -24px rgba(0,0,0,0.85)`,
      }}
    >
      {/* soft top sheen + corner bloom */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/30" />
      <div
        className="pointer-events-none absolute -right-8 -top-10 h-24 w-24 rounded-full blur-2xl transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: t.glow, opacity: 0.5 }}
      />
      <div className="kpi-scanline" aria-hidden="true" />
      <p className="relative text-[11px] font-medium uppercase tracking-wider text-white/55">
        {label}
      </p>
      <div className="relative mt-2 flex items-end justify-between">
        <span className="font-display text-3xl font-bold tabular text-white drop-shadow-[0_1px_8px_rgba(0,0,0,0.4)]">
          {value.toLocaleString()}
        </span>
        <TrendBadge trend={trend} value={delta} />
      </div>
    </div>
  )
}

/* ------------------------------ Progress bar ------------------------------ */

export function ProgressBar({ value, max = 100 }: { value: number; max?: number }) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  return (
    <div className="progress-track h-1.5 w-full overflow-hidden rounded-full bg-white/5">
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
