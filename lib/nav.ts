import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard,
  Database,
  Radar,
  GitCompareArrows,
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
  { label: 'Reactor Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Knowledge Vault', href: '/knowledge-vault', icon: Database, system: '01' },
  { label: 'Research Intelligence', href: '/research', icon: Radar, system: '02' },
  { label: 'Transformation Intelligence', href: '/transformation', icon: GitCompareArrows, system: '03' },
  { label: 'Creative Intelligence', href: '/creative', icon: Sparkles, system: '04' },
  { label: 'Copy Intelligence', href: '/copy', icon: Type, system: '05' },
  { label: 'Pattern Intelligence', href: '/patterns', icon: Network, system: '06' },
  { label: 'Campaign Reactor', href: '/campaign-reactor', icon: Atom, system: '07' },
  { label: 'Creative Learnings', href: '/learnings', icon: GraduationCap, system: '08' },
  { label: 'Recommendations', href: '/recommendations', icon: Target, system: '09' },
]
