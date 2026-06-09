import type { Builder } from '@/types'

/**
 * Builds a brand-memory style brief from a stored builder profile. Used in
 * place of the static brand/BRAND_MEMORY.md when a specific builder is
 * selected, so the same engine produces on-brand copy for any tenant.
 */
export function buildBrandContext(b: Builder): string {
  const proof = (b.proof_points ?? [])
    .filter((p) => p && p.trim())
    .map((p) => `- ${p}`)
    .join('\n')

  const sections = [
    `# Brand Memory - ${b.name}`,
    b.region ? `**Region:** ${b.region}` : '',
    b.website ? `**Website:** ${b.website}` : '',
    b.serves ? `## Who they build for\n${b.serves}` : '',
    b.offer ? `## Core offer\n${b.offer}` : '',
    proof ? `## Proof points\n${proof}` : '',
    b.brand_voice ? `## Voice & tone\n${b.brand_voice}` : '',
    b.visual_style ? `## Visual style guide\n${b.visual_style}` : '',
    `## Non-negotiable\nEvery line of copy must be specific to ${b.name} - it should be impossible to swap the brand name out and reuse it for any other builder.`,
  ]

  return sections.filter(Boolean).join('\n\n')
}
