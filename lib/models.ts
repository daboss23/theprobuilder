// Single source of truth for the Claude models the platform runs on.
//
// Two tiers, matching the architecture in CLAUDE.md / SYSTEM_DESIGN.md:
//
// - ORCHESTRATOR_MODEL — OPUS, the Master Strategist. Multi-step reasoning over
//   retrieved evidence and the tool-use loop. Our most capable model; this is
//   the one place worth paying Opus rates for.
// - INTELLIGENCE_MODEL — the cheaper tier the consultable layers
//   (ATLAS/NOVA/SPARK/ECHO/ORACLE), the NEURO pre-test, and bulk/single-shot
//   copy run on. Structured, high-volume work.
//
// Bumping a model is a one-line change here. Everything else imports these.
export const ORCHESTRATOR_MODEL = 'claude-opus-4-8'
export const INTELLIGENCE_MODEL = 'claude-sonnet-5'
