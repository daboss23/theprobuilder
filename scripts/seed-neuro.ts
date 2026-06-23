/**
 * Seed the Knowledge Vault with the verified neuromarketing principles NEURO
 * scores against. POSTs each entry to /api/vault/ingest (chunk → Voyage embed →
 * pgvector). Re-runnable; ingest degrades gracefully if Voyage/Supabase are not
 * configured.
 *
 * Usage:
 *   BASE_URL=http://localhost:3000 npx tsx scripts/seed-neuro.ts
 *   # defaults to http://localhost:3000 when BASE_URL is unset
 *   # set BUILDER_ID=... to scope the entries to a specific builder
 */

import { NEURO_SEED_PRINCIPLES } from '@/seeds/neuro/principles'

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000'
const BUILDER_ID = process.env.BUILDER_ID ?? null

async function main() {
  console.log(`Seeding ${NEURO_SEED_PRINCIPLES.length} neuromarketing principles → ${BASE_URL}/api/vault/ingest\n`)

  let ok = 0
  for (const entry of NEURO_SEED_PRINCIPLES) {
    try {
      const res = await fetch(`${BASE_URL}/api/vault/ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: entry.title,
          content: entry.content,
          system: 'learning',
          category: entry.category,
          builderId: BUILDER_ID,
          metadata: entry.metadata,
        }),
      })
      const json = (await res.json()) as { success?: boolean; error?: string; chunks?: number }
      if (res.ok && json.success) {
        ok += 1
        console.log(`  ✓ ${entry.title}${typeof json.chunks === 'number' ? ` (${json.chunks} chunk${json.chunks === 1 ? '' : 's'})` : ''}`)
      } else {
        console.error(`  ✗ ${entry.title} — ${json.error ?? `HTTP ${res.status}`}`)
      }
    } catch (err) {
      console.error(`  ✗ ${entry.title} — ${err instanceof Error ? err.message : 'request failed'}`)
    }
  }

  console.log(`\nDone: ${ok}/${NEURO_SEED_PRINCIPLES.length} ingested.`)
  if (ok < NEURO_SEED_PRINCIPLES.length) process.exitCode = 1
}

void main()
