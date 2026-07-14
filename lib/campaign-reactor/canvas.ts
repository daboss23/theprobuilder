/**
 * Creative Canvas — pure data layer.
 *
 * Turns a finished Campaign Reactor run (the scored, cited, NEURO-tested
 * `Concept[]` held in `ReactorRunContext`) into a palette of mix-and-match
 * building blocks the user can assemble into a live ad on the canvas. No React,
 * no DOM — just the categorisation, the colour themes, and the compose resolver,
 * so both the canvas surface and the preview card can import the same shapes.
 *
 * The canvas is the hands-on counterpart to the autonomous reactor: OPUS already
 * decided what to make; here the human re-mixes the winning parts — hook +
 * headline + body + CTA + visual + colour — and sees the assembled ad update
 * live. Nothing here calls the model; it only re-arranges what the run produced.
 */

import type { Concept } from '@/components/campaign-reactor/ReactorRunContext'
import type { Accent } from '@/components/reactor/ui'

/* -------------------------------------------------------------------------- */
/*  Categories                                                                */
/* -------------------------------------------------------------------------- */

export type BlockCategory = 'hook' | 'headline' | 'body' | 'cta' | 'visual' | 'theme'

/** Lane order across the canvas, left → right (visual + theme feed the look). */
export const CATEGORY_ORDER: BlockCategory[] = ['hook', 'headline', 'body', 'cta', 'visual', 'theme']

export interface CategoryDef {
  id: BlockCategory
  /** Lane title. */
  label: string
  /** Accent channel class identity (globals.css `.acc-*`). */
  accent: Accent
  /** One-line lane hint. */
  hint: string
}

export const CATEGORY_DEFS: Record<BlockCategory, CategoryDef> = {
  hook: { id: 'hook', label: 'Hooks', accent: 'emerald', hint: 'The scroll-stopper' },
  headline: { id: 'headline', label: 'Headlines', accent: 'cyan', hint: 'The promise' },
  body: { id: 'body', label: 'Body Copy', accent: 'blue', hint: 'The argument' },
  cta: { id: 'cta', label: 'Calls to Action', accent: 'amber', hint: 'The ask' },
  visual: { id: 'visual', label: 'Visuals', accent: 'violet', hint: 'The creative' },
  theme: { id: 'theme', label: 'Colour Themes', accent: 'pink', hint: 'The look' },
}

/* -------------------------------------------------------------------------- */
/*  Colour themes — the "mix the look" axis                                   */
/* -------------------------------------------------------------------------- */

/**
 * A colour theme repaints the live ad preview. Every visual token is a static
 * Tailwind class string (or arbitrary value) so the content scanner keeps them
 * and we never reach for inline styles. Accent maps back to an `.acc-*` channel
 * so the theme block chip glows in its own colour.
 */
export interface CanvasTheme {
  id: string
  label: string
  accent: Accent
  /** Two swatch colours shown on the theme block + ad chrome (arbitrary hex). */
  swatchFrom: string
  swatchTo: string
  /** Ad-preview surface (background + border). */
  surface: string
  /** Headline text colour. */
  headline: string
  /** CTA button (background + text + border). */
  cta: string
  /** Accent hairline / glow ring on the preview. */
  ring: string
}

export const CANVAS_THEMES: CanvasTheme[] = [
  {
    id: 'forge',
    label: 'Amber Forge',
    accent: 'amber',
    swatchFrom: 'from-[#38E8FF]',
    swatchTo: 'to-[#4D8DFF]',
    surface: 'bg-[#120A06] border-[#FF7A3D]/35',
    headline: 'text-[#FFD9B8]',
    cta: 'bg-gradient-to-b from-[#38E8FF] to-[#4D8DFF] text-[#04101F] border-[#A9ECFF]/60',
    ring: 'shadow-[0_0_42px_-16px_rgba(255,122,61,0.85)]',
  },
  {
    id: 'ice',
    label: 'Ice Blue',
    accent: 'blue',
    swatchFrom: 'from-[#7FC4FF]',
    swatchTo: 'to-[#2F6BFF]',
    surface: 'bg-[#060C18] border-[#5EA8FF]/35',
    headline: 'text-[#CFE6FF]',
    cta: 'bg-gradient-to-b from-[#7FC4FF] to-[#2F6BFF] text-[#04101F] border-[#A9D2FF]/60',
    ring: 'shadow-[0_0_42px_-16px_rgba(94,168,255,0.85)]',
  },
  {
    id: 'signal',
    label: 'Emerald Signal',
    accent: 'emerald',
    swatchFrom: 'from-[#6EE7B7]',
    swatchTo: 'to-[#10B981]',
    surface: 'bg-[#05130F] border-[#34D399]/35',
    headline: 'text-[#BBF7DE]',
    cta: 'bg-gradient-to-b from-[#6EE7B7] to-[#10B981] text-[#042016] border-[#A7F3D0]/60',
    ring: 'shadow-[0_0_42px_-16px_rgba(52,211,153,0.85)]',
  },
  {
    id: 'pulse',
    label: 'Violet Pulse',
    accent: 'violet',
    swatchFrom: 'from-[#C4B5FD]',
    swatchTo: 'to-[#7C3AED]',
    surface: 'bg-[#0B0718] border-[#A78BFA]/35',
    headline: 'text-[#E6DEFF]',
    cta: 'bg-gradient-to-b from-[#C4B5FD] to-[#7C3AED] text-[#120A24] border-[#DDD6FE]/60',
    ring: 'shadow-[0_0_42px_-16px_rgba(167,139,250,0.85)]',
  },
  {
    id: 'steel',
    label: 'Mono Steel',
    accent: 'cyan',
    swatchFrom: 'from-[#E2E8F0]',
    swatchTo: 'to-[#64748B]',
    surface: 'bg-[#0A0F18] border-white/20',
    headline: 'text-white',
    cta: 'bg-gradient-to-b from-white to-[#94A3B8] text-[#0A0F18] border-white/60',
    ring: 'shadow-[0_0_42px_-16px_rgba(226,232,240,0.6)]',
  },
]

export const DEFAULT_THEME_ID = CANVAS_THEMES[0].id

export function themeById(id: string | undefined): CanvasTheme {
  return CANVAS_THEMES.find((t) => t.id === id) ?? CANVAS_THEMES[0]
}

/* -------------------------------------------------------------------------- */
/*  Blocks                                                                    */
/* -------------------------------------------------------------------------- */

export interface CanvasBlock {
  id: string
  category: BlockCategory
  /** Short source-type label, e.g. "Hook", "VSL Opener", "Founder Concept". */
  label: string
  /** The content. For theme blocks this is the theme label. */
  text: string
  /** Self-assessed rubric score (1–10) carried from the concept, when present. */
  score?: number
  /** What intelligence layer / asset the piece is grounded in. */
  basis?: string
  /** Generated still for a visual block (from the agent or a manual render). */
  imageUrl?: string
  /** Theme id for a theme block. */
  themeId?: string
  /** The originating concept (visual blocks) so the canvas can render its image. */
  concept?: Concept
}

/** Map a concept's output type to a canvas lane. Order is significant. */
function categorize(type: string): BlockCategory {
  const t = type.toLowerCase()
  if (/hook/.test(t)) return 'hook'
  if (/headline/.test(t)) return 'headline'
  if (/\bcta\b|call to action/.test(t)) return 'cta'
  if (/concept/.test(t)) return 'visual'
  if (/primary text|body|opener|vsl|caption|description|copy/.test(t)) return 'body'
  return 'body'
}

/** A curated CTA palette, seeded with the run's named offer when supplied. */
function ctaBlocks(offerName?: string): CanvasBlock[] {
  const labels = [
    'Apply Now',
    'Book a Free Strategy Call',
    'Get the Free Guide',
    'Watch the Masterclass',
    'Reserve My Seat',
    'Start Today',
  ]
  const named = offerName?.trim()
  const all = named ? [`Get ${named}`, ...labels] : labels
  return all.map((text, i) => ({
    id: `cta-${i}`,
    category: 'cta' as const,
    label: 'Call to Action',
    text,
  }))
}

/** Theme blocks — the colour-mix lane. */
function themeBlocks(): CanvasBlock[] {
  return CANVAS_THEMES.map((t) => ({
    id: `theme-${t.id}`,
    category: 'theme' as const,
    label: 'Theme',
    text: t.label,
    themeId: t.id,
  }))
}

/**
 * Explode a finished run into the full building-block palette: copy blocks from
 * the concepts, the CTA palette, and the theme swatches. Copy/visual blocks are
 * sorted best-first (rubric score) so the strongest piece sits at the top of its
 * lane and seeds the auto-composition.
 */
export function buildBlocks(concepts: Concept[], offerName?: string): CanvasBlock[] {
  const fromConcepts: CanvasBlock[] = concepts.map((c, i) => {
    const category = categorize(c.type)
    return {
      id: `c-${i}`,
      category,
      label: c.type,
      text: c.text,
      score: c.score,
      basis: c.basis,
      imageUrl: c.imageUrl,
      concept: category === 'visual' ? c : undefined,
    }
  })

  const byScore = (a: CanvasBlock, b: CanvasBlock) => (b.score ?? 0) - (a.score ?? 0)
  const copy = fromConcepts.filter((b) => b.category !== 'cta').sort(byScore)
  // Concepts rarely emit explicit CTAs — fold any it did emit in ahead of the palette.
  const conceptCtas = fromConcepts.filter((b) => b.category === 'cta')

  return [...copy, ...conceptCtas, ...ctaBlocks(offerName), ...themeBlocks()]
}

/** Blocks for one lane, in display (and stacking) order. */
export function blocksInCategory(blocks: CanvasBlock[], category: BlockCategory): CanvasBlock[] {
  return blocks.filter((b) => b.category === category)
}

/* -------------------------------------------------------------------------- */
/*  Composition                                                               */
/* -------------------------------------------------------------------------- */

/** The user's current selection — one block id per lane (null = unfilled). */
export type Composition = Record<BlockCategory, string | null>

export const EMPTY_COMPOSITION: Composition = {
  hook: null,
  headline: null,
  body: null,
  cta: null,
  visual: null,
  theme: null,
}

/** Seed a composition with the best block in each lane so the preview is never blank. */
export function autoComposition(blocks: CanvasBlock[]): Composition {
  const comp: Composition = { ...EMPTY_COMPOSITION }
  for (const cat of CATEGORY_ORDER) {
    const first = blocks.find((b) => b.category === cat)
    comp[cat] = first ? first.id : null
  }
  // Always land on a real theme even if (impossibly) none matched.
  if (!comp.theme) comp.theme = `theme-${DEFAULT_THEME_ID}`
  return comp
}

export interface ComposedAd {
  hook?: CanvasBlock
  headline?: CanvasBlock
  body?: CanvasBlock
  cta?: CanvasBlock
  visual?: CanvasBlock
  theme: CanvasTheme
}

/** Resolve the selection ids into the concrete blocks the preview renders. */
export function composeAd(blocks: CanvasBlock[], comp: Composition): ComposedAd {
  const find = (cat: BlockCategory) => blocks.find((b) => b.id === comp[cat]) ?? undefined
  const themeBlock = find('theme')
  return {
    hook: find('hook'),
    headline: find('headline'),
    body: find('body'),
    cta: find('cta'),
    visual: find('visual'),
    theme: themeById(themeBlock?.themeId),
  }
}

/** Flatten the composed ad into copy-and-pasteable ad text. */
export function composedToText(ad: ComposedAd): string {
  const lines: string[] = []
  if (ad.hook) lines.push(ad.hook.text)
  if (ad.body) lines.push('', ad.body.text)
  if (ad.headline) lines.push('', `Headline: ${ad.headline.text}`)
  if (ad.cta) lines.push('', `CTA: ${ad.cta.text}`)
  return lines.join('\n').trim()
}
