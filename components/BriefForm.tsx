'use client'

import { useState } from 'react'

const ANGLE_PRESETS = [
  'Fear of cost blowouts',
  'Fear of builder disappearing',
  'Dream home aspiration',
  'Fixed price guarantee',
  'Social proof — 200 homes built',
  'Local trust — 19 years Hunter Valley',
]

interface BriefFormProps {
  onGenerate: (brief: { angle: string; goal: string }) => void
  isGenerating: boolean
  appState: string
}

export function BriefForm({ onGenerate, isGenerating, appState }: BriefFormProps) {
  const [angle, setAngle] = useState('')
  const [goal, setGoal] = useState('')

  const handleSubmit = () => {
    if (!angle.trim() || !goal.trim()) return
    onGenerate({ angle, goal })
  }

  const getStatusText = () => {
    if (appState === 'generating-copy') return 'Generating ad copy...'
    if (appState === 'generating-image') return 'Generating image creative...'
    return 'Generate Creative'
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 space-y-5">
      <div>
        <h2 className="text-sm font-semibold text-white/80 mb-1">Campaign Brief</h2>
        <p className="text-xs text-white/30">
          Brand memory is loaded. Add your campaign angle to generate.
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs text-white/50 mb-1.5 block">Campaign Angle</label>
          <textarea
            value={angle}
            onChange={(e) => setAngle(e.target.value)}
            placeholder="e.g. Fear of cost blowouts — targeting homeowners who have heard builder horror stories"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/20 resize-none focus:outline-none focus:border-amber-500/50 transition-colors"
            rows={3}
          />
        </div>

        <div>
          <label className="text-xs text-white/50 mb-1.5 block">Quick Presets</label>
          <div className="flex flex-wrap gap-1.5">
            {ANGLE_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setAngle(preset)}
                className="text-xs px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 text-white/50 hover:text-white/80 border border-white/10 transition-all"
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs text-white/50 mb-1.5 block">Campaign Goal</label>
          <input
            type="text"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="e.g. Drive enquiries for free site assessment"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-amber-500/50 transition-colors"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isGenerating || !angle.trim() || !goal.trim()}
        className={`w-full py-3 rounded-lg text-sm font-semibold transition-all ${
          isGenerating || !angle.trim() || !goal.trim()
            ? 'bg-amber-500/20 text-amber-400/60 cursor-not-allowed'
            : 'bg-amber-500 hover:bg-amber-400 text-black'
        }`}
      >
        {isGenerating ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-3 h-3 border border-amber-400/60 border-t-transparent rounded-full animate-spin"></span>
            {getStatusText()}
          </span>
        ) : (
          'Generate Creative'
        )}
      </button>

      <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/20 p-3">
        <p className="text-xs text-emerald-400/70 font-medium mb-1">Brand Memory Active</p>
        <ul className="space-y-0.5">
          {[
            'Voice & tone guidelines',
            'Hook frameworks loaded',
            'Audience pain points',
            'Proof points & offer',
            'Visual style guide',
          ].map((item) => (
            <li key={item} className="text-xs text-white/30 flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-emerald-500/50"></span>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
