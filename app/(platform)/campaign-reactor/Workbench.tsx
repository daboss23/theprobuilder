'use client'

import { useRef, useState } from 'react'
import { Atom, Zap, Check, Loader2, Copy as CopyIcon, Radar, Trophy, ImageIcon } from 'lucide-react'
import { Panel, PanelHeader, Pill } from '@/components/reactor/ui'
import { reactorInputs, reactorOutputTypes, winningAngles } from '@/lib/reactor-data'

interface Concept {
  type: string
  text: string
  basis?: string
  learningCheck?: string
  score?: number
}

interface TelemetryLine {
  text: string
  kind: 'step' | 'retrieval' | 'specialist'
}

export function Workbench() {
  const [activeInputs, setActiveInputs] = useState<string[]>(reactorInputs)
  const [angle, setAngle] = useState(winningAngles[0].name)
  const [outputs, setOutputs] = useState<string[]>(reactorOutputTypes)
  const [phase, setPhase] = useState<'idle' | 'firing' | 'done'>('idle')
  const [concepts, setConcepts] = useState<Concept[]>([])
  const [telemetry, setTelemetry] = useState<TelemetryLine[]>([])
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [logged, setLogged] = useState<Set<string>>(new Set())
  const [creatives, setCreatives] = useState<
    Record<string, { status: 'working' | 'done' | 'error'; url?: string; message?: string }>
  >({})
  const feedRef = useRef<HTMLDivElement>(null)

  const toggle = (arr: string[], set: (v: string[]) => void, val: string) =>
    set(arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val])

  const pushTelemetry = (line: TelemetryLine) => {
    setTelemetry((prev) => [...prev, line])
    requestAnimationFrame(() => feedRef.current?.scrollTo({ top: 1e9, behavior: 'smooth' }))
  }

  const fire = async () => {
    setPhase('firing')
    setConcepts([])
    setTelemetry([])
    setError(null)

    try {
      const res = await fetch('/api/campaign-reactor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ angle, inputs: activeInputs, outputs }),
      })
      if (!res.body) throw new Error('No response stream')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      // Parse the SSE stream line by line.
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const parts = buffer.split('\n\n')
        buffer = parts.pop() ?? ''
        for (const part of parts) {
          const line = part.replace(/^data: /, '').trim()
          if (!line) continue
          let ev: { type: string; [k: string]: unknown }
          try {
            ev = JSON.parse(line)
          } catch {
            continue
          }
          if (ev.type === 'step') pushTelemetry({ text: ev.text as string, kind: 'step' })
          else if (ev.type === 'retrieval')
            pushTelemetry({ text: `${ev.system} · ${ev.title}`, kind: 'retrieval' })
          else if (ev.type === 'delegate')
            pushTelemetry({
              text:
                ev.status === 'start'
                  ? `${ev.specialist} — analyzing…`
                  : `${ev.specialist} — ${ev.summary}`,
              kind: 'specialist',
            })
          else if (ev.type === 'concept') setConcepts((p) => [...p, ev.concept as Concept])
          else if (ev.type === 'error') setError(ev.message as string)
          else if (ev.type === 'done') setPhase('done')
        }
      }
      setPhase('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reactor failed')
      setPhase('done')
    }
  }

  const copy = (text: string) => {
    navigator.clipboard?.writeText(text)
    setCopied(text)
    setTimeout(() => setCopied(null), 1500)
  }

  // Generate a Meta image creative from a concept (OpenAI gpt-image-1).
  const generateCreative = async (c: Concept) => {
    setCreatives((p) => ({ ...p, [c.text]: { status: 'working' } }))
    try {
      const res = await fetch('/api/generate-creative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Meta ad creative for The Professional Builder. ${c.text} Photographic, on-site builder context, premium, high contrast, leave room for text overlay.`,
          placement: 'feed',
        }),
      }).then((r) => r.json())

      if (res.success && res.imageUrl) {
        setCreatives((p) => ({ ...p, [c.text]: { status: 'done', url: res.imageUrl } }))
      } else {
        setCreatives((p) => ({
          ...p,
          [c.text]: {
            status: 'error',
            message: res.demo
              ? 'Add OPENAI_API_KEY to generate live creatives'
              : res.error || 'Generation failed',
          },
        }))
      }
    } catch {
      setCreatives((p) => ({ ...p, [c.text]: { status: 'error', message: 'Generation failed' } }))
    }
  }

  // Log a winner — feeds it back into the knowledge layer as a new pattern.
  const markWinner = async (c: Concept) => {
    setLogged((prev) => new Set(prev).add(c.text))
    try {
      await fetch('/api/campaign-reactor/outcome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ angle, concept: c, verdict: 'winner' }),
      })
    } catch {
      /* best-effort logging */
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[360px_1fr]">
      {/* Inputs */}
      <div className="space-y-4">
        <Panel>
          <PanelHeader icon={<Zap size={16} />} accent="amber" title="Intelligence Inputs" subtitle="Feed the reactor" />
          <div className="space-y-1.5 p-4">
            {reactorInputs.map((i) => {
              const on = activeInputs.includes(i)
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => toggle(activeInputs, setActiveInputs, i)}
                  className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm transition-all ${
                    on
                      ? 'border-primary/30 bg-primary/10 text-white'
                      : 'border-border bg-surface/30 text-white/45'
                  }`}
                >
                  {i}
                  <span
                    className={`grid h-4 w-4 place-items-center rounded ${
                      on ? 'bg-glow text-background' : 'border border-border'
                    }`}
                  >
                    {on && <Check size={11} />}
                  </span>
                </button>
              )
            })}
          </div>
        </Panel>

        <Panel className="p-4">
          <label className="mb-2 block text-[11px] font-medium uppercase tracking-wider text-white/40">
            Campaign Angle
          </label>
          <select
            value={angle}
            onChange={(e) => setAngle(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface/60 px-3 py-2.5 text-sm text-white outline-none focus:border-glow"
          >
            {winningAngles.map((a) => (
              <option key={a.name} value={a.name} className="bg-card">
                {a.name}
              </option>
            ))}
          </select>

          <p className="mb-2 mt-4 text-[11px] font-medium uppercase tracking-wider text-white/40">
            Output Types
          </p>
          <div className="flex flex-wrap gap-1.5">
            {reactorOutputTypes.map((o) => {
              const on = outputs.includes(o)
              return (
                <button
                  key={o}
                  type="button"
                  onClick={() => toggle(outputs, setOutputs, o)}
                  className={`rounded-full border px-2.5 py-1 text-[11px] transition-all ${
                    on
                      ? 'border-primary/30 bg-primary/10 text-glow'
                      : 'border-border text-white/40'
                  }`}
                >
                  {o}
                </button>
              )
            })}
          </div>

          <button
            type="button"
            onClick={fire}
            disabled={phase === 'firing' || outputs.length === 0}
            className="fire-btn mt-5 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 font-display text-sm font-semibold text-white disabled:opacity-60"
          >
            {phase === 'firing' ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Firing Reactor…
              </>
            ) : (
              <>
                <Atom size={16} /> Fire Reactor
              </>
            )}
          </button>
        </Panel>
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
                <div ref={feedRef} className="max-h-40 space-y-1 overflow-y-auto font-mono text-[11px]">
                  {telemetry.map((t, i) => (
                    <div
                      key={i}
                      className={`flex gap-2 ${
                        t.kind === 'retrieval'
                          ? 'text-cyan/80'
                          : t.kind === 'specialist'
                            ? 'text-warning'
                            : 'text-white/55'
                      }`}
                    >
                      <span className="text-white/25">
                        {t.kind === 'retrieval' ? '└▸' : t.kind === 'specialist' ? '▣' : '›'}
                      </span>
                      <span>{t.text}</span>
                    </div>
                  ))}
                  {phase === 'firing' && (
                    <div className="flex items-center gap-2 text-glow">
                      <Loader2 size={11} className="animate-spin" /> working…
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

            {concepts.map((c, i) => (
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
                        onClick={() => generateCreative(c)}
                        disabled={creatives[c.text]?.status === 'working'}
                        className="flex items-center gap-1 text-[11px] text-white/40 hover:text-cyan disabled:opacity-60"
                      >
                        {creatives[c.text]?.status === 'working' ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <ImageIcon size={12} />
                        )}
                        Generate creative
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => markWinner(c)}
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

                {/* Generated creative */}
                {creatives[c.text]?.status === 'done' && creatives[c.text].url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={creatives[c.text].url}
                    alt={c.type}
                    className="mt-3 w-full rounded-lg border border-border"
                  />
                )}
                {creatives[c.text]?.status === 'working' && (
                  <div className="mt-3 grid aspect-square w-full place-items-center rounded-lg border border-border bg-background/40">
                    <span className="flex items-center gap-2 text-xs text-cyan">
                      <Loader2 size={14} className="animate-spin" /> Rendering creative…
                    </span>
                  </div>
                )}
                {creatives[c.text]?.status === 'error' && (
                  <p className="mt-3 rounded-lg border border-warning/30 bg-warning/[0.06] p-2 text-[11px] text-warning">
                    {creatives[c.text].message}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  )
}
