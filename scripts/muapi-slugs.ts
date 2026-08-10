/**
 * Find the working Muapi endpoint slugs for the frontier image models.
 *
 * WHY: `lib/image/muapi.ts` maps our model ids to Muapi endpoint paths. Only
 * `flux-dev-image` was ever confirmed; vendor paths drift, so when the frontier
 * slugs 404 the oven quietly falls all the way down to FLUX.1 Dev — the weakest
 * text renderer in the menu — and ads ship with misspelled headlines. Every
 * slug is env-overridable precisely so this is fixable without a code change;
 * this script tells you which override to set.
 *
 * USAGE
 *   MUAPIAPP_API_KEY=<key> npx tsx scripts/muapi-slugs.ts
 *
 * COST: a slug that WORKS starts a real generation (~$0.03). At most one per
 * model — it stops probing a model as soon as a candidate is accepted. Use a
 * Muapi **Sandbox** key to spend nothing: sandbox keys return mock data
 * instantly and burn no credits.
 *
 * OUTPUT: paste-ready env lines for Vercel (Project → Settings → Environment
 * Variables), then redeploy.
 */

const API_BASE = process.env.MUAPI_API_BASE || 'https://api.muapi.ai/api/v1'
const KEY = process.env.MUAPIAPP_API_KEY || process.env.MUAPI_API_KEY

/**
 * Candidate paths per model, best guess first.
 *
 * The dashboard's generation log shows endpoints named `<model>-<mode>` —
 * `gpt-image-2-image-to-image` for editing — which implies `-text-to-image` for
 * plain generation. Our confirmed slug uses a bare `-image` suffix and the CLI
 * lists curated names with no suffix at all, so all three conventions are
 * probed per model, most likely first.
 */
const CANDIDATES: { envVar: string; label: string; slugs: string[] }[] = [
  {
    envVar: 'MUAPI_MODEL_NANO_BANANA_PRO',
    label: 'Nano Banana Pro',
    slugs: [
      'nano-banana-pro-text-to-image',
      'nano-banana-pro-image',
      'nano-banana-pro',
      'gemini-3-pro-image-text-to-image',
    ],
  },
  {
    envVar: 'MUAPI_MODEL_NANO_BANANA_2',
    label: 'Nano Banana 2',
    slugs: ['nano-banana-2-text-to-image', 'nano-banana-2-image', 'nano-banana-2', 'nano-banana-text-to-image'],
  },
  {
    envVar: 'MUAPI_MODEL_GPT_IMAGE_2',
    label: 'GPT Image 2',
    slugs: ['gpt-image-2-text-to-image', 'gpt-image-2-image', 'gpt-image-2', 'gpt4o-image'],
  },
  {
    envVar: 'MUAPI_MODEL_MIDJOURNEY',
    label: 'Midjourney',
    slugs: ['midjourney-text-to-image', 'midjourney-image', 'midjourney'],
  },
  {
    envVar: 'MUAPI_MODEL_SEEDREAM',
    label: 'Seedream 4.0',
    slugs: ['seedream-text-to-image', 'seedream-image', 'seedream', 'seedream-v4-text-to-image'],
  },
  {
    envVar: 'MUAPI_MODEL_FLUX_KONTEXT_MAX',
    label: 'FLUX Kontext Max',
    slugs: ['flux-kontext-max-text-to-image', 'flux-kontext-max-image', 'flux-kontext-max'],
  },
  {
    envVar: 'MUAPI_MODEL_FLUX_DEV',
    label: 'FLUX.1 Dev (known-good control)',
    slugs: ['flux-dev-image', 'flux-dev-text-to-image', 'flux-dev'],
  },
]

const PROBE = { prompt: 'a plain grey square', aspect_ratio: '1:1', num_images: 1 }

async function probe(slug: string): Promise<{ ok: boolean; status: number; detail: string }> {
  try {
    const res = await fetch(`${API_BASE}/${slug}`, {
      method: 'POST',
      headers: { 'x-api-key': KEY!, 'Content-Type': 'application/json' },
      body: JSON.stringify(PROBE),
      cache: 'no-store',
    })
    const body = (await res.json().catch(() => null)) as Record<string, unknown> | null
    const id = body?.request_id ?? body?.id
    const detail = String(body?.message ?? body?.error ?? res.statusText ?? '')
    return { ok: res.ok && Boolean(id), status: res.status, detail }
  } catch (err) {
    return { ok: false, status: 0, detail: err instanceof Error ? err.message : String(err) }
  }
}

async function main() {
  if (!KEY) {
    console.error(
      '\nMUAPIAPP_API_KEY is not set.\n\n  MUAPIAPP_API_KEY=<your key> npx tsx scripts/muapi-slugs.ts\n\nUse a Muapi Sandbox key to probe without spending credits.\n',
    )
    process.exit(1)
  }

  console.log(`\nProbing ${API_BASE} …\n`)
  const found: { envVar: string; slug: string }[] = []
  const missing: string[] = []

  for (const model of CANDIDATES) {
    let hit: string | null = null
    const tried: string[] = []
    for (const slug of model.slugs) {
      const r = await probe(slug)
      if (r.ok) {
        hit = slug
        break
      }
      tried.push(`${slug} → ${r.status || 'network'}${r.detail ? ` ${r.detail}` : ''}`)
    }
    if (hit) {
      console.log(`  ✓ ${model.label}: ${hit}`)
      found.push({ envVar: model.envVar, slug: hit })
    } else {
      console.log(`  ✗ ${model.label}: none of the candidates worked`)
      tried.forEach((t) => console.log(`      ${t}`))
      missing.push(model.label)
    }
  }

  if (found.length) {
    console.log('\nPaste these into Vercel → Settings → Environment Variables, then redeploy:\n')
    found.forEach((f) => console.log(`${f.envVar}=${f.slug}`))
  }
  if (missing.length) {
    console.log(
      `\nStill unresolved: ${missing.join(', ')}.\nOpen your Muapi dashboard, copy the endpoint path shown for each model, and set its variable by hand.\n`,
    )
  }
  console.log('')
}

main()
