'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Atom, Loader2 } from 'lucide-react'
import { Panel, PanelHeader } from '@/components/reactor/ui'
import {
  ReactorModal,
  type ReactorForm,
  type StrategicField,
} from '@/components/campaign-reactor/ReactorModal'
import {
  LiveAgentWorkflow,
  type WorkflowControls,
} from '@/components/campaign-reactor/workflow/LiveAgentWorkflow'
import { reactorOutputTypes, winningAngles } from '@/lib/reactor-data'
import { INTEL_SOURCES, intelSourceLabel } from '@/lib/intelligence-sources'
import {
  awarenessOptions,
  audienceOptions,
  offerOptions,
  defaultBrandSettings,
  customDirective,
  NO_PREFERENCE,
  type AngleEvidence,
  type DirectiveOption,
  type ReactorInputs,
  type ReactorSuggestion,
  type StrategicIntelligence,
} from '@/lib/reactor-inputs'
import { recommendVideoModel } from '@/lib/video/recommend'
import type { ModelAvailability } from '@/lib/video/types'
import { recommendImageModel } from '@/lib/image/recommend'
import type { ImageModelAvailability } from '@/lib/image/types'
import { useReactorRun, type Concept } from '@/components/campaign-reactor/ReactorRunContext'
import type { Verdict, OutcomeAttributes } from '@/lib/outcomes'

// The native campaign-angle choices (the No Preference / Custom sentinels are
// added by the dropdown itself).
const ANGLE_NAMES = winningAngles.map((a) => a.name)

// Client-safe verdict menu (no import from lib/outcomes runtime — that module is
// server-only). Mirrors the Performance Intelligence verdict set.
const VERDICT_OPTIONS: { value: Verdict; label: string }[] = [
  { value: 'winner', label: 'Winner' },
  { value: 'high_performer', label: 'High Performer' },
  { value: 'average', label: 'Average' },
  { value: 'loser', label: 'Loser' },
]

export function Workbench() {
  // Run + media state lives in the persistent platform-layout provider, so an
  // in-flight reactor run survives navigating to another dashboard and back.
  const {
    phase,
    streamReactor,
    generateCreative,
    animate,
    generateUGC,
    markOutcome,
  } = useReactorRun()
  const [modalOpen, setModalOpen] = useState(false)
  // Selected intelligence source IDs — the agents recommend a subset from the
  // brief (behind the scenes); OPUS runs on this set. Empty until the brief
  // produces recommendations, then defaulted to the full set at fire time.
  const [activeInputs, setActiveInputs] = useState<string[]>([])
  // Strategic fields start at No Preference; Strategic Intelligence fills in the
  // recommendation once the brief has substance. The user can override, choose
  // No Preference, or enter a custom value.
  const [angle, setAngle] = useState<string>(NO_PREFERENCE)
  // Deliverables start empty — OPUS recommends a subset from the brief, which is
  // auto-selected until the user overrides.
  const [outputs, setOutputs] = useState<string[]>([])
  const [recommendedDeliverables, setRecommendedDeliverables] = useState<string[]>([])
  const [deliverablesReason, setDeliverablesReason] = useState('')
  // Strategic reasoning for the recommended angle (Dynamic Strategy Engine).
  const [angleReason, setAngleReason] = useState('')
  const [angleConfidence, setAngleConfidence] = useState<number | undefined>(undefined)
  const [angleEvidence, setAngleEvidence] = useState<AngleEvidence | null>(null)
  // Strategic fields (the guided step-by-step inputs)
  const [brief, setBrief] = useState('')
  const [awareness, setAwareness] = useState(awarenessOptions[0])
  const [audience, setAudience] = useState(audienceOptions[0])
  const [offer, setOffer] = useState(offerOptions[0])
  const [offerName, setOfferName] = useState('')
  // Custom strategic values — advanced users can supply an angle / audience /
  // offer the menu doesn't have. The custom text becomes the live value.
  const [angleCustom, setAngleCustom] = useState(false)
  const [customAngle, setCustomAngle] = useState('')
  const [audienceCustom, setAudienceCustom] = useState(false)
  const [customAudience, setCustomAudience] = useState('')
  const [offerCustom, setOfferCustom] = useState(false)
  const [customOffer, setCustomOffer] = useState('')
  // The labels Strategic Intelligence recommends for each field (drives the
  // visible "• Recommended" badge, independent of what the user has selected).
  const [rec, setRec] = useState<{
    angle?: string
    awareness?: string
    audience?: string
    offer?: string
  }>({})
  const [onBrand, setOnBrand] = useState(true)
  const [copied, setCopied] = useState<string | null>(null)
  // Available models (from the API) — the reactor auto-selects the best one for
  // the chosen deliverables; the run always sends 'auto'.
  const [videoModels, setVideoModels] = useState<ModelAvailability[]>([])
  const [videoModel] = useState<string>('auto')
  const [imageModels, setImageModels] = useState<ImageModelAvailability[]>([])
  const [imageModel] = useState<string>('auto')
  // Meta Ads performance feed for the run: 'off' (standalone), 'pipeboard', 'meta'.
  const [metaProvider, setMetaProvider] = useState<string>('pipeboard')
  // Reference assets for consistent-character UGC (Seedance reference-to-video).
  // Not collected in onboarding — kept empty so UGC still renders without refs.
  const [faceUrls] = useState<string[]>([])
  const [refVideos] = useState<string[]>([])
  const hasRefs = faceUrls.length > 0 || refVideos.length > 0

  // Load the model menus once so the reactor can recommend the best model.
  useEffect(() => {
    fetch('/api/video/models')
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.models)) setVideoModels(d.models as ModelAvailability[])
      })
      .catch(() => {})
    fetch('/api/image/models')
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.models)) setImageModels(d.models as ImageModelAvailability[])
      })
      .catch(() => {})
  }, [])

  // Dashboard's "New Creative Campaign" CTA links here with ?modal=open — open
  // the guided modal on arrival, then strip the param so refresh doesn't reopen.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    if (params.get('modal') === 'open') {
      setModalOpen(true)
      params.delete('modal')
      const qs = params.toString()
      window.history.replaceState(null, '', window.location.pathname + (qs ? `?${qs}` : ''))
    }
  }, [])

  // Topbar "New Creative Campaign" button signals this when already on the page.
  useEffect(() => {
    const open = () => setModalOpen(true)
    window.addEventListener('open-reactor-modal', open)
    return () => window.removeEventListener('open-reactor-modal', open)
  }, [])

  // System recommendation based on the selected deliverables, recomputed live.
  const recommendation = useMemo(
    () => (videoModels.length ? recommendVideoModel(outputs, videoModels) : null),
    [outputs, videoModels],
  )
  // What we actually send: the recommendation when on Auto (always, here).
  const resolvedVideoModel = videoModel === 'auto' ? recommendation?.modelId : videoModel

  // Image model: same pattern.
  const imageRecommendation = useMemo(
    () => (imageModels.length ? recommendImageModel(outputs, imageModels) : null),
    [outputs, imageModels],
  )
  const resolvedImageModel = imageModel === 'auto' ? imageRecommendation?.modelId : imageModel

  const toggle = (arr: string[], set: (v: string[]) => void, val: string) =>
    set(arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val])
  const toggleOutput = (val: string) => {
    touchedRef.current.add('outputs')
    toggle(outputs, setOutputs, val)
  }

  /* ----------------------- Agent pre-selection (suggest) ------------------- */
  // The reactor strategist pre-picks a concrete angle / awareness / audience /
  // offer from the brief, so each field already shows the agent's choice. The
  // user can override any of them; a manual change locks that field.
  const [suggesting, setSuggesting] = useState(false)
  // Strategic Intelligence read — loaded at fire time to enrich logged outcomes.
  const [intelligence, setIntelligence] = useState<StrategicIntelligence | null>(null)
  const touchedRef = useRef<Set<string>>(new Set())
  const markTouched = (field: string) => {
    touchedRef.current.add(field)
  }
  // User-driven setters (lock the field against further auto-suggestion).
  const setAngleUser = (v: string) => {
    markTouched('angle')
    setAngle(v)
  }
  const setAwarenessUser = (v: DirectiveOption) => {
    markTouched('awareness')
    setAwareness(v)
  }
  const setAudienceUser = (v: DirectiveOption) => {
    markTouched('audience')
    setAudience(v)
  }
  const setOfferUser = (v: DirectiveOption) => {
    markTouched('offer')
    setOffer(v)
  }

  // Debounced: once the brief has enough substance, ask the agent for its picks
  // and apply them to any field the user hasn't manually set.
  useEffect(() => {
    if (!modalOpen || brief.trim().length < 12) return
    const t = setTimeout(async () => {
      setSuggesting(true)
      try {
        const { suggestion } = (await fetch('/api/campaign-reactor/suggest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ brief, angle }),
        }).then((r) => r.json())) as { suggestion?: ReactorSuggestion }
        if (!suggestion) return
        // Record what the platform recommends — drives the visible badge even if
        // the user later overrides. The angle is free-form (Dynamic Strategy
        // Engine): a sharper angle than the base categories is adopted as-is.
        setRec({
          angle: suggestion.angle || undefined,
          awareness: awarenessOptions.some((x) => x.label === suggestion.awareness)
            ? suggestion.awareness
            : undefined,
          audience: audienceOptions.some((x) => x.label === suggestion.audience)
            ? suggestion.audience
            : undefined,
          offer: offerOptions.some((x) => x.label === suggestion.offer)
            ? suggestion.offer
            : undefined,
        })
        setAngleReason(suggestion.angleReason || '')
        setAngleConfidence(suggestion.angleConfidence)
        setAngleEvidence(suggestion.evidence ?? null)
        setRecommendedDeliverables(suggestion.deliverables ?? [])
        setDeliverablesReason(suggestion.deliverablesReason || '')

        const touched = touchedRef.current
        // Auto-select the recommendation only where the user hasn't acted.
        if (!touched.has('angle') && suggestion.angle) {
          setAngle(suggestion.angle)
        }
        if (!touched.has('awareness')) {
          const o = awarenessOptions.find((x) => x.label === suggestion.awareness)
          if (o) setAwareness(o)
        }
        if (!touched.has('audience')) {
          const o = audienceOptions.find((x) => x.label === suggestion.audience)
          if (o) setAudience(o)
        }
        if (!touched.has('offer')) {
          const o = offerOptions.find((x) => x.label === suggestion.offer)
          if (o) setOffer(o)
        }
        if (!touched.has('outputs') && suggestion.deliverables?.length) {
          setOutputs(suggestion.deliverables)
        }
        // Intelligence sources: auto-select what the agents picked (no UI — this
        // feeds OPUS behind the scenes).
        if (suggestion.intelligenceSources?.length && !touched.has('inputs')) {
          setActiveInputs(
            suggestion.intelligenceSources.filter((s) => s.recommended).map((s) => s.id),
          )
        }
      } catch {
        /* suggestion is best-effort — leave fields as they are */
      } finally {
        setSuggesting(false)
      }
    }, 800)
    return () => clearTimeout(t)
    // angle is read as a hint only; excluded from deps to avoid a re-suggest loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brief, modalOpen])

  // Load the Strategic Intelligence read so logged outcomes carry the strategic
  // configuration OPUS reasoned over. Best-effort, grounded in current inputs.
  const loadIntelligence = useCallback(async () => {
    try {
      const res = await fetch('/api/campaign-reactor/intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brief,
          angle,
          awareness: awareness.label,
          audience: audience.label,
          offer: offer.label,
        }),
      }).then((r) => r.json())
      if (res.intelligence) setIntelligence(res.intelligence as StrategicIntelligence)
    } catch {
      /* best-effort — outcome attributes fall back to the raw inputs */
    }
  }, [brief, angle, awareness, audience, offer])

  // Quick Launch website extraction — pull a business's own offer / audience /
  // positioning off their site and fold it into the brief, so a one-input launch
  // still fires grounded in their real intel. Best-effort; never blocks.
  const extractSite = useCallback(async (rawUrl: string) => {
    try {
      const res = await fetch('/api/campaign-reactor/extract-site', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: rawUrl }),
      }).then((r) => r.json())
      if (res?.ok && res.intel) {
        setBrief((prev) => {
          const block = `From ${res.domain}:\n${res.intel}`
          return prev.trim() ? `${prev.trim()}\n\n${block}` : block
        })
        return { ok: true as const, domain: res.domain as string }
      }
      return { ok: false as const, error: (res?.error as string) || 'Could not read that site.' }
    } catch {
      return { ok: false as const, error: 'Could not reach that site. Check the address.' }
    }
  }, [])

  // Fire from the modal — assembles the full ReactorInputs from every step plus
  // the classic payload fields, then posts into the shared SSE pipeline.
  const fire = () => {
    // Enrich outcome attributes in the background (non-blocking).
    void loadIntelligence()
    const reactorInputsPayload: ReactorInputs = {
      brief,
      angle,
      angleIsAgentDecided: angle === NO_PREFERENCE || angle.trim() === '',
      outputTypes: outputs,
      outputTypesAgentDecided: outputs.length === 0,
      awarenessStage: awareness.label,
      awarenessDirective: awareness.directive,
      audienceType: audience.label,
      audienceDirective: audience.directive,
      offerType: offer.label,
      offerTypeDirective: offer.directive,
      offerName,
      onBrandEnabled: onBrand,
      brandSettings: defaultBrandSettings,
    }
    // Intelligence sourcing is automatic — use the agent's picks, or the full
    // set when the brief was too thin to produce a recommendation.
    const sources = activeInputs.length ? activeInputs : INTEL_SOURCES.map((s) => s.id)
    streamReactor({
      angle,
      inputs: sources.map(intelSourceLabel),
      outputs: outputs.length ? outputs : reactorOutputTypes,
      videoModel: resolvedVideoModel,
      imageModel: resolvedImageModel,
      metaProvider,
      reactorInputs: reactorInputsPayload,
    })
  }

  const copy = (text: string) => {
    navigator.clipboard?.writeText(text)
    setCopied(text)
    setTimeout(() => setCopied(null), 1500)
  }

  // A concept whose brief is a moving creative (Video / Testimonial) renders a
  // video ad; everything else renders a still.
  const isVideoConcept = (c: Concept) => /video|testimonial/i.test(c.type)

  // The strategic attributes captured with every logged outcome — what ORACLE
  // learns from. Sourced from the current run inputs + the concept itself.
  const outcomeAttributes = (c: Concept): OutcomeAttributes => ({
    campaignType: angle,
    audience: audience.label,
    awareness: awareness.label,
    offer: offer.label,
    pattern: c.productionBrief?.pattern || intelligence?.primaryPattern || angle,
    creativeStructure: intelligence?.recommendedCreativeStructure,
    copyStructure: intelligence?.recommendedCopyStructure,
    platform: 'Meta',
    assetType: c.type,
    // Full strategic configuration so ORACLE can reuse exactly what won.
    proofAssets: [c.basis, ...(intelligence?.knowledgeAssetsConsulted ?? [])].filter(
      (x): x is string => Boolean(x),
    ),
    frameworks: activeInputs.map(intelSourceLabel),
  })

  // Thin wrappers: the run logic lives in the persistent provider; here we just
  // thread the current model picks + reference library into each call.
  const runCreative = (c: Concept) =>
    generateCreative(c, { imageModel: resolvedImageModel, videoModel: resolvedVideoModel })
  const runAnimate = (c: Concept, imageUrl: string) =>
    animate(c, imageUrl, { videoModel: resolvedVideoModel })
  const runUGC = (c: Concept) =>
    generateUGC(c, { videoModel: resolvedVideoModel, faceUrls, refVideos })

  // Keep the custom audience/offer DirectiveOption in sync with the typed text so
  // its directive instructs OPUS to treat the value as a hard constraint.
  const applyCustomAudience = (v: string) =>
    setAudience({ label: v, directive: customDirective('audience', v) })
  const applyCustomOffer = (v: string) =>
    setOffer({ label: v, directive: customDirective('offer', v) })

  // The four strategic dropdowns, each recommendation-aware and override-friendly.
  const angleField: StrategicField = {
    options: ANGLE_NAMES,
    value: angleCustom || angle === NO_PREFERENCE ? '' : angle,
    recommended: rec.angle ?? null,
    recommendation: rec.angle
      ? { reason: angleReason, confidence: angleConfidence, evidence: angleEvidence }
      : undefined,
    noPreference: angle === NO_PREFERENCE && !angleCustom,
    thinking: suggesting,
    custom: {
      allowed: true,
      active: angleCustom,
      value: customAngle,
      placeholder: 'Name your campaign angle',
      examples: ['Profit Leak', 'Margin Erosion', 'Builder Burnout', 'Owner Dependency'],
    },
    onSelect: (label) => {
      setAngleCustom(false)
      setAngleUser(label)
    },
    onCustom: () => {
      markTouched('angle')
      setAngleCustom(true)
      setAngle(customAngle)
    },
    onCustomChange: (v) => {
      setCustomAngle(v)
      setAngle(v)
    },
    onNoPreference: () => {
      setAngleCustom(false)
      setAngleUser(NO_PREFERENCE)
    },
  }

  const awarenessField: StrategicField = {
    options: awarenessOptions.slice(1).map((o) => o.label),
    value: awareness === awarenessOptions[0] ? '' : awareness.label,
    recommended: rec.awareness ?? null,
    noPreference: awareness === awarenessOptions[0],
    thinking: suggesting,
    custom: { allowed: false, active: false, value: '', placeholder: '', examples: [] },
    onSelect: (label) => {
      const o = awarenessOptions.find((x) => x.label === label)
      if (o) setAwarenessUser(o)
    },
    onCustom: () => {},
    onCustomChange: () => {},
    onNoPreference: () => setAwarenessUser(awarenessOptions[0]),
  }

  const audienceField: StrategicField = {
    options: audienceOptions.slice(1).map((o) => o.label),
    value: audienceCustom || audience === audienceOptions[0] ? '' : audience.label,
    recommended: rec.audience ?? null,
    noPreference: audience === audienceOptions[0] && !audienceCustom,
    thinking: suggesting,
    custom: {
      allowed: true,
      active: audienceCustom,
      value: customAudience,
      placeholder: 'Describe the audience',
      examples: ['Residential Builders', '$2M–$10M Revenue', '5–20 Staff', 'Owner Operators'],
    },
    onSelect: (label) => {
      setAudienceCustom(false)
      const o = audienceOptions.find((x) => x.label === label)
      if (o) setAudienceUser(o)
    },
    onCustom: () => {
      markTouched('audience')
      setAudienceCustom(true)
      applyCustomAudience(customAudience)
    },
    onCustomChange: (v) => {
      setCustomAudience(v)
      applyCustomAudience(v)
    },
    onNoPreference: () => {
      setAudienceCustom(false)
      setAudienceUser(audienceOptions[0])
    },
  }

  const offerField: StrategicField = {
    options: offerOptions.slice(1).map((o) => o.label),
    value: offerCustom || offer === offerOptions[0] ? '' : offer.label,
    recommended: rec.offer ?? null,
    noPreference: offer === offerOptions[0] && !offerCustom,
    thinking: suggesting,
    custom: {
      allowed: true,
      active: offerCustom,
      value: customOffer,
      placeholder: 'Name your offer',
      examples: ['Builder Profit Audit', 'The Owner Freedom Blueprint', 'The 45-Hour Builder System'],
    },
    onSelect: (label) => {
      setOfferCustom(false)
      const o = offerOptions.find((x) => x.label === label)
      if (o) setOfferUser(o)
    },
    onCustom: () => {
      markTouched('offer')
      setOfferCustom(true)
      applyCustomOffer(customOffer)
    },
    onCustomChange: (v) => {
      setCustomOffer(v)
      applyCustomOffer(v)
    },
    onNoPreference: () => {
      setOfferCustom(false)
      setOfferUser(offerOptions[0])
    },
  }

  // Everything the modal renders, threaded from this component's state.
  const form: ReactorForm = {
    brief,
    setBrief,
    angleField,
    outputTypeList: reactorOutputTypes,
    outputs,
    toggleOutput,
    recommendedDeliverables,
    deliverablesReason,
    awarenessField,
    audienceField,
    offerField,
    offerName,
    setOfferName,
    metaProvider,
    setMetaProvider,
    onBrand,
    setOnBrand,
    suggesting,
    extractSite,
  }

  // Everything the live agent workflow needs to keep the production actions
  // (Generate Image/Video, Animate, UGC, Log outcome, Copy) working — the run
  // logic still lives in the persistent provider; these just thread the current
  // model picks, reference library, and angle into each call.
  const workflowControls: WorkflowControls = {
    angle,
    isVideoConcept,
    hasRefs,
    faceCount: faceUrls.length,
    refVideoCount: refVideos.length,
    copied,
    verdictOptions: VERDICT_OPTIONS,
    onCopy: copy,
    onGenerateCreative: runCreative,
    onAnimate: runAnimate,
    onGenerateUGC: runUGC,
    onMarkOutcome: (c, v) => markOutcome(c, v, angle, outcomeAttributes(c)),
    onRetry: fire,
  }

  return (
    <div className="space-y-6">
      {/* Trigger — the modal is the single input induction for the reactor */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-semibold text-white">Configure your campaign</h2>
          <p className="mt-0.5 text-sm text-white/45">
            Brief, audience, offer, performance feed, and brand — collected across five quick steps,
            then fire the reactor.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          disabled={phase === 'firing'}
          className="fire-btn inline-flex items-center gap-2 rounded-full px-6 py-3.5 font-display text-base font-bold uppercase tracking-wide text-white"
        >
          {phase === 'firing' ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Firing Reactor…
            </>
          ) : (
            <>
              <Atom size={16} /> New Creative Campaign
            </>
          )}
        </button>
      </div>

      {/* Output — before firing, the empty state; once fired, the live agent
          workflow becomes the primary experience (raw telemetry moves into a
          collapsible drawer inside it). */}
      {phase === 'idle' ? (
        <Panel className="min-h-[480px]">
          <PanelHeader
            icon={<Atom size={16} className="animate-pulse-glow" />}
            accent="cyan"
            title="Generated Concepts"
            subtitle="Synthesized from your active intelligence layer"
          />
          <div className="grid place-items-center px-6 py-24 text-center">
            <Atom size={40} className="mb-4 text-white/15" />
            <p className="max-w-sm text-sm text-white/40">
              Select your intelligence inputs and angle, then fire the reactor. The agent walks
              your frameworks, retrieves what has already worked, and drafts grounded concepts.
            </p>
          </div>
        </Panel>
      ) : (
        <LiveAgentWorkflow {...workflowControls} />
      )}

      <ReactorModal open={modalOpen} onClose={() => setModalOpen(false)} onFire={fire} form={form} />
    </div>
  )
}
