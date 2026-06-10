/**
 * Robustly parse JSON returned by an LLM.
 *
 * Models occasionally wrap JSON in markdown fences or add a stray sentence
 * before/after the object. This strips fences first, then falls back to
 * extracting the outermost {...} block before giving up.
 */
export function parseModelJson<T = unknown>(raw: string): T {
  const cleaned = raw
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim()

  try {
    return JSON.parse(cleaned) as T
  } catch {
    const first = cleaned.indexOf('{')
    const last = cleaned.lastIndexOf('}')
    if (first !== -1 && last !== -1 && last > first) {
      return JSON.parse(cleaned.slice(first, last + 1)) as T
    }
    throw new Error('Model response did not contain valid JSON')
  }
}
