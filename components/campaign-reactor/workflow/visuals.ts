/**
 * Visual identity for the live agent workflow — accent channel, SVG stroke
 * colour, and icon per agent. Kept separate from `lib/agents.ts` (the data
 * source of truth) so the animation layer can theme nodes without bloating the
 * shared agent definitions. Colours follow the brief's intelligence palette.
 */

import {
  Atom,
  Brain,
  Database,
  MessageSquareText,
  Sparkles,
  Telescope,
  type LucideIcon,
} from 'lucide-react'
import type { AgentId } from '@/lib/agents'
import type { Accent } from '@/components/reactor/ui'

export interface AgentVisual {
  /** Accent channel class (globals.css → --acc / --acc-hi). */
  accent: Accent
  /** Solid stroke colour for SVG connections / gradients (presentation attr). */
  stroke: string
  icon: LucideIcon
}

export const AGENT_VISUAL: Record<AgentId, AgentVisual> = {
  opus: { accent: 'blue', stroke: '#FF6A3D', icon: Atom },
  atlas: { accent: 'cyan', stroke: '#22D3EE', icon: Database },
  nova: { accent: 'violet', stroke: '#A78BFA', icon: Telescope },
  spark: { accent: 'amber', stroke: '#FBBF24', icon: Sparkles },
  echo: { accent: 'emerald', stroke: '#34D399', icon: MessageSquareText },
  oracle: { accent: 'pink', stroke: '#F472B6', icon: Brain },
}

/** OPUS reactor-core palette (blood-orange heart, electric-blue rings). */
export const OPUS_CORE = '#FF6A3D'
export const OPUS_OUTPUT_STROKE = '#5EA8FF'
