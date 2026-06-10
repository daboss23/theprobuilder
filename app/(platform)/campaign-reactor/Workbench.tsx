'use client'

import { useState } from 'react'
import { Atom, Zap, Check, Loader2, Copy as CopyIcon } from 'lucide-react'
import { Panel, PanelHeader, Pill } from '@/components/reactor/ui'
import { reactorInputs, reactorOutputTypes, winningAngles } from '@/lib/reactor-data'

interface Concept {
  type: string
  text: string
}

// Deterministic demo synthesis from the intelligence layer.
function synthesize(angle: string): Concept[] {
  const a = angle.toLowerCase()
  return [
    { type: 'Hook', text: `Most builders don't have a ${a} problem. They have a ${a} leak hiding in plain sight.` },
    { type: 'Hook', text: `The builders winning on ${angle} aren't working harder. They're working different.` },
    { type: 'Headline', text: `From struggling to systemized — how ${angle} became TPB's unfair advantage.` },
    { type: 'Primary Text', text: `You didn't get into building to babysit jobs. This is the ${angle} system that gave 500+ builders their margin — and their weekends — back.` },
    { type: 'VSL Opener', text: `In the next few minutes I'm going to show you the exact ${angle} mechanism most builders never see until it's too late.` },
    { type: 'Static Concept', text: `Dark background, one bold profit figure, member name underneath. Single cyan accent. Angle: ${angle}.` },
    { type: 'Video Concept', text: `Founder direct-to-camera on-site. Pattern interrupt in 1.5s, contrarian ${a} belief, member proof, soft CTA.` },
    { type: 'Founder Concept', text: `Handheld walk-through of a finished site while founder breaks down the ${angle} turning point.` },
    { type: 'Testimonial Concept', text: `Member states their old hours/margin, the ${a} turning point, then the after. B-roll of their jobs.` },
    { type: 'Event Concept', text: `High-energy room montage tied to a single ${angle} insight and community proof.` },
    { type: 'Campaign Concept', text: `The ${angle} Reactor: founder video + static proof ad + member testimonial, sequenced cold → warm → apply.` },
  ]
}

export function Workbench() {
  const [activeInputs, setActiveInputs] = useState<string[]>(reactorInputs)
  const [angle, setAngle] = useState(winningAngles[0].name)
  const [outputs, setOutputs] = useState<string[]>(reactorOutputTypes)
  const [phase, setPhase] = useState<'idle' | 'firing' | 'done'>('idle')
  const [concepts, setConcepts] = useState<Concept[]>([])
  const [copied, setCopied] = useState<string | null>(null)

  const toggle = (arr: string[], set: (v: string[]) => void, val: string) =>
    set(arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val])

  const fire = () => {
    setPhase('firing')
    setConcepts([])
    setTimeout(() => {
      setConcepts(synthesize(angle).filter((c) => outputs.includes(c.type)))
      setPhase('done')
    }, 1400)
  }

  const copy = (text: string) => {
    navigator.clipboard?.writeText(text)
    setCopied(text)
    setTimeout(() => setCopied(null), 1500)
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[360px_1fr]">
      {/* Inputs */}
      <div className="space-y-4">
        <Panel>
          <PanelHeader icon={<Zap size={16} />} title="Intelligence Inputs" subtitle="Feed the reactor" />
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
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-primary to-cyan px-4 py-3 font-display text-sm font-semibold text-white shadow-glow transition-all hover:shadow-glow-lg disabled:opacity-60"
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
          icon={<Atom size={16} className={phase === 'firing' ? 'animate-spin' : ''} />}
          title="Generated Concepts"
          subtitle="Synthesized from your active intelligence layer"
          accessory={concepts.length > 0 ? <Pill tone="success">{concepts.length} concepts</Pill> : undefined}
        />

        {phase === 'idle' && (
          <div className="grid place-items-center px-6 py-24 text-center">
            <Atom size={40} className="mb-4 text-white/15" />
            <p className="max-w-sm text-sm text-white/40">
              Select your intelligence inputs and angle, then fire the reactor to synthesize
              campaign concepts from everything that has already worked.
            </p>
          </div>
        )}

        {phase === 'firing' && (
          <div className="space-y-3 p-5">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-white/[0.03]" />
            ))}
          </div>
        )}

        {phase === 'done' && (
          <div className="space-y-3 p-5">
            {concepts.map((c, i) => (
              <div
                key={i}
                className="glass-hover animate-fade-up rounded-xl border border-border bg-surface/40 p-4"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="mb-1.5 flex items-center justify-between">
                  <Pill tone="primary">{c.type}</Pill>
                  <button
                    type="button"
                    onClick={() => copy(c.text)}
                    className="flex items-center gap-1 text-[11px] text-white/40 hover:text-glow"
                  >
                    {copied === c.text ? <Check size={12} /> : <CopyIcon size={12} />}
                    {copied === c.text ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <p className="text-sm text-white/80">{c.text}</p>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  )
}
