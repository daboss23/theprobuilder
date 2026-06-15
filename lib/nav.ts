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
  BarChart3,
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
  { label: 'Meta Intelligence', href: '/meta', icon: BarChart3, system: '09' },
]
