/**
 * Shared input contract for the Campaign Reactor multi-step modal.
 *
 * The modal (client) collects a `ReactorInputs` object across four slides; the
 * orchestrator route (server) reads the same shape to construct its system
 * prompt blocks in a fixed order. Keep this file framework-agnostic (pure data
 * + types) so both sides can import it.
 */

export interface BrandSettings {
  voiceGuidelines: string
  toneRules: string
}

/**
 * The Strategic Intelligence read OPUS presents before the reactor fires — the
 * platform thinking out loud. Sourced from `/api/campaign-reactor/intelligence`
 * (real retrieval + optional OPUS synthesis), it is intelligence, never exposed
 * agent machinery.
 */
export interface StrategicIntelligence {
  awareness: string
  primaryPain: string
  primaryDesire: string
  primaryPattern: string
  recommendedCreativeStructure: string
  recommendedCopyStructure: string
  recommendedOfferPositioning: string
  knowledgeAssetsConsulted: string[]
  researchSourcesConsulted: string[]
  confidence: 'High' | 'Medium' | 'Exploratory'
  confidenceScore: number
}

/**
 * A structured production brief — SPARK's frame-by-frame plan for a visual
 * concept. Image and video generation is driven by these briefs rather than raw
 * prompts so every asset is built from a deliberate creative structure.
 */
export interface ProductionFrame {
  label: string
  description: string
}

export interface ProductionBrief {
  creativeType: string
  pattern: string
  audience: string
  awareness: string
  frames: ProductionFrame[]
}

/** Turn a production brief into a single rich generation prompt. */
export function briefToPrompt(brief: ProductionBrief | undefined, fallback: string): string {
  if (!brief?.frames?.length) return fallback
  const frames = brief.frames
    .map((f, i) => `Frame ${i + 1} — ${f.label}: ${f.description}`)
    .join('\n')
  return `${brief.creativeType} ad creative for The Professional Builder. Pattern: ${brief.pattern}. Audience: ${brief.audience}. Awareness: ${brief.awareness}.\n${frames}\n\nRender premium, photographic, on-site builder context, high contrast, room for text overlay.`
}

export interface ReactorInputs {
  brief: string
  angle: string
  angleIsAgentDecided: boolean
  outputTypes: string[]
  outputTypesAgentDecided: boolean
  awarenessStage: string
  awarenessDirective: string
  audienceType: string
  audienceDirective: string
  offerType: string
  offerTypeDirective: string
  offerName: string
  onBrandEnabled: boolean
  brandSettings: BrandSettings
}

/* ----------------------------------------------------------------------------
   Strategic-input vocabulary shared by the modal and the orchestrator.

   NO_PREFERENCE is the universal "let Reactor decide dynamically" sentinel — it
   sits at index 0 of every strategic option list. CUSTOM_* are the labels that
   reveal a free-text field so an advanced user can supply an angle / audience /
   offer that isn't in the menu. Both the UI and the route treat a custom value
   exactly like a native one.
---------------------------------------------------------------------------- */

export const NO_PREFERENCE = 'No Preference'
export const CUSTOM_ANGLE = 'Custom Angle…'
export const CUSTOM_AUDIENCE = 'Custom Audience…'
export const CUSTOM_OFFER = 'Custom Offer…'

/**
 * ORACLE strategic-memory evidence for a recommended angle — how many stored
 * campaigns share this strategic configuration, how many won, and their average
 * win score. Null/zeroed when the angle is new (no memory yet).
 */
export interface AngleEvidence {
  similar: number
  winners: number
  avgWinScore: number | null
}

/**
 * The Dynamic Strategy Engine's read of a brief. The angle is NOT constrained to
 * the base categories — NOVA/ORACLE/OPUS can surface a sharper angle (e.g.
 * "Profit Leak") that the dropdown then adopts. Strategy defines the dropdown,
 * not the other way around.
 */
export interface ReactorSuggestion {
  angle: string
  angleConfidence: number
  angleReason: string
  awareness: string
  audience: string
  offer: string
  deliverables: string[]
  deliverablesReason: string
  evidence: AngleEvidence | null
}

/**
 * Directive injected when the user supplies a custom value. OPUS must treat it
 * as a hard strategic constraint that flows through research, creative, copy,
 * and pattern analysis — without breaking the recommendation system.
 */
export function customDirective(field: 'angle' | 'audience' | 'offer', value: string): string {
  const v = value.trim()
  if (field === 'angle') {
    return `The user supplied a CUSTOM campaign angle: "${v}". Treat this as a hard strategic constraint. Build every concept, hook, and production brief around this angle. Ground research, creative, copy, and pattern selection in it — do not substitute a different angle.`
  }
  if (field === 'audience') {
    return `The user supplied a CUSTOM target audience: "${v}". Treat this as a hard strategic constraint. Tailor research, creative, copy, and pattern selection to this exact audience. Do not substitute a generic segment.`
  }
  return `The user supplied a CUSTOM offer: "${v}". Treat this as the campaign's offer and CTA frame. Build research, creative, copy, and pattern analysis around delivering and converting on this specific offer. Use this exact offer in every CTA.`
}

/* ----------------------------------------------------------------------------
   Brand settings — sourced from the Settings tab once that store exists. Until
   then this curated default stands in so the ON BRAND toggle still drives the
   prompt injection. Wire this to the real settings store when it ships.
---------------------------------------------------------------------------- */

export const defaultBrandSettings: BrandSettings = {
  voiceGuidelines:
    'Voice: confident, specific, builder-native — operator to operator. Speak the language of trades business owners. Lead with concrete numbers and named proof over adjectives. No hype, no fluff, no guru clichés.',
  toneRules:
    'Tone: direct, grounded, respectful of the reader’s intelligence. Short sentences. Identity-led, not hustle-led. Every claim is earned with evidence. Engineered for performance.',
}

/* ------------------------------- Slide 1 ---------------------------------- */

export const angleOptions = [
  NO_PREFERENCE,
  'Profit',
  'Time Freedom',
  'Systems',
  'Growth',
  'Owner Identity',
] as const

export const outputTypeOptions = [
  'Hooks',
  'Headlines',
  'Static Concepts',
  'Video Concepts',
  'Founder Concepts',
  'VSL Openers',
  'Testimonial Concepts',
] as const

/* ------------------------------- Slide 2 ---------------------------------- */

export interface DirectiveOption {
  label: string
  directive: string
}

export const awarenessOptions: DirectiveOption[] = [
  {
    label: NO_PREFERENCE,
    directive:
      'The user has no awareness-stage preference — determine the most appropriate awareness stage from the campaign brief and angle. If no clear signal, default to Problem-Aware for cold traffic.',
  },
  {
    label: 'Unaware',
    directive:
      'The audience does not yet name their problem. Open on a felt symptom or a relatable scene — a moment in their day that mirrors the pain. Do NOT name a solution, a method, or a product category early. Goal: make them recognise themselves before they know why they’re watching.',
  },
  {
    label: 'Problem-Aware',
    directive:
      'The audience feels the pain but doesn’t know structured solutions exist. Open by naming the pain with precision and agitating the real cost of staying there — time, margin, relationships, identity. Then reveal that a path exists. Do not lead with the offer.',
  },
  {
    label: 'Solution-Aware',
    directive:
      'The audience knows solutions exist and is comparing approaches — coaching, hiring, DIY systems. Lead with mechanism: the specific reason THIS approach beats the alternatives they are already weighing. Skip the problem build.',
  },
  {
    label: 'Product-Aware',
    directive:
      'The audience knows TPB and has considered it but hasn’t committed. Lead with proof — named member results, specific figures. Add risk reversal and a clear reason to act now. Minimise problem education.',
  },
  {
    label: 'Most-Aware',
    directive:
      'The audience is ready. Lead directly with the offer and a reason to act now. Short, punchy, direct. Skip the problem and mechanism build entirely.',
  },
]

export const audienceOptions: DirectiveOption[] = [
  {
    label: NO_PREFERENCE,
    directive:
      'The user has no audience preference — determine audience temperature and ad type from the brief and angle. If no clear signal, default to cold prospecting.',
  },
  {
    label: 'Cold — new audience',
    directive:
      'Cold traffic with no prior exposure to TPB. The ad must earn attention from scratch, frame the problem, and build enough credibility to warrant the next step. Do not assume any familiarity with TPB or its methods.',
  },
  {
    label: 'Warm — saw content, didn’t convert',
    directive:
      'Warm audience. Has seen TPB content or ads but hasn’t taken action. Has some familiarity. Lead with proof, deepen the mechanism, and address the most likely objection holding them back from acting.',
  },
  {
    label: 'Retargeting — visited sales page',
    directive:
      'Hot audience. Visited the sales or application page — they considered it. Lead with urgency, social proof, and objection handling. Short, direct, reason-to-act-now. Minimal problem education required.',
  },
  {
    label: 'Retargeting — started application',
    directive:
      'Hottest audience. Started the application and didn’t finish — they want in. The concept must remove the final friction and address the most likely reason someone stops mid-application. Direct CTA back to complete.',
  },
  {
    label: 'Re-engagement — past lead',
    directive:
      'Audience who engaged previously but went cold. Pattern interrupt is key. Show what has changed or what they have missed. New proof, new angle, new urgency.',
  },
  {
    label: 'Re-engagement — past member',
    directive:
      'Former members or alumni who know TPB well. Lead with transformation, what’s new in the program, and what peers have achieved since they left. Nostalgia + social proof + FOMO.',
  },
]

export const offerOptions: DirectiveOption[] = [
  {
    label: NO_PREFERENCE,
    directive:
      'The user has no offer preference — select the most appropriate offer type and CTA frame based on the campaign brief, angle, and awareness stage.',
  },
  {
    label: 'Strategy Call / Application',
    directive:
      'High-commitment next step. The concept must qualify hard — state exactly who this is for and who it is not. Carry heavy social proof with named results. Pre-frame the call as valuable and selective, not a sales pitch. High proof burden.',
  },
  {
    label: 'Webinar / Masterclass',
    directive:
      'Medium friction. Sell the ONE insight or transformation they will walk away with. Curiosity and outcome-driven. The CTA promise is the discovery, not the product.',
  },
  {
    label: 'Free Lead Magnet',
    directive:
      'Low friction, easy yes. Lead with the specific tangible promise of the asset. Light proof burden, heavy emphasis on the concrete deliverable they receive immediately.',
  },
  {
    label: 'Live Event / In-Person',
    directive:
      'Lead with scarcity, the room, and who else will be there. Urgency is primary. Date, location, and limited seats are the creative levers.',
  },
  {
    label: 'Low-Ticket Offer',
    directive:
      'Transactional. Lead with value-to-price asymmetry and the immediate outcome they receive. Price anchoring matters here.',
  },
]

/** A fresh, agent-decides-everything input set — the modal's starting state. */
export function createDefaultInputs(): ReactorInputs {
  return {
    brief: '',
    angle: angleOptions[0],
    angleIsAgentDecided: true,
    outputTypes: [],
    outputTypesAgentDecided: true,
    awarenessStage: awarenessOptions[0].label,
    awarenessDirective: awarenessOptions[0].directive,
    audienceType: audienceOptions[0].label,
    audienceDirective: audienceOptions[0].directive,
    offerType: offerOptions[0].label,
    offerTypeDirective: offerOptions[0].directive,
    offerName: '',
    onBrandEnabled: true,
    brandSettings: defaultBrandSettings,
  }
}
