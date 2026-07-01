/**
 * Step 3 intelligence sources — the agent-mapped knowledge the Campaign Reactor
 * draws on. These are NOT separate systems the user must understand; each maps
 * to an agent in the network, and OPUS recommends which ones matter for a brief.
 *
 * (Transformation Intelligence was removed — member wins / transformations /
 * case studies are stored ASSETS inside the Knowledge Vault (ATLAS), not a
 * standalone intelligence source.)
 */

export type IntelSourceId =
  | 'vault'
  | 'market'
  | 'creativeDna'
  | 'copyDna'
  | 'frameworks'
  | 'sops'
  | 'strategicMemory'

export interface IntelSource {
  id: IntelSourceId
  label: string
  /** The agent that owns this source — gives the user a clean mental model. */
  agent: string
}

export const INTEL_SOURCES: IntelSource[] = [
  { id: 'vault', label: 'Knowledge Vault', agent: 'ATLAS' },
  { id: 'market', label: 'Market Intelligence', agent: 'NOVA' },
  { id: 'creativeDna', label: 'Creative DNA', agent: 'SPARK' },
  { id: 'copyDna', label: 'Copy DNA', agent: 'ECHO' },
  { id: 'frameworks', label: 'Framework Vault', agent: 'ATLAS' },
  { id: 'sops', label: 'SOP Vault', agent: 'ATLAS' },
  { id: 'strategicMemory', label: 'Strategic Memory', agent: 'ORACLE' },
]

export function intelSourceLabel(id: string): string {
  return INTEL_SOURCES.find((s) => s.id === id)?.label ?? id
}

/**
 * Recommend which intelligence sources matter for a brief + its deliverables.
 * Deterministic so the reasoning stays honest (counts are computed separately
 * from real stats). Research briefs lean on market + memory; generation briefs
 * lean on creative/copy DNA + frameworks. Knowledge Vault (ATLAS) is always on.
 */
export function recommendIntelSources(brief: string, deliverables: string[]): IntelSourceId[] {
  const t = brief.toLowerCase()
  const d = deliverables.map((x) => x.toLowerCase())
  const isResearch = /research|opportunit|market|competitor|trend|audience insight|new angle|explore/.test(t)
  const hasVisual = d.some((x) => /concept|static|video|founder|testimonial|event|campaign/.test(x))
  const hasCopy = d.some((x) => /hook|headline|primary text|vsl/.test(x))
  const mentionsProcess = /sop|process|production|playbook|system build|workflow/.test(t)

  const set = new Set<IntelSourceId>(['vault']) // ATLAS is always foundational.

  if (isResearch) {
    set.add('market')
    set.add('strategicMemory')
  } else {
    // Generation brief — default to creative + copy DNA and frameworks. Every
    // creative carries copy, so Copy DNA (ECHO) rides along with any visual work.
    if (hasVisual || d.length === 0) set.add('creativeDna')
    if (hasCopy || hasVisual || d.length === 0) set.add('copyDna')
    set.add('frameworks')
  }

  if (mentionsProcess) set.add('sops')

  return INTEL_SOURCES.filter((s) => set.has(s.id)).map((s) => s.id)
}
