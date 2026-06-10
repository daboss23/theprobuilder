'use client'

import { useState } from 'react'
import type { CopyOutput as CopyOutputType } from '@/types'

interface CopyOutputProps {
  output: CopyOutputType
  modelLabel: string
  selected: boolean
  onSelect: () => void
}

type Tab = 'hooks' | 'body' | 'ctas' | 'final'

export function CopyOutput({ output, modelLabel, selected, onSelect }: CopyOutputProps) {
  const [activeTab, setActiveTab] = useState<Tab>('hooks')

  return (
    <div
      className={`rounded-xl border overflow-hidden transition-colors ${
        selected ? 'border-amber-500/40 bg-amber-500/[0.03]' : 'border-white/10 bg-white/[0.02]'
      }`}
    >
      <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold truncate">Ad Copy</h3>
          <p className="text-xs text-white/30 mt-0.5 truncate">{modelLabel}</p>
        </div>
        <button
          type="button"
          onClick={onSelect}
          className={`shrink-0 text-xs px-2.5 py-1 rounded-md border transition-colors ${
            selected
              ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
              : 'bg-white/5 text-white/50 border-white/10 hover:text-white/80 hover:border-white/20'
          }`}
        >
          {selected ? '✓ Selected' : 'Use this copy'}
        </button>
      </div>

      <div className="flex border-b border-white/10">
        {(['hooks', 'body', 'ctas', 'final'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-3.5 py-2.5 text-xs font-medium capitalize transition-colors ${
              activeTab === tab
                ? 'text-amber-400 border-b-2 border-amber-400 -mb-px'
                : 'text-white/30 hover:text-white/60'
            }`}
          >
            {tab === 'hooks'
              ? `Hooks (${output.hooks.length})`
              : tab === 'body'
                ? `Body (${output.bodyVariants.length})`
                : tab === 'ctas'
                  ? `CTAs (${output.ctas.length})`
                  : 'Final Ad'}
          </button>
        ))}
      </div>

      <div className="p-5 space-y-3">
        {activeTab === 'hooks' &&
          output.hooks.map((hook, i) => (
            <div
              key={i}
              className="p-3 rounded-lg bg-white/5 border border-white/5 hover:border-white/15 transition-colors"
            >
              <p className="text-xs text-white/30 mb-1">Hook {i + 1}</p>
              <p className="text-sm text-white leading-relaxed">{hook}</p>
            </div>
          ))}

        {activeTab === 'body' &&
          output.bodyVariants.map((body, i) => (
            <div
              key={i}
              className="p-3 rounded-lg bg-white/5 border border-white/5 hover:border-white/15 transition-colors"
            >
              <p className="text-xs text-white/30 mb-1">Body {String.fromCharCode(65 + i)}</p>
              <p className="text-sm text-white/80 leading-relaxed">{body}</p>
            </div>
          ))}

        {activeTab === 'ctas' &&
          output.ctas.map((cta, i) => (
            <div
              key={i}
              className="p-3 rounded-lg bg-white/5 border border-white/5 hover:border-white/15 transition-colors"
            >
              <p className="text-xs text-white/30 mb-1">CTA {i + 1}</p>
              <p className="text-sm text-white">{cta}</p>
            </div>
          ))}

        {activeTab === 'final' && (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/20">
              <p className="text-xs text-amber-400/60 mb-2 font-medium">Selected Hook</p>
              <p className="text-base font-semibold leading-snug">{output.finalHook}</p>
            </div>
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <p className="text-xs text-white/30 mb-2">Body Copy</p>
              <p className="text-sm text-white/80 leading-relaxed">{output.finalBody}</p>
            </div>
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <p className="text-xs text-white/30 mb-2">CTA</p>
              <p className="text-sm font-medium">{output.finalCta}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
