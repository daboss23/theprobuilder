'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Atom, Radar, Sparkles, Type, ChevronRight, type LucideIcon } from 'lucide-react'
import { navItems, orchestratorAgent, sidebarAgents, type SidebarAgent } from '@/lib/nav'
import { ReactorLogo } from '@/components/reactor/ReactorLogo'
import { accentClass } from '@/components/reactor/ui'
import { cn } from '@/lib/utils'

const agentIcons: Record<string, LucideIcon> = {
  OPUS: Atom,
  NOVA: Radar,
  SPARK: Sparkles,
  ECHO: Type,
}

function AgentRow({ agent }: { agent: SidebarAgent }) {
  const Icon = agentIcons[agent.name] ?? Atom
  return (
    <div className="flex items-center gap-2.5 px-3 py-2">
      <span className={cn('agent-tile grid h-8 w-8 shrink-0 place-items-center rounded-lg', accentClass[agent.accent])}>
        <Icon size={15} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-display text-[11px] font-bold tracking-[0.14em] text-white">
          {agent.name}
        </p>
        <p className="truncate text-[10px] text-white/40">{agent.role}</p>
      </div>
      <span className="flex items-center gap-1 text-[9px] font-medium uppercase tracking-wider text-emerald/90">
        <span className="dot-live h-1.5 w-1.5 rounded-full animate-pulse-glow" />
        Online
      </span>
    </div>
  )
}

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="reactor-sidebar hidden w-[268px] shrink-0 flex-col lg:flex">
      <div className="reactor-brand px-5 py-5">
        <Link href="/" className="block" aria-label="TPB Creative Reactor — Dashboard">
          <ReactorLogo />
        </Link>
      </div>

      <nav className="reactor-nav flex-1 space-y-1.5 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          const active = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'reactor-nav-item group relative flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm transition-all',
                active ? 'is-active text-white' : 'text-white/55 hover:text-white',
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-glow shadow-[0_0_12px_2px_rgba(94,168,255,0.7)]" />
              )}
              <span className="nav-icon-chip grid h-7 w-7 shrink-0 place-items-center rounded-lg">
                <Icon
                  size={15}
                  className={cn(active ? 'text-glow' : 'text-white/45 group-hover:text-glow/80')}
                />
              </span>
              <span className="flex-1 truncate font-medium">{item.label}</span>
              {item.system && (
                <span className="font-mono text-[10px] tracking-widest text-white/25">
                  {item.system}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="space-y-2 border-t border-border/60 px-3 py-3">
        <div className="console-module py-0.5">
          <AgentRow agent={orchestratorAgent} />
        </div>

        <div className="console-module divide-y divide-white/[0.05] py-0.5">
          {sidebarAgents.map((agent) => (
            <AgentRow key={agent.name} agent={agent} />
          ))}
        </div>

        <div className="sysstatus-module flex items-center gap-2.5 px-3 py-2.5">
          <span className="dot-live h-2 w-2 shrink-0 rounded-full animate-pulse-glow" />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold text-white/85">System Status</p>
            <p className="truncate text-[10px] text-emerald/80">All Systems Operational</p>
          </div>
          <ChevronRight size={14} className="shrink-0 text-emerald/60" />
        </div>
      </div>
    </aside>
  )
}
