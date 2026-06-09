# CLAUDE.md — Summit Build Co AI Creative System
## Claude Code Project Rules — Read This First Every Session

---

## PROJECT OVERVIEW

This is a Next.js MVP demo of a brand-trained AI creative system for residential construction marketing. It generates Meta ad copy via the Claude API and image creatives via the Higgsfield API, stores outputs in Supabase, and deploys to Vercel.

This is a demo build for a job interview. Quality, polish, and reliability matter above all else.

---

## ABSOLUTE RULES — NEVER BREAK THESE

- **Always commit to `main` directly. Never create a new branch.**
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
| Copy AI | Anthropic Claude API — model: `claude-sonnet-4-6` |
| Image AI | Higgsfield API |
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
ANTHROPIC_API_KEY
HIGGSFIELD_API_KEY
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

Always check these exist before building any API route. If missing, throw a clear error message — do not silently fail.

---

## API CONVENTIONS

### Claude API calls
- Model: `claude-sonnet-4-6` always
- Max tokens: 2000 for copy generation
- Always wrap in try/catch
- Always strip markdown fences before JSON.parse
- System prompt must always inject brand memory + skills content

### Higgsfield API calls
- Always check response status before parsing
- Image URL extraction: check `data.url`, `data.image_url`, `data.output?.[0]` in that order
- Return null for imageUrl if generation fails — never throw, the copy is still usable

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

## CURRENT BUILD STATUS

Track progress here as the build progresses:

- [ ] Project initialised (Next.js + Tailwind + shadcn)
- [ ] TypeScript types created
- [ ] Supabase client set up
- [ ] Brand memory reader working
- [ ] Skills reader working
- [ ] Generate copy API route working
- [ ] Generate image API route working
- [ ] Save output API route working
- [ ] BriefForm component complete
- [ ] CopyOutput component complete
- [ ] ImageOutput component complete
- [ ] AdPreview component complete
- [ ] Main page wired up end to end
- [ ] Deployed to Vercel
- [ ] Demo tested end to end
