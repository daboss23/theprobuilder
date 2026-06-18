'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Atom, Check, Loader2, Copy as CopyIcon, Radar, Trophy, ImageIcon, Film, Users } from 'lucide-react'
import { Panel, PanelHeader, Pill } from '@/components/reactor/ui'
import { ReactorModal, type ReactorForm } from '@/components/campaign-reactor/ReactorModal'
import { reactorInputs, reactorOutputTypes, winningAngles } from '@/lib/reactor-data'
import {
  awarenessOptions,
  audienceOptions,
  offerOptions,
  defaultBrandSettings,
  type ReactorInputs,
  type StrategicIntelligence,
} from '@/lib/reactor-inputs'
import { recommendVideoModel } from '@/lib/video/recommend'
import type { ModelAvailability } from '@/lib/video/types'
import { recommendImageModel } from '@/lib/image/recommend'
import type { ImageModelAvailability } from '@/lib/image/types'
import { useReactorRun, type Concept } from '@/components/campaign-reactor/ReactorRunContext'

const ANGLE_OPTIONS = ['Agent decides', ...winningAngles.map((a) => a.name)]

export function Workbench() {
  // Run + media state lives in the persistent platform-layout provider, so an
  // in-flight reactor run survives navigating to another dashboard and back.
  const {
    phase,
    concepts,
    telemetry,
    error,
    logged,
    streamReactor,
    generateCreative,
    animate,
    generateUGC,
    markWinner,
    imageFor,
    videoFor,
    creativeStateFor,
  } = useReactorRun()
  const [modalOpen, setModalOpen] = useState(false)
  // Manual controls (original left-panel inputs, now collected inside the modal)
  const [activeInputs, setActiveInputs] = useState<string[]>(reactorInputs)
  const [angle, setAngle] = useState(winningAngles[0].name)
  const [outputs, setOutputs] = useState<string[]>(reactorOutputTypes)
  // Strategic fields (the guided step-by-step inputs)
  const [brief, setBrief] = useState('')
  const [awareness, setAwareness] = useState(awarenessOptions[0])
  const [audience, setAudience] = useState(audienceOptions[0])
  const [offer, setOffer] = useState(offerOptions[0])
  const [offerName, setOfferName] = useState('')
  const [onBrand, setOnBrand] = useState(true)
  const [copied, setCopied] = useState<string | null>(null)
  // Available models (from the API) + the user's pick ('auto' = recommended).
  const [videoModels, setVideoModels] = useState<ModelAvailability[]>([])
  const [videoModel, setVideoModel] = useState<string>('auto')
  const [imageModels, setImageModels] = useState<ImageModelAvailability[]>([])
  const [imageModel, setImageModel] = useState<string>('auto')
  // Face library: reference image URLs that lock a consistent face across UGC
  // clips (Seedance 2.0 reference-to-video). One URL per line or comma-separated.
  // Selected reference assets from the Face Library (saved roster) → power
  // Seedance 2.0 reference-to-video for consistent-character in-house UGC.
  const [faceUrls, setFaceUrls] = useState<string[]>([])
  const [refVideos, setRefVideos] = useState<string[]>([])
  const hasRefs = faceUrls.length > 0 || refVideos.length > 0
  const handleFaceSelection = useCallback((images: string[], videos: string[]) => {
    setFaceUrls(images.slice(0, 9))
    setRefVideos(videos.slice(0, 3))
  }, [])
  const feedRef = useRef<HTMLDivElement>(null)

  // Load the model menus once so the user can pick (and we can recommend).
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

  // System recommendation based on the selected output types, recomputed live.
  const recommendation = useMemo(
    () => (videoModels.length ? recommendVideoModel(outputs, videoModels) : null),
    [outputs, videoModels],
  )
  // What we actually send: the explicit pick, or the recommendation when on Auto.
  const resolvedVideoModel = videoModel === 'auto' ? recommendation?.modelId : videoModel
  const showVideoPicker =
    videoModels.length > 0 && outputs.some((o) => /video|founder|testimonial|event|campaign/i.test(o))

  // Image model: same pattern.
  const imageRecommendation = useMemo(
    () => (imageModels.length ? recommendImageModel(outputs, imageModels) : null),
    [outputs, imageModels],
  )
  const resolvedImageModel = imageModel === 'auto' ? imageRecommendation?.modelId : imageModel
  const showImagePicker =
    imageModels.length > 0 && outputs.some((o) => /concept|static|founder|campaign|testimonial/i.test(o))

  const toggle = (arr: string[], set: (v: string[]) => void, val: string) =>
    set(arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val])
  const toggleInput = (val: string) => toggle(activeInputs, setActiveInputs, val)
  const toggleOutput = (val: string) => toggle(outputs, setOutputs, val)

  /* ----------------------- Agent pre-selection (suggest) ------------------- */
  // The reactor strategist pre-picks a concrete angle / awareness / audience /
  // offer from the brief, so each field already shows the agent's choice. The
  // user can override any of them; a manual change locks that field.
  const [suggesting, setSuggesting] = useState(false)
  const [agentPicked, setAgentPicked] = useState<Record<string, boolean>>({})
  // Strategic Intelligence read, loaded when the modal reaches the final step.
  const [intelligence, setIntelligence] = useState<StrategicIntelligence | null>(null)
  const [intelLoading, setIntelLoading] = useState(false)
  const touchedRef = useRef<Set<string>>(new Set())
  const markTouched = (field: string) => {
    touchedRef.current.add(field)
    setAgentPicked((p) => ({ ...p, [field]: false }))
  }
  // User-driven setters (lock the field against further auto-suggestion).
  const setAngleUser = (v: string) => {
    markTouched('angle')
    setAngle(v)
  }
  const setAwarenessUser = (v: (typeof awarenessOptions)[number]) => {
    markTouched('awareness')
    setAwareness(v)
  }
  const setAudienceUser = (v: (typeof audienceOptions)[number]) => {
    markTouched('audience')
    setAudience(v)
  }
  const setOfferUser = (v: (typeof offerOptions)[number]) => {
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
        const { suggestion } = await fetch('/api/campaign-reactor/suggest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ brief, angle }),
        }).then((r) => r.json())
        if (!suggestion) return
        const touched = touchedRef.current
        const picked: Record<string, boolean> = {}
        if (!touched.has('angle') && ANGLE_OPTIONS.includes(suggestion.angle)) {
          setAngle(suggestion.angle)
          picked.angle = true
        }
        if (!touched.has('awareness')) {
          const o = awarenessOptions.find((x) => x.label === suggestion.awareness)
          if (o) {
            setAwareness(o)
            picked.awareness = true
          }
        }
        if (!touched.has('audience')) {
          const o = audienceOptions.find((x) => x.label === suggestion.audience)
          if (o) {
            setAudience(o)
            picked.audience = true
          }
        }
        if (!touched.has('offer')) {
          const o = offerOptions.find((x) => x.label === suggestion.offer)
          if (o) {
            setOffer(o)
            picked.offer = true
          }
        }
        setAgentPicked((p) => ({ ...p, ...picked }))
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

  // Keep the telemetry feed pinned to the newest line as the run streams in.
  useEffect(() => {
    requestAnimationFrame(() => feedRef.current?.scrollTo({ top: 1e9, behavior: 'smooth' }))
  }, [telemetry.length])

  // Load the Strategic Intelligence read for the review step. Runs once when the
  // modal reaches Step 5 (not per keystroke), grounded in the current inputs.
  const loadIntelligence = useCallback(async () => {
    setIntelLoading(true)
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
      /* best-effort — the panel keeps its previous read */
    } finally {
      setIntelLoading(false)
    }
  }, [brief, angle, awareness, audience, offer])

  // Fire from the modal — assembles the full ReactorInputs from every step plus
  // the classic payload fields, then posts into the shared SSE pipeline.
  const fire = () => {
    const reactorInputsPayload: ReactorInputs = {
      brief,
      angle,
      angleIsAgentDecided: angle === 'Agent decides',
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
    streamReactor({
      angle,
      inputs: activeInputs,
      outputs: outputs.length ? outputs : reactorOutputTypes,
      videoModel: resolvedVideoModel,
      imageModel: resolvedImageModel,
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

  // Thin wrappers: the run logic lives in the persistent provider; here we just
  // thread the current model picks + reference library into each call.
  const runCreative = (c: Concept) =>
    generateCreative(c, { imageModel: resolvedImageModel, videoModel: resolvedVideoModel })
  const runAnimate = (c: Concept, imageUrl: string) =>
    animate(c, imageUrl, { videoModel: resolvedVideoModel })
  const runUGC = (c: Concept) =>
    generateUGC(c, { videoModel: resolvedVideoModel, faceUrls, refVideos })

  // Everything the modal renders, threaded from this component's state so the
  // manual controls keep their recommendation + reference-library wiring.
  const form: ReactorForm = {
    brief,
    setBrief,
    angleOptions: ANGLE_OPTIONS,
    angle,
    setAngle: setAngleUser,
    outputTypeList: reactorOutputTypes,
    outputs,
    toggleOutput,
    awarenessOptions,
    awareness,
    setAwareness: setAwarenessUser,
    audienceOptions,
    audience,
    setAudience: setAudienceUser,
    offerOptions,
    offer,
    setOffer: setOfferUser,
    offerName,
    setOfferName,
    agentPicked,
    suggesting,
    intelligence,
    intelligenceLoading: intelLoading,
    loadIntelligence,
    intelligenceInputs: reactorInputs,
    activeInputs,
    toggleInput,
    imageModels,
    imageModel,
    setImageModel,
    imageRecommendation: imageRecommendation ?? null,
    showImagePicker,
    videoModels,
    videoModel,
    setVideoModel,
    videoRecommendation: recommendation ?? null,
    showVideoPicker,
    onFaceChange: handleFaceSelection,
    refCount: faceUrls.length + refVideos.length,
    onBrand,
    setOnBrand,
  }

  return (
    <div className="space-y-6">
      {/* Trigger — the modal is the single input induction for the reactor */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-semibold text-white">Configure your campaign</h2>
          <p className="mt-0.5 text-sm text-white/45">
            Brief, audience, offer, intelligence, and models — collected across five quick steps,
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

      {/* Output */}
      <Panel className="min-h-[480px]">
        <PanelHeader
          icon={<Atom size={16} className={phase === 'firing' ? 'animate-spin' : 'animate-pulse-glow'} />}
          accent="cyan"
          title="Generated Concepts"
          subtitle="Synthesized from your active intelligence layer"
          accessory={concepts.length > 0 ? <Pill tone="success">{concepts.length} concepts</Pill> : undefined}
        />

        {phase === 'idle' && (
          <div className="grid place-items-center px-6 py-24 text-center">
            <Atom size={40} className="mb-4 text-white/15" />
            <p className="max-w-sm text-sm text-white/40">
              Select your intelligence inputs and angle, then fire the reactor. The agent walks
              your frameworks, retrieves what has already worked, and drafts grounded concepts.
            </p>
          </div>
        )}

        {phase !== 'idle' && (
          <div className="space-y-4 p-5">
            {/* Live telemetry feed */}
            {(telemetry.length > 0 || phase === 'firing') && (
              <div className="telemetry-console p-3">
                <div className="mb-2 flex items-center gap-2 text-[10px] font-medium uppercase tracking-widest text-white/35">
                  <Radar size={12} className={phase === 'firing' ? 'animate-spin text-glow' : ''} />
                  Reactor Telemetry
                </div>
                <div ref={feedRef} className="max-h-48 space-y-1 overflow-y-auto font-mono text-[11px]">
                  {telemetry.map((t, i) => {
                    if (t.kind === 'intelligence') {
                      return (
                        <div
                          key={i}
                          className="my-1 rounded-md border border-glow/20 bg-glow/[0.04] px-2.5 py-1.5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-glow/90">
                              {t.label}
                            </span>
                            {t.confidence && (
                              <span
                                className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${
                                  t.confidence === 'High'
                                    ? 'bg-success/15 text-success'
                                    : t.confidence === 'Medium'
                                      ? 'bg-warning/15 text-warning'
                                      : 'bg-white/10 text-white/50'
                                }`}
                              >
                                Confidence: {t.confidence}
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 text-white/70">{t.text}</p>
                        </div>
                      )
                    }
                    return (
                      <div
                        key={i}
                        className={`flex gap-2 ${t.kind === 'retrieval' ? 'text-cyan/80' : 'text-white/55'}`}
                      >
                        <span className="text-white/25">{t.kind === 'retrieval' ? '└▸' : '›'}</span>
                        <span>{t.text}</span>
                      </div>
                    )
                  })}
                  {phase === 'firing' && (
                    <div className="flex items-center gap-2 text-glow">
                      <Loader2 size={11} className="animate-spin" /> intelligence operating…
                    </div>
                  )}
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-danger/30 bg-danger/[0.06] p-3 text-sm text-danger">
                {error}
              </div>
            )}

            {concepts.map((c, i) => {
              const image = imageFor(c)
              const video = videoFor(c)
              const wantsVideo = isVideoConcept(c)
              const creativeState = creativeStateFor(c)
              const creativeBusy =
                creativeState?.status === 'working' || video?.status === 'rendering'
              return (
                <div
                  key={i}
                  className={`glass-hover animate-fade-up stagger-${(i % 8) + 1} rounded-xl border border-border bg-surface/40 p-4`}
                >
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Pill tone="primary">{c.type}</Pill>
                      {typeof c.score === 'number' && (
                        <Pill tone={c.score >= 8 ? 'success' : 'warning'}>{c.score}/10</Pill>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {c.type.includes('Concept') && (
                        <button
                          type="button"
                          onClick={() => runCreative(c)}
                          disabled={creativeBusy}
                          className="flex items-center gap-1 text-[11px] text-white/40 hover:text-cyan disabled:opacity-60"
                        >
                          {creativeBusy ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : wantsVideo ? (
                            <Film size={12} />
                          ) : (
                            <ImageIcon size={12} />
                          )}
                          {wantsVideo ? 'Generate Video Creative' : 'Generate Image Creative'}
                        </button>
                      )}
                      {wantsVideo && hasRefs && (
                        <button
                          type="button"
                          onClick={() => runUGC(c)}
                          disabled={creativeBusy}
                          className="flex items-center gap-1 text-[11px] text-white/40 hover:text-cyan disabled:opacity-60"
                          title={`Generate with ${faceUrls.length} reference image${faceUrls.length === 1 ? '' : 's'}${refVideos.length ? ` + ${refVideos.length} video${refVideos.length === 1 ? '' : 's'}` : ''} (Seedance 2.0 reference-to-video)`}
                        >
                          <Users size={12} />
                          Generate UGC
                        </button>
                      )}
                      {image && !video && (
                        <button
                          type="button"
                          onClick={() => runAnimate(c, image)}
                          className="flex items-center gap-1 text-[11px] text-white/40 hover:text-cyan"
                        >
                          <Film size={12} />
                          Animate
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => markWinner(c, angle)}
                        disabled={logged.has(c.text)}
                        className="flex items-center gap-1 text-[11px] text-white/40 hover:text-success disabled:text-success"
                      >
                        <Trophy size={12} />
                        {logged.has(c.text) ? 'Logged' : 'Mark winner'}
                      </button>
                      <button
                        type="button"
                        onClick={() => copy(c.text)}
                        className="flex items-center gap-1 text-[11px] text-white/40 hover:text-glow"
                      >
                        {copied === c.text ? <Check size={12} /> : <CopyIcon size={12} />}
                        {copied === c.text ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-white/80">{c.text}</p>
                  {(c.basis || c.learningCheck) && (
                    <div className="mt-2 space-y-1 border-t border-border pt-2 text-[11px] text-white/40">
                      {c.basis && (
                        <p>
                          <span className="text-glow/70">Grounded in:</span> {c.basis}
                        </p>
                      )}
                      {c.learningCheck && (
                        <p>
                          <span className="text-success/70">Rubric:</span> {c.learningCheck}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Generated still creative (Higgsfield agent or manual) */}
                  {image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={image} alt={c.type} className="mt-3 w-full rounded-lg border border-border" />
                  )}

                  {/* Higgsfield video */}
                  {video?.status === 'done' && video.url && (
                    <video
                      src={video.url}
                      controls
                      playsInline
                      className="mt-3 w-full rounded-lg border border-border"
                    />
                  )}
                  {video?.status === 'rendering' && (
                    <div className="mt-3 grid aspect-video w-full place-items-center rounded-lg border border-border bg-background/40">
                      <span className="flex items-center gap-2 text-xs text-cyan">
                        <Loader2 size={14} className="animate-spin" /> Rendering video…
                      </span>
                    </div>
                  )}
                  {video?.status === 'error' && (
                    <p className="mt-3 rounded-lg border border-warning/30 bg-warning/[0.06] p-2 text-[11px] text-warning">
                      {video.message || 'Video render failed — check FAL_KEY / HF_CREDENTIALS or try again.'}
                    </p>
                  )}

                  {/* Creative render status (in-flight / error) */}
                  {creativeState?.status === 'working' && (
                    <div className="mt-3 grid aspect-square w-full place-items-center rounded-lg border border-border bg-background/40">
                      <span className="flex items-center gap-2 text-xs text-cyan">
                        <Loader2 size={14} className="animate-spin" /> Rendering creative…
                      </span>
                    </div>
                  )}
                  {creativeState?.status === 'error' && (
                    <p className="mt-3 rounded-lg border border-warning/30 bg-warning/[0.06] p-2 text-[11px] text-warning">
                      {creativeState.message}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </Panel>

      <ReactorModal open={modalOpen} onClose={() => setModalOpen(false)} onFire={fire} form={form} />
    </div>
  )
}
