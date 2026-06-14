'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, Search, Bell } from 'lucide-react'
import { navItems } from '@/lib/nav'
import { ReactorLogo } from '@/components/reactor/ReactorLogo'
import { cn } from '@/lib/utils'

export function Topbar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const current = navItems.find((n) => n.href === pathname)
  const heading = pathname === '/' ? 'Reactor Dashboard' : current?.label ?? 'Reactor Dashboard'

  return (
    <header className="reactor-topbar sticky top-0 z-30">
      <div className="flex h-16 items-center gap-4 px-5 lg:px-8">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="topbar-control grid h-9 w-9 place-items-center rounded-xl border border-border text-white/70 lg:hidden"
          aria-label="Toggle navigation"
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>

        <Link href="/" className="lg:hidden" aria-label="TPB Creative Reactor — Dashboard">
          <ReactorLogo size="sm" />
        </Link>

        <div className="hidden items-center gap-3 lg:flex">
          {current?.system && (
            <span className="font-mono text-[11px] tracking-widest text-glow/70">
              SYSTEM {current.system}
            </span>
          )}
          <h1 className="font-display text-base font-semibold tracking-tight text-white">
            {heading}
          </h1>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <div className="topbar-control hidden w-64 items-center gap-2 rounded-xl border border-border bg-surface/50 px-3 py-2 text-sm text-white/40 md:flex">
            <Search size={15} />
            <span className="text-xs">Search intelligence…</span>
            <kbd className="ml-auto rounded bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-white/40">
              ⌘K
            </kbd>
          </div>
          <button
            type="button"
            className="topbar-control relative grid h-9 w-9 place-items-center rounded-xl border border-border text-white/60 hover:text-white"
            aria-label="Alerts"
          >
            <Bell size={16} />
            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-cyan shadow-[0_0_8px_2px_rgba(34,211,238,0.7)]" />
          </button>
          <div className="topbar-avatar grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-cyan text-xs font-bold text-white">
            TPB
          </div>
        </div>
      </div>

      {open && (
        <nav className="mobile-reactor-nav space-y-1.5 border-t border-border bg-card/95 px-3 py-3 lg:hidden">
          {navItems.map((item) => {
            const active = pathname === item.href
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  'reactor-nav-item flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm',
                  active ? 'is-active text-white' : 'text-white/60',
                )}
              >
                <span className="nav-icon-chip grid h-7 w-7 shrink-0 place-items-center rounded-lg">
                  <Icon size={15} className={active ? 'text-glow' : 'text-white/45'} />
                </span>
                {item.label}
              </Link>
            )
          })}
        </nav>
      )}
    </header>
  )
}
