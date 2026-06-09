'use client'

import { useState } from 'react'
import type { Builder } from '@/types'

interface BuilderFormProps {
  onCreated: (builder: Builder) => void
  onCancel: () => void
}

const field =
  'w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-amber-500/50 transition-colors'
const labelCls = 'text-xs text-white/50 mb-1 block'

export function BuilderForm({ onCreated, onCancel }: BuilderFormProps) {
  const [name, setName] = useState('')
  const [website, setWebsite] = useState('')
  const [region, setRegion] = useState('')
  const [serves, setServes] = useState('')
  const [offer, setOffer] = useState('')
  const [proofPoints, setProofPoints] = useState('')
  const [brandVoice, setBrandVoice] = useState('')
  const [visualStyle, setVisualStyle] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Builder name is required')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/builders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          website,
          region,
          serves,
          offer,
          proof_points: proofPoints
            .split('\n')
            .map((p) => p.trim())
            .filter(Boolean),
          brand_voice: brandVoice,
          visual_style: visualStyle,
        }),
      })
      const data = await res.json()
      if (data.success) {
        onCreated(data.data as Builder)
      } else {
        setError(data.error || 'Failed to create builder')
      }
    } catch {
      setError('Failed to create builder')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Onboard a builder</h3>
          <p className="text-xs text-white/30 mt-0.5">
            This profile becomes the brand memory the agent writes from.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className={labelCls}>Builder name *</label>
          <input
            className={field}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Summit Build Co"
          />
        </div>
        <div>
          <label className={labelCls}>Website</label>
          <input
            className={field}
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="summitbuildco.com.au"
          />
        </div>
        <div>
          <label className={labelCls}>Region</label>
          <input
            className={field}
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            placeholder="Hunter Valley, NSW"
          />
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls}>Who they build for</label>
          <textarea
            className={`${field} resize-none`}
            rows={2}
            value={serves}
            onChange={(e) => setServes(e.target.value)}
            placeholder="Families building custom homes, knockdown-rebuilds, major renovations..."
          />
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls}>Core offer</label>
          <input
            className={field}
            value={offer}
            onChange={(e) => setOffer(e.target.value)}
            placeholder="Fixed-price guarantee. Free, no-obligation site assessment."
          />
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls}>Proof points (one per line)</label>
          <textarea
            className={`${field} resize-none`}
            rows={3}
            value={proofPoints}
            onChange={(e) => setProofPoints(e.target.value)}
            placeholder={'19 years in business\n200+ homes built\nFixed-price guarantee'}
          />
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls}>Voice &amp; tone</label>
          <textarea
            className={`${field} resize-none`}
            rows={2}
            value={brandVoice}
            onChange={(e) => setBrandVoice(e.target.value)}
            placeholder="Plain-spoken, confident, proof over adjectives, no hype..."
          />
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls}>Visual style</label>
          <textarea
            className={`${field} resize-none`}
            rows={2}
            value={visualStyle}
            onChange={(e) => setVisualStyle(e.target.value)}
            placeholder="Warm natural light, real homes and sites, amber/charcoal palette, no stock-photo gloss..."
          />
        </div>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg text-sm text-white/60 hover:text-white border border-white/10 transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || !name.trim()}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            submitting || !name.trim()
              ? 'bg-amber-500/20 text-amber-400/60 cursor-not-allowed'
              : 'bg-amber-500 hover:bg-amber-400 text-black'
          }`}
        >
          {submitting ? 'Saving...' : 'Save builder'}
        </button>
      </div>
    </div>
  )
}
