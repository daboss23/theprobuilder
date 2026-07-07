# Clone & Iterate — Build Spec

**Status: draft, not yet built.** This is the spec for three features discussed
in planning: (1) a Meta Ad Library dashboard, (2) cloning an ad — theirs or
ours — into an editable brief, and (3) a fixed-taxonomy "iterate one thing"
test mode that lets ORACLE compare results cleanly. Written so any of the
phases below can be handed to the orchestrator/build session on its own.

---

## 0. The one idea underneath all three features

Today the Reactor generates concepts from free-form retrieval — great for
range, bad for comparison. "Iterate one thing" only works if the thing you
changed is tagged from a **fixed, closed list** — not a sentence the model
made up each time. Fixed labels are what let ORACLE later say "Urgency hooks
outperform Question hooks 2x" instead of comparing unique snowflakes.

So before any UI work: **Phase 1 is the taxonomy.** Everything else consumes it.

---

## Phase 1 — Fixed taxonomies

New file: `lib/taxonomy.ts`. Five closed vocabularies, each a `const` array +
type, same pattern as `CREATIVE_PATTERNS` in `lib/spark.ts`:

```ts
export const HOOK_STYLES = [
  'Question', 'Storytelling', 'If/Then', 'Contrast', 'Relatability',
  'Curiosity', 'Offer Only', 'Aspirational', 'Urgency', 'Contrarian',
  'Explainer', 'Direct Address',
] as const

export const VISUAL_FORMATS = [
  'Montage', 'Feature Benefit Pointout', 'Split Screen', 'Static-to-Video Hybrid',
  'Problem Agitation', 'Greenscreen', 'Review', 'Expert Explainer',
  'Social Comments', 'B-Roll', 'Meme', 'Transformation', 'Behind The Scenes', 'Grid Swap',
] as const

export const ASSET_TYPES = [
  'Image With Text', 'UGC Mashup', 'Lifestyle Image With Text', 'Animation', 'Hybrid',
] as const

// PERSONAS and PAIN_POINTS: do NOT hardcode generic ones — derive from TPB's
// actual builder segments/pains already described in brand/BRAND_MEMORY.md and
// past campaign_outcomes.attributes. Seed the list, allow "+ add new" so it
// grows from real runs instead of staying static.
export const ITERATION_AXES = ['hook', 'persona', 'painPoint', 'visualFormat', 'assetType'] as const
export type IterationAxis = typeof ITERATION_AXES[number]
```

Action item before writing code: pull TPB's real hook styles / visual formats
out of past winners (`campaign_outcomes`, SPARK creative chunks) rather than
copying the competitor's list verbatim — the labels only work if they match
how TPB actually tags its own creative.

**Schema change:** add `taxonomy JSONB` to `campaign_outcomes` (and to the
`concepts` shape returned by `submit_concepts`) storing
`{ hookStyle, visualFormat, assetType, persona, painPoint }` — one value per
axis, always from the fixed list above. This is the field ORACLE will group by.

---

## Phase 2 — Test-ID naming (closes the loop)

Every concept the Reactor emits gets a **test ID** — `RXN-{n}` — written into
`campaign_outcomes.attributes.testId` and into the ad name pushed to Meta
(reuses the existing Meta creative-push path). `lib/meta-ingest.ts` already
keys off `attributes.metaAdId`; extend it to also parse a `testId` prefix out
of the ad name on ingest, so a synced result auto-attributes back to:

- which single axis was being isolated (`taxonomy` from Phase 1)
- what the locked/control values were on every other axis

No new UI for this phase — it's plumbing between `submit_concepts`,
`meta-ads.ts` push, and `meta-ingest.ts` sync.

---

## Phase 3 — Isolation mode (the 5-tab test configurator)

New UI on the Campaign Reactor page, gating "Fire Reactor": a
"What are we testing?" panel with 5 tabs matching `ITERATION_AXES` — Hook,
Persona, Pain point, Visual format, Asset type. Selecting a tab:

- shows that axis's fixed-list chips (pick up to 3 values to test)
- everything else locks to the **highest-performing existing value** for that
  product/angle, pulled from `campaign_outcomes` (fall back to a sane default
  in demo mode)
- a "strategist notes for the AI" free-text box (optional, same on every tab)

This becomes new input to `/api/campaign-reactor`: `{ isolate: { axis, values, lockedTaxonomy, notes } }`.
Orchestrator system prompt gets one new instruction block: hold every axis in
`lockedTaxonomy` fixed, vary only `axis` across `values`, and tag each
returned concept's `taxonomy` field accordingly. This is additive — existing
free-generation mode (no `isolate` passed) is untouched.

---

## Phase 4 — Clone sources (external + internal, one flow)

Both sources feed the same "editable DNA → regenerate" pipeline; they only
differ in where the DNA comes from.

**4a. Meta Ad Library dashboard** (`/ad-library`, new page + nav entry)
- `GET /api/ad-library/search` — Graph API `ads_archive` edge, using the
  existing `META_ACCESS_TOKEN`. Params: search term, country, platform,
  active-only. Returns ad copy, thumbnail/video, page name, days active.
- Grid UI matching existing dashboard card style (rounded-xl, border
  white/10, bg white/[0.02]).
- Each card has a **Clone** button.

**4b. "Our Winners" tab** (same page, second tab)
- `GET /api/vault/winners` — reads `campaign_outcomes` joined to their SPARK
  creative-DNA chunk (already extracted via `extractCreativeDNA` on winner
  re-ingest — no new extraction needed). Surfaces real CTR/ROAS from ORACLE,
  not a placeholder stat.
- Same card shape, same **Clone** button.

**Clone action (shared for both):**
1. External: text/thumbnail → `extractCreativeDNA()` (already exists in
   `lib/spark.ts`) → `CreativeDNA` object.
   Internal: DNA is already stored — just fetch it.
2. Render `CreativeDNA` in an editable form (hook, structure, visual style,
   CTA structure, etc. — same fields the type already has). User edits any
   field.
3. On confirm, POST the edited DNA as `cloneReference` into
   `/api/campaign-reactor` alongside `angle`/`outputs` (and optionally an
   `isolate` block from Phase 3 — cloning and isolation-mode compose).
4. Orchestrator prompt gets a new block: when `cloneReference` is present,
   generate concepts that match its structure/DNA exactly, varying only what
   the user's edits or `isolate` axis specify.

---

## Build order (what to hand off, in sequence)

1. **Phase 1** — `lib/taxonomy.ts` + schema migration adding `taxonomy` column.
   No UI. Verifiable by unit-checking the exported arrays and a migration dry-run.
2. **Phase 2** — testId plumbing through `submit_concepts` → `meta-ads.ts` →
   `meta-ingest.ts`. Verifiable via `/api/meta/ingest` returning matched testIds.
3. **Phase 4a** — Ad Library dashboard (external clone only, read-only search +
   clone-to-editable-DNA). Ships value independent of Phases 3/2.
4. **Phase 4b** — Our Winners tab (internal clone). Reuses 4a's UI shell.
5. **Phase 3** — Isolation-mode configurator, wired to both free generation and
   cloned references.

Each phase is independently shippable and testable per the existing "Testing
the agent" checklist in `CLAUDE.md` — demo mode must keep working with no keys
at every step.
