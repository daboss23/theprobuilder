/**
 * The TPB Creative Reactor intelligence network — the single source of truth for
 * the six agents the platform is built around. The orchestrator (`route.ts`)
 * delegates to the five consultable intelligence layers; the telemetry feed, the
 * Strategic Intelligence panel, and the Agent Network page all read their
 * identity (codename, role, accent) from here so the network stays consistent
 * everywhere it surfaces.
 *
 * The user should experience OPUS — a Master Strategist presenting intelligence.
 * The machinery (which layer was consulted) stays invisible in the product copy;
 * the codenames exist for the visibility surfaces (telemetry, Agent Network).
 */

import type { KnowledgeSystem } from '@/lib/knowledge'

export type AgentId = 'opus' | 'atlas' | 'nova' | 'spark' | 'echo' | 'oracle'

/** The five layers OPUS can consult (everyone except OPUS itself). */
export type IntelligenceId = Exclude<AgentId, 'opus'>

export interface AgentDef {
  id: AgentId
  /** Display codename, e.g. "ATLAS". */
  codename: string
  /** Human role, e.g. "Knowledge Intelligence". */
  role: string
  /** One-line mission, used on the Agent Network page + tool descriptions. */
  mission: string
  /** Knowledge systems this agent reads when consulted. */
  systems: KnowledgeSystem[]
  /** Telemetry section header, e.g. "Market Intelligence". */
  intelligenceLabel: string
  /** Tailwind accent token used across the visibility surfaces. */
  accent: string
}

export const OPUS: AgentDef = {
  id: 'opus',
  codename: 'OPUS',
  role: 'Master Strategist',
  mission:
    'Synthesize every intelligence layer into strategic direction, rank concepts, and drive launch-ready creative.',
  systems: [],
  intelligenceLabel: 'Strategic Intelligence',
  accent: '#FF5E3A',
}

/** The five consultable intelligence layers, keyed by id. */
export const INTELLIGENCE: Record<IntelligenceId, AgentDef> = {
  atlas: {
    id: 'atlas',
    codename: 'ATLAS',
    role: 'Knowledge Intelligence',
    mission:
      'Turn uploaded assets — frameworks, SOPs, calls, webinars, VSLs — into retrievable intelligence.',
    systems: ['vault'],
    intelligenceLabel: 'Knowledge Intelligence',
    accent: '#38BDF8',
  },
  nova: {
    id: 'nova',
    codename: 'NOVA',
    role: 'Market Intelligence',
    mission:
      'Understand the market — pains, desires, objections, beliefs, language — and determine awareness level.',
    systems: ['research', 'transformation'],
    intelligenceLabel: 'Market Intelligence',
    accent: '#A78BFA',
  },
  spark: {
    id: 'spark',
    codename: 'SPARK',
    role: 'Creative Intelligence',
    mission:
      'Study winning creatives and extract repeatable Creative DNA — hooks, openings, structures, visual patterns.',
    systems: ['creative'],
    intelligenceLabel: 'Creative Intelligence',
    accent: '#FBBF24',
  },
  echo: {
    id: 'echo',
    codename: 'ECHO',
    role: 'Copy Intelligence',
    mission:
      'Study persuasive communication and extract Copy DNA — messaging patterns, emotions, offers, objection handling.',
    systems: ['copy'],
    intelligenceLabel: 'Copy Intelligence',
    accent: '#34D399',
  },
  oracle: {
    id: 'oracle',
    codename: 'ORACLE',
    role: 'Pattern Intelligence',
    mission:
      'Identify repeatable success across outcomes — what won, what lost, and what is most likely to work next.',
    systems: ['pattern', 'learning'],
    intelligenceLabel: 'Pattern Intelligence',
    accent: '#F472B6',
  },
}

/** Ordered network for visibility surfaces (OPUS leads). */
export const AGENT_NETWORK: AgentDef[] = [OPUS, ...Object.values(INTELLIGENCE)]

export const INTELLIGENCE_IDS = Object.keys(INTELLIGENCE) as IntelligenceId[]

export function isIntelligenceId(v: string): v is IntelligenceId {
  return (INTELLIGENCE_IDS as string[]).includes(v)
}
