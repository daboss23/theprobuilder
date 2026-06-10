-- P2: Frameworks library seed migration.
-- The `frameworks` table already exists in schema.platform.sql.
-- Run this to pre-populate with starter global frameworks.
-- Safe to re-run: ON CONFLICT DO NOTHING.

-- Seed a global copy framework
INSERT INTO frameworks (title, category, content, builder_id, tags)
VALUES (
  'Meta 5-Step Copy Framework',
  'copy',
  'Structure every ad with this 5-step flow:

1. HOOK — Grab attention in 3 words or fewer. Pattern interrupt. Specific number or provocative claim.
2. PROBLEM — Name the real pain. Use the customer''s exact language, not marketing language.
3. AGITATE — Twist the knife once. One more consequence they haven''t thought of.
4. SOLUTION — Introduce the builder and the specific mechanism that solves the problem.
5. CTA — One action, one outcome. "Book your free site assessment" not "Contact us today."

Rules: No adjectives that aren''t backed by proof. Every claim needs a number or a name. Write at a Year 8 reading level.',
  NULL,
  ARRAY['structure', 'conversion', 'meta']
) ON CONFLICT DO NOTHING;

-- Seed a global hook framework
INSERT INTO frameworks (title, category, content, builder_id, tags)
VALUES (
  'Builder Hook Patterns',
  'hook',
  'Proven hook structures for residential builder ads:

PATTERN 1 — THE QUESTION HOOK
"Still waiting [X months] for a builder to call you back?"
"Can your builder actually tell you what your home will cost to run?"

PATTERN 2 — THE BOLD CLAIM HOOK
"We''ve built 200+ homes in [Region] without a single cost blowout."
"Fixed price. No asterisks. [Builder name] — [years] years, [number] homes."

PATTERN 3 — THE IDENTITY HOOK
"For families who refuse to compromise on the home they''ve been planning for years."
"Built for people who''ve been burned by a builder before."

PATTERN 4 — THE CONTRAST HOOK
"Most builders: vague quotes, moving timelines. [Builder name]: fixed price, fixed timeline."

PATTERN 5 — THE INSIDER HOOK
"The thing no builder will tell you before you sign."
"3 questions every family should ask before choosing a builder (and why most won''t answer them)."

Rules: One idea per hook. Specificity beats cleverness. Test the question pattern first.',
  NULL,
  ARRAY['hooks', 'attention', 'openings']
) ON CONFLICT DO NOTHING;

-- Seed a global image framework
INSERT INTO frameworks (title, category, content, builder_id, tags)
VALUES (
  'Builder Ad Image Guidelines',
  'image',
  'Image brief principles for residential builder Meta ads:

WHAT WORKS:
- Real homes in real light. Exterior golden hour (7am or 5pm). Interior: warm kitchen scenes.
- Humans in frame: a couple reviewing plans, a family standing outside their finished home, a site walk with the builder.
- Proof shots: framed walls, concrete slab, trades working — shows the builder is active and real.
- Contrast pairs: the raw site → the finished home. Before/after performs strongly.

WHAT DOESN''T WORK:
- Stock photography gloss. Looks like every other ad.
- Empty homes with no warmth. No sense of life.
- Overhead drone shots without context. Too distant.
- Dark, moody edits. This audience wants optimism and clarity.

COMPOSITION RULES:
- Leave room for text overlay (bottom third or left third clear).
- Square (1:1) or vertical (4:5) for Feed. 9:16 for Stories and Reels.
- Brand colour palette: include warm timber, stone, or amber accents if possible.

CAPTION FOR IMAGE AI: Always start with the shot type (wide exterior, lifestyle interior, drone establishing, construction progress) then the subject, then the mood and light.',
  NULL,
  ARRAY['image', 'creative', 'visual']
) ON CONFLICT DO NOTHING;
