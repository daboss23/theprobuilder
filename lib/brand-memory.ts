import fs from 'fs'
import path from 'path'

/**
 * Reads the Summit Build Co brand intelligence document that is injected into
 * the copy-generation agents at runtime.
 *
 * NOTE: This intentionally reads `brand/BRAND_MEMORY.md` — NOT `CLAUDE.md`.
 * Per the project rules, CLAUDE.md holds Claude Code's build rules and must
 * never be injected into API calls. BRAND_MEMORY.md is the brand's voice,
 * audience, proof points and visual guidelines.
 */
export function getBrandMemory(): string {
  const brandPath = path.join(process.cwd(), 'brand', 'BRAND_MEMORY.md')

  try {
    return fs.readFileSync(brandPath, 'utf-8')
  } catch (error) {
    console.error('Could not read brand/BRAND_MEMORY.md:', error)
    return ''
  }
}
