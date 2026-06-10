import { getFrameworksForBuilder } from '@/lib/supabase'
import type { Framework } from '@/types'

const CATEGORY_LABELS: Record<string, string> = {
  copy: 'Copy Frameworks',
  hook: 'Hook Frameworks',
  image: 'Image Frameworks',
  video: 'Video Frameworks',
}

export async function buildFrameworksContext(builderId: string | null): Promise<string> {
  try {
    const frameworks = await getFrameworksForBuilder(builderId)
    if (frameworks.length === 0) return ''

    const byCategory: Record<string, Framework[]> = {}
    for (const f of frameworks) {
      if (!byCategory[f.category]) byCategory[f.category] = []
      byCategory[f.category].push(f)
    }

    const sections = Object.entries(byCategory).map(([cat, items]) => {
      const header = `### ${CATEGORY_LABELS[cat] ?? cat}`
      const entries = items.map((f) => `**${f.title}**\n${f.content}`).join('\n\n')
      return `${header}\n\n${entries}`
    })

    return `## AGENCY PLAYBOOK — LIVE FRAMEWORKS\n\n${sections.join('\n\n---\n\n')}`
  } catch (err) {
    console.error('Failed to load DB frameworks, continuing without them:', err)
    return ''
  }
}
