import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard,
  Database,
  Radar,
  Sparkles,
  Type,
  Network,
  Atom,
  LineChart,
  Target,
  BarChart3,
  Boxes,
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
  { label: 'Strategic Memory', href: '/patterns', icon: Network, system: '05' },
  { label: 'Campaign Reactor', href: '/campaign-reactor', icon: Atom, system: '06' },
  { label: 'Performance Intelligence', href: '/learnings', icon: LineChart, system: '07' },
  { label: 'Agent Network', href: '/network', icon: Boxes, system: '08' },
  { label: 'Recommendations', href: '/recommendations', icon: Target, system: '09' },
  { label: 'Meta Intelligence', href: '/meta', icon: BarChart3, system: '10' },
]
