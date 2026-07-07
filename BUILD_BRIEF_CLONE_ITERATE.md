# Build Brief — Clone & Iterate — TPB Creative Reactor

Paste this whole document as the task prompt. It is self-contained: it carries
the platform context, the absolute rules, and the exact build order. The full
design spec this brief implements lives at `CLONE_AND_ITERATE_SPEC.md` in the
repo root — read it first, it is the source of truth for data shapes and
sequencing. This brief is the "go build it" version of that spec.

---

## What you're building

TPB Creative Reactor already generates campaign concepts by retrieving from a
RAG knowledge Vault and reasoning over it (`claude-fable-5` orchestrator, see
`SYSTEM_DESIGN.md`). You're adding three connected capabilities on top of the
existing platform, not a separate app:

1. **A fixed taxonomy** for hook style, visual format, and asset type — closed
   vocabularies (not free text) so results are comparable later.
2. **Clone** — browse ads from the Meta Ad Library *or* our own past winners,
   pick one, review/edit its extracted Creative DNA, then regenerate new
   creative locked to that structure.
3. **Isolation mode** — a "what are we testing?" configurator on the Campaign
   Reactor that locks every variable except one (hook / persona / pain point /
   visual format / asset type), so ORACLE can later say which value of that
   one variable actually wins.

A test-ID is threaded through concepts → Meta ad names → performance ingest so
outcomes auto-attribute back to which hypothesis was being tested — that's
what makes "iterate one thing" measurable instead of just a UI idea.

---

## Absolute rules (same as the rest of this codebase — do not deviate)

- Complete, ready-to-use files only. Never partial edits or snippets in your
  output — if a file exists, give the full updated version.
- **Tailwind classes only. Never inline styles.**
- **shadcn/ui components only** — no other UI library.
- **TypeScript only**, strict mode. No plain `.js`.
- No TODOs or placeholder code in anything you consider done.
- Never throw on missing API keys/config (`ANTHROPIC_API_KEY`, `VOYAGE_API_KEY`,
  `META_ACCESS_TOKEN`, Supabase). Every new route/feature degrades to a
  curated/demo path so the platform always works end to end — this codebase's
  existing convention (see `lib/spark.ts`, `lib/meta-ingest.ts`) is "never
  throw, return null/demo data, log the error."
- Supabase: `supabaseAdmin` for writes, `supabase` (anon) for reads, handle
  errors explicitly.

## Design rules (must match every existing dashboard exactly)

- Dark theme: background `#0a0a0a` (not Tailwind's default dark classes).
- Accent: `amber-500` for primary actions/highlights. Success = emerald,
  error = red.
- Every card: `rounded-xl border border-white/10 bg-white/[0.02]`.
- Tight, clean typography — no decorative fonts.
- Always show a spinner/pulse for loading states — never a frozen UI.
- Always show a helpful empty state — never a blank box.
- New nav entries follow the existing sidebar pattern (see the nine
  intelligence systems already in the app shell).

## Models (reuse the existing constants — do not hardcode model strings)

- Orchestrator additions (isolation-mode prompt instructions, clone-reference
  handling) → `ORCHESTRATOR_MODEL` (`claude-fable-5`), same fallback wiring
  already in place (`ORCHESTRATOR_FALLBACK_MODEL`, server-side fallback beta).
- Any single-shot extraction/classification (taxonomy tagging, DNA extraction
  reuse) → `INTELLIGENCE_MODEL` (`claude-sonnet-5`), same as `lib/spark.ts`.
- All three model constants come from `lib/models.ts` — import, don't restate.

---

## Build order — five phases, each independently shippable

Full detail for each phase (data shapes, file names, exact fields) is in
`CLONE_AND_ITERATE_SPEC.md`. Summary + acceptance criteria below.

### Phase 1 — Taxonomy
- New `lib/taxonomy.ts`: `HOOK_STYLES`, `VISUAL_FORMATS`, `ASSET_TYPES` as
  `const` arrays + derived types, same pattern as `CREATIVE_PATTERNS` in
  `lib/spark.ts`. Derive the actual label sets from TPB's existing
  `campaign_outcomes`/SPARK data where possible — don't just copy a generic
  list.
- Schema migration: add `taxonomy JSONB` to `campaign_outcomes`
  (`{ hookStyle, visualFormat, assetType, persona, painPoint }`).
- **Done when:** arrays export cleanly, migration runs against
  `supabase/schema.reactor.sql` conventions, no UI required yet.

### Phase 2 — Test-ID plumbing
- `submit_concepts` output gains a `testId` (`RXN-{n}`).
- `lib/meta-ads.ts` push includes the testId in the ad name.
- `lib/meta-ingest.ts` parses the testId prefix back out on sync and writes it
  plus the `taxonomy` into `campaign_outcomes.attributes`.
- **Done when:** `POST /api/meta/ingest` on a synced test ad returns a matched
  `testId` + `taxonomy` in the outcome record.

### Phase 3 — Clone dashboard (external + internal, one UI)
- New page `/ad-library` + sidebar nav entry, two tabs on one dashboard:
  - **Meta Ad Library** tab: `GET /api/ad-library/search` (Graph API
    `ads_archive`, using existing `META_ACCESS_TOKEN`) → grid of ad cards
    (thumbnail, copy, page name, days active).
  - **Our Winners** tab: `GET /api/vault/winners` reading `campaign_outcomes`
    joined to their SPARK creative-DNA chunk — show real CTR/ROAS, not a
    placeholder stat.
- Every card: **Clone** button.
  - External: send ad copy/thumbnail through the existing
    `extractCreativeDNA()` (`lib/spark.ts`) — do not write a second extractor.
  - Internal: DNA already exists — fetch, don't re-extract.
- Clone opens an editable form over the `CreativeDNA` fields (hook, opening,
  storyStructure, ctaStructure, editingStyle, offerPresentation, visualStyle).
- Confirming posts the edited DNA as `cloneReference` into
  `/api/campaign-reactor` alongside `angle`/`outputs`.
- **Done when:** both tabs render live data with keys configured and a
  reasonable demo/empty state without them; Clone → edit → fire produces
  concepts visibly constrained to the DNA.

### Phase 4 — Isolation mode
- New "What are we testing?" panel on the Campaign Reactor page, gating Fire
  Reactor: 5 tabs matching `hook / persona / painPoint / visualFormat / assetType`.
- Selecting a tab shows that axis's fixed-list chips (pick up to 3 values);
  every other axis locks to the best-performing existing value for that
  product/angle (from `campaign_outcomes`, fallback default in demo mode).
- Freeform "strategist notes for the AI" box, optional, present on every tab.
- New request shape: `{ isolate: { axis, values, lockedTaxonomy, notes } }` on
  `/api/campaign-reactor` — additive; omitting `isolate` keeps today's
  free-generation behavior unchanged.
- Orchestrator system prompt gets one new instruction block: hold
  `lockedTaxonomy` fixed, vary only `axis` across `values`, tag each returned
  concept's `taxonomy` field accordingly.
- Composes with Phase 3: a cloned reference can also be run through isolation
  mode.
- **Done when:** firing with `isolate` set produces concepts that differ only
  on the chosen axis and each carries the correct `taxonomy` tag; firing
  without it behaves exactly as today.

### Phase 5 — Verify end to end
- Confirm demo mode (no keys) still works at every phase per the existing
  "Testing the agent" checklist in `CLAUDE.md`.
- Confirm a full loop: clone a winner → isolate on visual format → fire →
  mark outcome → `/api/meta/ingest` sync shows the testId + taxonomy on the
  result.

---

## What NOT to do

- Don't touch the existing free-generation path's behavior when `cloneReference`
  and `isolate` are both absent.
- Don't invent a second Creative-DNA extractor — reuse `lib/spark.ts`.
- Don't hardcode taxonomy labels that don't trace back to how TPB actually
  tags its own past creative — ask/derive rather than guess if unclear.
- Don't build all five phases in one shot with no checkpoint — ship and verify
  phase by phase, in the order above.
