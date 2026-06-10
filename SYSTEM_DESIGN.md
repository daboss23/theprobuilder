# System Design - Builder Growth Engine

A productized agency platform: onboard an unlimited number of building
companies and apply a shared library of marketing frameworks plus per-client
intelligence to produce ad creative that compounds in quality over time.

This document is the build spec. It is a living draft (v0.1).

## 1. The model

The agency owns a reusable **engine** (frameworks + process). Each builder is
an **instance**: same process, different messaging. Onboard once, repeat
infinitely.

Two layers:

- **Shared (agency IP, reused for every builder):** the frameworks - Meta
  copy / image / video frameworks, hooks library, the playbook.
- **Per-builder (fresh each client):** brand profile, audience research,
  results and learnings.

At generation the agent merges **[global frameworks] + [this builder's
profile + insights + results]** into the prompt.

## 2. The lifecycle (the flywheel)

1. **Onboard** - capture the builder: brand, voice, who they serve, offer,
   proof, visual style. (Stored in `builders`.)
2. **Research** - an agent gathers real voice-of-customer intel (pains,
   desires, objections, the literal phrases) from legitimate sources and
   stores a reviewed Audience Insight Profile. (`insights`.)
3. **Generate** - retrieval assembles brand + relevant frameworks + audience
   insights + past winners, and the models write copy + image/video prompts.
   (`creative_outputs`.)
4. **Learn** - performance flows back in (manual or Meta API), labelled
   win/lose. The agent distils patterns and feeds them into the next
   generation. (`results`, `learnings`.)

Each lap sharpens the next - for that specific builder.

## 3. Data model

See `supabase/schema.platform.sql`. Summary:

| Table | Scope | Purpose |
|---|---|---|
| `builders` | tenant | one row per building company onboarded |
| `frameworks` | global (builder_id null) or per-builder | the agency's shared playbook |
| `insights` | per builder | voice-of-customer research (with sources) |
| `creative_outputs` | per builder | generated copy + image prompts/urls |
| `results` | per builder | ad performance (source: manual or meta_api) |
| `learnings` | per builder | distilled "what worked / what didn't" |

## 4. Generation flow

For a chosen builder + brief, the generator:

1. Loads the builder profile.
2. Retrieves relevant **frameworks** (global + any builder overrides).
3. Retrieves the builder's **audience insights**, **top/bottom performers**
   and **learnings**.
4. Injects all of it and calls Claude (primary) + OpenAI (comparison) for
   copy, then Higgsfield + gpt-image-1 for creative.

Early phases inject by category; later phases use embeddings to retrieve only
the most relevant chunks (keeps prompts small as the library grows).

## 5. Research layer (voice-of-customer)

- **Agentic:** search -> read -> extract real customer language -> synthesise
  -> store. This is where tool-use / the Agent SDK earns its place.
- **Sources, per niche:** for builders the goldmines are Reddit, Australian
  building forums (HomeOne, Whirlpool), ProductReview.com.au, Google reviews,
  YouTube comments. Pinterest is for *visual* trend mining, not pain language.
  Amazon is irrelevant for builders.
- **Legit access only:** official APIs (Reddit, YouTube) + agent search APIs
  (Tavily / Exa / Brave) + Anthropic's web-search tool. No ToS-violating
  scraping.
- **Grounded:** every insight cites a real source/quote - no invented
  "customers say". A human reviews the profile before it feeds copy.
- **Cadence:** run per builder on demand / monthly and cache the profile - not
  on every generation (slow + costs).

## 6. Results and learning

- **One `results` table, two sources:** `manual` (day one, zero risk) and
  `meta_api` (Meta Marketing API / Ads Insights, `ads_read`).
- **Fault-isolated:** the Meta sync is a separate background job with
  rate-limit backoff. If Meta throttles, a token expires, or it is down, it
  logs and retries - the creative engine never depends on it and never
  crashes.
- **Read-only reporting is sanctioned** and will not get the account flagged;
  flagging comes from policy-violating automation, not pulling your own stats.
- **Gating for production Meta:** App Review for `ads_read` + per-builder
  OAuth / token management. Manual entry covers everything until then.
- **Negative signal matters:** losers are stored too - a "do not repeat" list
  is as valuable as the winners.

## 7. Roadmap

- **P1 - Onboarding + client layer.** Builder intake form; `builders` table;
  the generator reads the selected builder instead of the hardcoded brand
  file.
- **P2 - Frameworks library.** Upload/manage the agency playbook (global) +
  per-builder overrides; inject by category.
- **P3 - Research layer.** Voice-of-customer agent -> reviewed Audience
  Insight Profile.
- **P4 - Results + learning.** Manual results first, then Meta API; distilled
  learnings feed retrieval.
- **P5 - Retrieval + autonomy.** Embeddings-based retrieval; auto-learnings;
  Meta auto-sync; agentic orchestration.

By P3 the flywheel is turning; P4-P5 make it autonomous.

## 8. Honest constraints

- The loop only "learns" once **results data** flows in - without outcomes it
  is just a bigger knowledge base.
- Early on, a handful of results is **not a pattern** - treat learnings as
  guidance until volume builds.
- **Curation beats volume** - tag and prune; a tight library outperforms a
  dumping ground.
- Keep builders **isolated** - one client's winners do not leak into another's
  brand unless a deliberate cross-client "playbook" layer is added.
- "Gets smarter" = richer, better-labelled **memory + retrieval**, not the
  base model retraining itself. Fine-tuning on winners is an optional later
  layer.
