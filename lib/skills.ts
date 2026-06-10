import fs from 'fs'
import path from 'path'

/**
 * Reads one or more skill documents from the `skills/` folder and joins them
 * into a single string for injection into the copy agents' system prompt.
 *
 * Example: getSkills(['meta-frameworks', 'hooks-library'])
 */
export function getSkills(names: string[]): string {
  return names
    .map((name) => {
      const skillPath = path.join(process.cwd(), 'skills', `${name}.md`)
      try {
        return fs.readFileSync(skillPath, 'utf-8')
      } catch (error) {
        console.error(`Could not read skills/${name}.md:`, error)
        return ''
      }
    })
    .filter(Boolean)
    .join('\n\n---\n\n')
}
