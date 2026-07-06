/**
 * Visual identity for the live agent workflow — accent channel, SVG stroke
 * colour, and icon per agent. Kept separate from `lib/agents.ts` (the data
 * source of truth) so the animation layer can theme nodes without bloating the
 * shared agent definitions.
 *
 * Holographic-chamber palette: the scene stays cool-toned (electric cyan, ice
 * blue, violet) with warm amber reserved for the inside of the OPUS core only.
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
  opus: { accent: 'cyan', stroke: '#7DE3FF', icon: Atom },
  atlas: { accent: 'cyan', stroke: '#22D3EE', icon: Database },
  nova: { accent: 'violet', stroke: '#A78BFA', icon: Telescope },
  spark: { accent: 'amber', stroke: '#FBBF24', icon: Sparkles },
  echo: { accent: 'emerald', stroke: '#34D399', icon: MessageSquareText },
  oracle: { accent: 'pink', stroke: '#F472B6', icon: Brain },
}

/** Icy convergence tint — where the agent streams brighten into the core. */
export const OPUS_CORE = '#7DE3FF'
/** Warm intelligence heart — used only inside the OPUS core itself. */
export const OPUS_EMBER = '#FFB86B'
/** Resolved-output channel toward the synthesis panel. */
export const OPUS_OUTPUT_STROKE = '#5EA8FF'
/** Ice-white hot tip shared by every energy stream. */
export const STREAM_TIP = '#EAF6FF'
