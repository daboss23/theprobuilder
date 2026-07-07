import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import { accentClass, type Accent } from '@/components/reactor/ui'

/* ============================================================================
   Liquid Glass design system — reusable primitives (see DESIGN.md §5).
   Thin React wrappers over the shared `.lg-*` classes in globals.css so the
   whole app inherits one consistent liquid-glass material.
   ========================================================================== */

/* ------------------------------- GlassShell ------------------------------- */
// Full-page atmospheric wrapper. The background layers already live on <body>
// / .reactor-bg; this simply provides a positioned stage for hero content.
export function GlassShell({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('relative isolate', className)}>{children}</div>
}

/* ------------------------------- GlassPanel ------------------------------- */
// The raw frosted material with no reflection/hover — use for static surfaces.
export function GlassPanel({
  children,
  className,
  accent,
}: {
  children: ReactNode
  className?: string
  accent?: Accent
}) {
  return (
    <div className={cn('lg-panel', accent && accentClass[accent], className)}>{children}</div>
  )
}

/* ----------------------------- LiquidGlassCard ---------------------------- */
// Panel + glossy diagonal reflection + accent floor light + hover lift.
export function LiquidGlassCard({
  children,
  className,
  accent = 'cyan',
  hover = true,
}: {
  children: ReactNode
  className?: string
  accent?: Accent
  hover?: boolean
}) {
  return (
    <div className={cn('lg-panel lg-card', !hover && 'pointer-events-auto', accentClass[accent], className)}>
      {children}
    </div>
  )
}

/* -------------------------- LiquidGlassAgentCard -------------------------- */
// Agent-identity card — accent-driven rim + glow keyed to the agent colour.
export function LiquidGlassAgentCard({
  name,
  role,
  accent,
  icon,
  active,
  children,
  className,
}: {
  name: string
  role?: string
  accent: Accent
  icon?: ReactNode
  active?: boolean
  children?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn('lg-panel lg-card p-4', accentClass[accent], active && 'animate-float-soft', className)}
    >
      <div className="flex items-center gap-3">
        {icon && (
          <span className="grid h-10 w-10 place-items-center rounded-xl border border-[rgb(var(--acc)/0.5)] bg-[radial-gradient(circle_at_50%_30%,rgb(var(--acc)/0.4),rgba(5,11,22,0.9)_78%)] text-[rgb(var(--acc-hi))] shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_0_22px_-4px_rgb(var(--acc)/0.85)]">
            {icon}
          </span>
        )}
        <div className="min-w-0">
          <p className="font-display text-sm font-semibold tracking-tight text-white">{name}</p>
          {role && (
            <p className="truncate text-[11px] uppercase tracking-[0.18em] text-[rgb(var(--acc-hi))]/70">
              {role}
            </p>
          )}
        </div>
      </div>
      {children && <div className="mt-3 text-sm text-white/60">{children}</div>}
    </div>
  )
}

/* ---------------------------- LiquidGlassButton --------------------------- */
type ButtonVariant = 'primary' | 'secondary' | 'cta'
export function LiquidGlassButton({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: 'sm' | 'md' | 'lg'
}) {
  const sizes = {
    sm: 'px-3.5 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-7 py-3 text-base',
  } as const
  return (
    <button className={cn('lg-btn', `lg-btn--${variant}`, sizes[size], className)} {...props}>
      {children}
    </button>
  )
}

/* ---------------------------- LiquidGlassInput ---------------------------- */
export function LiquidGlassInput({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn('lg-input px-4 py-2.5 text-sm', className)} {...props} />
}

/* --------------------------- LiquidGlassSelect ---------------------------- */
export function LiquidGlassSelect({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn('lg-input px-4 py-2.5 text-sm', className)} {...props}>
      {children}
    </select>
  )
}

/* ---------------------- LiquidGlassBadge / NeonStatusPill ------------------ */
export function LiquidGlassBadge({
  children,
  accent = 'cyan',
  className,
}: {
  children: ReactNode
  accent?: Accent
  className?: string
}) {
  return <span className={cn('lg-badge', accentClass[accent], className)}>{children}</span>
}

export function NeonStatusPill({
  label,
  accent = 'emerald',
  live = true,
  className,
}: {
  label: string
  accent?: Accent
  live?: boolean
  className?: string
}) {
  return (
    <span className={cn('lg-badge', accentClass[accent], className)}>
      {live && <span className="lg-badge-dot" aria-hidden="true" />}
      {label}
    </span>
  )
}

/* ---------------------------- LiquidGlassTabs ----------------------------- */
export function LiquidGlassTabs<T extends string>({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: readonly { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
  className?: string
}) {
  return (
    <div className={cn('lg-tabs', className)} role="tablist">
      {tabs.map((t) => (
        <button
          key={t.value}
          type="button"
          role="tab"
          aria-selected={value === t.value}
          data-active={value === t.value}
          onClick={() => onChange(t.value)}
          className="lg-tab"
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

/* ---------------------------- LiquidGlassModal ---------------------------- */
export function LiquidGlassModal({
  open,
  onClose,
  children,
  className,
}: {
  open: boolean
  onClose: () => void
  children: ReactNode
  className?: string
}) {
  if (!open) return null
  return (
    <div className="lg-scrim grid place-items-center p-4" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className={cn('lg-panel lg-card relative z-[61] max-h-[90vh] w-full max-w-2xl overflow-auto p-6', className)}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}

/* ------------------------------ GlowDivider ------------------------------- */
export function GlowDivider({ accent, className }: { accent?: Accent; className?: string }) {
  return <hr className={cn('lg-divider', accent && accentClass[accent], className)} aria-hidden="true" />
}

/* ------------------------------ OrbitalGlow ------------------------------- */
// Rotating multi-colour glow ring — decoration behind OPUS / hero visuals.
export function OrbitalGlow({ size = 320, className }: { size?: number; className?: string }) {
  return (
    <span
      className={cn('lg-orbital', className)}
      style={{ width: size, height: size, left: '50%', top: '50%', transform: 'translate(-50%,-50%)' }}
      aria-hidden="true"
    />
  )
}
