import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard,
  Database,
  Radar,
  Sparkles,
  Type,
  Network,
  Atom,
  GraduationCap,
  Target,
} from 'lucide-react'

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  system?: string
}

export const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Knowledge Vault', href: '/knowledge-vault', icon: Database, system: '01' },
  { label: 'Research Intelligence', href: '/research', icon: Radar, system: '02' },
  { label: 'Creative Intelligence', href: '/creative', icon: Sparkles, system: '03' },
  { label: 'Copy Intelligence', href: '/copy', icon: Type, system: '04' },
  { label: 'Pattern Intelligence', href: '/patterns', icon: Network, system: '05' },
  { label: 'Campaign Reactor', href: '/campaign-reactor', icon: Atom, system: '06' },
  { label: 'Creative Learnings', href: '/learnings', icon: GraduationCap, system: '07' },
  { label: 'Recommendations', href: '/recommendations', icon: Target, system: '08' },
]

/* ----------------------------------------------------------------------------
   Agent roster shown in the sidebar console — the reactor's working crew.
---------------------------------------------------------------------------- */

export type AgentAccent = 'blue' | 'cyan' | 'violet' | 'emerald' | 'pink' | 'amber'

export interface SidebarAgent {
  name: string
  role: string
  accent: AgentAccent
}

export const orchestratorAgent: SidebarAgent = {
  name: 'OPUS',
  role: 'Orchestrator',
  accent: 'blue',
}

export const sidebarAgents: SidebarAgent[] = [
  { name: 'NOVA', role: 'Research Agent', accent: 'emerald' },
  { name: 'SPARK', role: 'Creative Agent', accent: 'violet' },
  { name: 'ECHO', role: 'Copy Agent', accent: 'amber' },
]
