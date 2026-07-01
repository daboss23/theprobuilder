# CLAUDE.md — TPB Creative Reactor
## Claude Code Project Rules — Read This First Every Session

---

## PROJECT OVERVIEW

This is a Next.js app: **TPB Creative Reactor** — a premium AI-powered Creative
Intelligence Command Center for The Professional Builder. It turns 20+ years of
winning creative assets, member wins, frameworks, SOPs, research, and
performance data into the next winning campaign, answering one question:
"What should TPB create next, based on everything that has already worked?"

It is built around nine intelligence systems (Reactor Dashboard, Knowledge
Vault, Research, Creative, Copy, Strategic Memory (ORACLE), Campaign Reactor,
Creative Learnings, Recommendations). The Campaign Reactor runs an **agentic
orchestrator** (a Claude tool-use loop) over a RAG knowledge layer. See
`SYSTEM_DESIGN.md` for the full architecture.

Tagline: **Engineered For Performance.**

---

## ABSOLUTE RULES — NEVER BREAK THESE

- **Work on the branch the session gives you, then PR into `main`.** `main` is the single source of truth, but Claude Code on the web starts every session on a generated working branch (e.g. `claude/...`) and the GitHub proxy *only allows pushes to that current working branch* — pushing straight to `main` is blocked at the network layer, so do not try. Commit and push to the session branch, then open (or merge) a pull request into `main`. In a local/terminal session with no branch override, committing directly to `main` is fine.
  - **"Push updates to main" = open a PR from the session branch and merge it.** This is the *only* way to get changes onto `main` from a web session — it is expected and correct, not a workaround. Do not tell the user direct pushes are impossible and stop there; go ahead and open the PR (and merge it if they asked to push to main), then report the merge. Never treat "push to main" as blocked — treat it as "PR + merge."
- **Always provide complete, ready-to-use files. Never provide partial edits or snippets.**
- **Never use inline styles. Tailwind classes only.**
- **Never use any UI component other than shadcn/ui.**
- **TypeScript only. No plain JavaScript files.**
- **Never leave TODO comments or placeholder code in final files.**
- **If a file already exists, provide the full updated version — not just the changed section.**

---

## TECH STACK

| Layer | Technology |
|---|---|
| Framework | Next.js 14 App Router |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS |
| Components | shadcn/ui exclusively |
| Database | Supabase |
| Copy AI | Anthropic Claude API — orchestrator `claude-fable-5` (Opus 4.8 fallback), bulk `claude-sonnet-5` (see `lib/models.ts`) |
| Embeddings | Voyage AI `voyage-3` (RAG retrieval) |
| Vector store | Supabase `pgvector` (`knowledge_chunks`) |
| Image AI | fal.ai (FLUX) + Higgsfield Soul — direct Gemini/OpenAI image removed (fal + Kie only) |
| Deployment | Vercel |

---

## PROJECT STRUCTURE

```
summit-build-creative/
├── CLAUDE.md                        ← you are here (Claude Code rules)
├── brand/
│   └── BRAND_MEMORY.md              ← Summit Build Co brand intelligence
├── skills/
│   ├── meta-frameworks.md           ← Meta ad frameworks and knowledge
│   └── hooks-library.md             ← Proven hooks swipe file
├── app/
│   ├── layout.tsx
│   ├── page.tsx                     ← main dashboard
│   ├── globals.css
│   └── api/
│       ├── generate-copy/route.ts   ← Claude API call
│       ├── generate-image/route.ts  ← Higgsfield API call
│       └── save-output/route.ts     ← Supabase save
├── components/
│   ├── BriefForm.tsx
│   ├── CopyOutput.tsx
│   ├── ImageOutput.tsx
│   └── AdPreview.tsx
├── lib/
│   ├── brand-memory.ts              ← reads brand/BRAND_MEMORY.md
│   ├── skills.ts                    ← reads skills/ folder
│   └── supabase.ts
└── types/
    └── index.ts
```

---

## ENVIRONMENT VARIABLES

These live in `.env.local` — never commit this file.

```
ANTHROPIC_API_KEY            # Campaign Reactor agent + copy generation
VOYAGE_API_KEY               # Embeddings for the RAG knowledge layer
OPENAI_API_KEY               # Comparison copy / image (GPT Image)
GEMINI_API_KEY               # Nano Banana 2 image model (Gemini) — or GOOGLE_API_KEY
HF_CREDENTIALS               # Higgsfield image + video ("KEY_ID:KEY_SECRET")
FAL_KEY                      # fal.ai gateway → Seedance/Kling/Veo/Wan video models
PIPEBOARD_API_TOKEN          # Meta Ads MCP (live ad performance) — optional
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

Always check these exist before building any API route. For the Reactor agent
and retrieval specifically, **do not throw on missing keys** — fall back to the
curated demo intelligence / demo agent mode so the platform always works end to
end. For destructive writes (Supabase inserts), surface errors clearly.

---

## API CONVENTIONS

### Claude API calls
- **Orchestrator (Campaign Reactor tool-use loop): `claude-fable-5`** — long-horizon multi-step reasoning over retrieved evidence. Defined once as `ORCHESTRATOR_MODEL` in `lib/models.ts`. Fable 5 rules: never send `thinking` or sampling params (`temperature`/`top_p`/`top_k`) — both 400; safety classifiers can decline with `stop_reason: "refusal"`, so the reactor opts into the server-side fallback (`SERVER_SIDE_FALLBACK_BETA` + `fallbacks: [{model: ORCHESTRATOR_FALLBACK_MODEL}]`) and also falls back client-side when the org can't run Fable 5 at all (30-day data-retention requirement → 400 on every request).
- **Single-shot strategy calls (suggest / intelligence): `ORCHESTRATOR_FALLBACK_MODEL` (Opus 4.8)** — latency-sensitive picks fired while the user types; Fable's always-on thinking isn't worth the wait there.
- **High-volume / single-shot copy + intelligence layers: `claude-sonnet-5`** — cheaper and faster for bulk drafting, the NEURO pre-test, and the legacy generate-copy route. Defined once as `INTELLIGENCE_MODEL` in `lib/models.ts` (same list price as the prior `claude-sonnet-4-6`, higher quality).
- Max tokens: 2000–4000 for copy/concept generation
- Always wrap in try/catch
- Always strip markdown fences before JSON.parse (use `lib/parse.ts`)
- System prompt must always inject brand memory + skills/frameworks content

### Embeddings (RAG knowledge layer)
- Provider: **Voyage AI**, model `voyage-3` (1024-dim) — Anthropic has no embeddings model. See `lib/embeddings.ts`.
- Stored in Supabase `pgvector` (`knowledge_chunks`); retrieved via `match_knowledge()`. See `lib/knowledge.ts` and `supabase/schema.reactor.sql`.
- All retrieval degrades gracefully to a curated demo corpus when keys/DB are absent.

### Higgsfield (image + video)
- Use the official SDK **`@higgsfield/client`** (v2) via `lib/higgsfield.ts` — never shell out to the CLI (it needs a browser login + long-running process and can't run in a Vercel serverless route). Auth is `HF_CREDENTIALS` ("KEY_ID:KEY_SECRET").
- `generateImage()` blocks until the still is ready (returns the URL inline). `startVideo()` is fire-and-forget — video renders take minutes, so the client polls `getVideoStatus()` via `/api/generate-video`.
- Exposed to the Campaign Reactor agent as the `generate_image` / `generate_video` tools (only when `HF_CREDENTIALS` is set). Results stream to the Reactor as `media` SSE events and render on the concept cards.
- Never throw on missing keys or failed renders — return null/`unknown` so the copy stays usable.

### Image models (multi-provider "oven")
- The image layer lives in `lib/image/` and mirrors the video layer. `lib/image/registry.ts` is the menu: **fal-flux** (FLUX via fal, `lib/image/fal.ts`), **higgsfield-soul** (Higgsfield SDK). Direct Gemini/OpenAI image providers were removed — the platform uses fal (and Kie when wired) plus Higgsfield only. One provider key each.
- `lib/image/index.ts` dispatches `generateImageWith(modelId, prompt, aspectRatio)` → `{ imageUrl, modelId, provider }`, picking the best configured model when none/an unconfigured one is requested, with automatic fallback to any other configured provider. Never throws — returns null.
- Exposed to the agent as `generate_image` with a `model` selector; `lib/image/recommend.ts` suggests a model from the requested output types (Higgsfield Soul for photographic founder/testimonial, FLUX/fal for everything else).
- API: `GET /api/image/models` lists the menu + configured status; `POST /api/generate-image` is model-aware and returns `{ model, provider }` (backward compatible — prompt only renders on the default/best model).

### Video models (multi-provider "oven")
- The video layer lives in `lib/video/` and is provider-agnostic. `lib/video/registry.ts` is the model menu (Seedance 2.0, Kling 2.5, Veo 3, Wan 2.5, Higgsfield DoP) with capabilities (modes, max duration, aspect ratios, native audio). Endpoints are env-overridable since vendor model paths drift.
- **fal.ai** is the single gateway for the frontier models — one key (`FAL_KEY`) unlocks Seedance/Kling/Veo/Wan via the async queue API (`lib/video/fal.ts`). Higgsfield stays wired through its own SDK.
- `lib/video/index.ts` dispatches start/poll into one `VideoJob` shape: `startVideoJob(modelId, input)` and `getVideoJob(modelId, requestId)`. Supports both `text-to-video` (full scene, e.g. a builder on-site or a person speaking) and `image-to-video` (animate a still). Use **veo-3** for spoken/UGC (native audio), **seedance-2.0**/**kling-2.5** for cinematic realism, **wan-2.5** for high-volume/budget.
- Exposed to the agent as the `generate_video` tool with a `model` + `mode` selector; renders stream as `media` SSE events. Every render is logged to `media_generations` (`lib/video/persistence.ts`, `supabase/schema.media.sql`) when Supabase is configured.
- API: `GET /api/video/models` lists the menu + which are configured; `POST/GET /api/generate-video` starts/polls a render (model-aware, backward compatible). Never throw on missing keys — return null/`unknown`.

### Meta Ads (MCP connector)
- Attach Pipeboard's hosted Meta Ads MCP to the orchestrator with Anthropic's **MCP connector** (`mcp_servers` + `mcp_toolset` on `anthropic.beta.messages.create`, beta header `mcp-client-2025-11-20`). Token auth via `PIPEBOARD_API_TOKEN` (`?token=` on the server URL).
- Only attached when configured; the agent runs normally without it. MCP tool calls execute server-side and surface in the telemetry feed.

### Supabase calls
- Use `supabaseAdmin` (service role) for all write operations
- Use `supabase` (anon key) for all read operations
- Always handle errors explicitly — never swallow them silently

---

## DESIGN RULES

- Dark theme always — background `#0a0a0a`, not default Tailwind dark classes
- Accent colour: amber (`amber-500`) for primary actions and highlights
- Success states: emerald
- Error states: red
- All cards: `rounded-xl border border-white/10 bg-white/[0.02]`
- Typography: tight, clean, no decorative fonts
- Loading states: always show a spinner or pulse animation — never leave the UI frozen
- Empty states: always show a helpful message — never a blank white box

---

## SUPABASE SCHEMA

```sql
CREATE TABLE creative_outputs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  campaign_angle TEXT NOT NULL,
  campaign_goal TEXT NOT NULL,
  hooks JSONB NOT NULL,
  body_copy JSONB NOT NULL,
  ctas JSONB NOT NULL,
  final_hook TEXT,
  final_body TEXT,
  final_cta TEXT,
  image_prompt TEXT,
  image_url TEXT,
  status TEXT DEFAULT 'draft',
  approved BOOLEAN DEFAULT FALSE
);
```

---

## GIT WORKFLOW

```bash
# After every meaningful change:
git add .
git commit -m "descriptive message"
git push origin main
```

Commit messages should describe what changed, not just say "update". Examples:
- `Add Higgsfield image generation route`
- `Fix JSON parsing in copy generation API`
- `Update BriefForm with angle presets`

---

## IMPORTANT FILE NOTE

`CLAUDE.md` (this file) = Claude Code rules only.
`brand/BRAND_MEMORY.md` = Summit Build Co brand intelligence injected into the copy agent at runtime.

Do not confuse them. Do not inject CLAUDE.md into API calls. Do not treat BRAND_MEMORY.md as project rules.

---

## SESSION START CHECKLIST

At the start of every session:
1. Read this file
2. Check which files already exist before creating new ones
3. Ask for clarification if a task is ambiguous before writing code
4. Confirm the task before starting — do not assume

---

## TESTING THE AGENT

You can't "see" the agent as a person — you see it work through the **Reactor
Telemetry** feed on the Campaign Reactor page. How to verify it's there:

**A. In the UI (easiest)**
1. Run `npm run dev`, open `/campaign-reactor`.
2. Pick a Campaign Angle, choose output types, hit **Fire Reactor**.
3. Watch the **Reactor Telemetry** panel stream the agent's steps:
   "Searching pattern: …", "└▸ pattern · Profit Pattern", "Loading Creative
   Learnings rubric…", "Scoring concepts…". Each concept shows a rubric score
   and a "Grounded in" basis.
   - **No `ANTHROPIC_API_KEY`** → demo mode: the feed shows the same step-by-step
     flow using the curated demo intelligence. Proves the wiring/UX.
   - **With `ANTHROPIC_API_KEY`** (+ optional `VOYAGE_API_KEY` + Supabase) → the
     feed shows the agent's *real* tool calls and retrievals.

**B. Hit the endpoint directly (proves the agent loop)**
```bash
curl -N -X POST http://localhost:3000/api/campaign-reactor \
  -H 'Content-Type: application/json' \
  -d '{"angle":"Profit","outputs":["Hook","Founder Concept"]}'
```
You'll see the SSE stream of `step` / `retrieval` / `concept` / `done` events —
that *is* the agent thinking out loud.

**C. Prove the learning loop**
- Mark a concept a **winner** in the UI (or POST `/api/campaign-reactor/outcome`).
  With Supabase + Voyage configured, it's re-ingested as a new `pattern` chunk and
  the next run can retrieve it.

To run the *real* agent end to end: set `ANTHROPIC_API_KEY` (agent),
`VOYAGE_API_KEY` (embeddings), and the Supabase keys (vector store), then run
`supabase/schema.reactor.sql` in Supabase.

---

## CURRENT BUILD STATUS

**Core platform**
- [x] Platform redesigned as TPB Creative Reactor (9 intelligence systems)
- [x] Dark glass command-center UI + logo + sidebar/topbar shell
- [x] RAG knowledge layer: pgvector schema + Voyage embeddings + ingest route
- [x] Agentic Campaign Reactor (Claude Opus 4.8 tool-use loop, streamed)
- [x] Learnings-as-rubric self-critique
- [x] Higgsfield image + video creatives as agent tools (`@higgsfield/client`)
- [x] Meta Ads MCP wired into the orchestrator (Anthropic MCP connector)

**Campaign Reactor V3 — the Creative Operating System**
- [x] Six-agent intelligence network (`lib/agents.ts`): OPUS · ATLAS · NOVA · SPARK · ECHO · ORACLE — replaces the old specialist coordinator
- [x] Strategic Intelligence Panel before Fire (`/api/campaign-reactor/intelligence`) — pain/desire/pattern/structures/positioning/consulted-assets/confidence
- [x] Intelligence-based telemetry (Market/Creative/Copy/Knowledge/Pattern updates + confidence); "Agent's pick" language removed
- [x] SPARK Winning Creative Intelligence — Creative DNA extraction + store (`lib/spark.ts`, `/api/spark/analyze`, SparkAnalyzer UI)
- [x] Production Brief system — frame-by-frame briefs drive image/video generation
- [x] Performance Intelligence (ORACLE): expanded outcome verdicts, strategic attributes, pattern confidence, strategic memory page
- [x] Agent Network page (`/network`) — living visibility dashboard grounded in live vault + outcome data

**Still open**
- [ ] SPARK URL-only ingestion for JS-rendered sources (Meta Ad Library / TikTok via oEmbed/transcript APIs; pasted script works today)
- [ ] Performance ingest (Meta API) → `campaign_outcomes` auto-ingest of live CTR/CPL/ROAS (manual verdicts done; metric columns ready)
- [ ] More dashboards reading live `knowledge_chunks` counts (Agent Network does; Research/Copy/Pattern still curated)
- [ ] Deployed + tested end to end with real keys

