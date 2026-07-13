'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowRight,
  Clipboard,
  Copy,
  Loader2,
  Search,
  Sparkles,
  Trophy,
  X,
} from 'lucide-react'
import { Panel, PanelHeader, Pill } from '@/components/reactor/ui'
import { CLONE_STORAGE_KEY, taxonomyToTags, type CreativeTaxonomy } from '@/lib/taxonomy'
import type { WinnerCard } from '@/lib/clone-sources'

/* ------------------------------- shared types ------------------------------ */

interface CreativeDNA {
  hook: string
  opening: string
  storyStructure: string
  ctaStructure: string
  editingStyle: string
  offerPresentation: string
  visualStyle: string
  summary: string
}

interface CloneReference extends CreativeDNA {
  taxonomy?: CreativeTaxonomy
  sourceLabel?: string
}

interface ExternalAd {
  id: string
  pageName: string
  body: string
  title: string
  snapshotUrl?: string
  daysActive?: number
}

const EMPTY_DNA: CreativeDNA = {
  hook: '',
  opening: '',
  storyStructure: '',
  ctaStructure: '',
  editingStyle: '',
  offerPresentation: '',
  visualStyle: '',
  summary: '',
}

// The editable DNA fields, in a sensible edit order.
const DNA_FIELDS: { key: keyof CreativeDNA; label: string; long?: boolean }[] = [
  { key: 'hook', label: 'Hook' },
  { key: 'opening', label: 'Opening' },
  { key: 'storyStructure', label: 'Story structure', long: true },
  { key: 'ctaStructure', label: 'CTA structure' },
  { key: 'offerPresentation', label: 'Offer presentation' },
  { key: 'visualStyle', label: 'Visual style' },
  { key: 'editingStyle', label: 'Editing style' },
  { key: 'summary', label: 'Summary', long: true },
]

/* --------------------------------- component ------------------------------- */

export function AdLibrary({
  initialWinners,
  winnersLive,
}: {
  initialWinners: WinnerCard[]
  winnersLive: boolean
}) {
  const router = useRouter()
  const [tab, setTab] = useState<'winners' | 'external'>('winners')
  const [editing, setEditing] = useState<CloneReference | null>(null)

  /* -------- external search + paste -------- */
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<ExternalAd[]>([])
  const [note, setNote] = useState<string | null>(null)
  const [paste, setPaste] = useState('')
  const [extracting, setExtracting] = useState(false)

  const search = useCallback(async () => {
    if (!query.trim() || searching) return
    setSearching(true)
    setNote(null)
    try {
      const res = await fetch(`/api/ad-library/search?q=${encodeURIComponent(query.trim())}`).then((r) =>
        r.json(),
      )
      setResults(Array.isArray(res.ads) ? res.ads : [])
      setNote(res.note ?? null)
    } catch {
      setResults([])
      setNote('Ad Library search is unavailable right now. Paste an ad below to clone it instead.')
    } finally {
      setSearching(false)
    }
  }, [query, searching])

  // Turn arbitrary ad text into an editable Creative DNA via SPARK + classifier.
  const extractToEditor = useCallback(async (text: string, sourceLabel: string) => {
    if (text.trim().length < 20 || extracting) return
    setExtracting(true)
    try {
      const res = await fetch('/api/clone/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, sourceLabel }),
      }).then((r) => r.json())
      if (res.ok) {
        setEditing({ ...EMPTY_DNA, ...res.dna, taxonomy: res.taxonomy, sourceLabel })
      } else {
        setNote(res.error || 'Could not read that ad.')
      }
    } catch {
      setNote('Could not extract that ad. Try again.')
    } finally {
      setExtracting(false)
    }
  }, [extracting])

  // Internal winner → editable reference. DNA already exists as taxonomy + the
  // winning concept text, so we prefill from that rather than re-extracting.
  const cloneWinner = (w: WinnerCard) => {
    setEditing({
      ...EMPTY_DNA,
      summary: w.conceptText,
      hook: w.conceptText.split(/[.!?\n]/)[0]?.trim() ?? '',
      taxonomy: w.taxonomy,
      sourceLabel: `${w.title} · ${w.conceptType}`,
    })
  }

  // Hand the edited reference to the reactor and jump there. sessionStorage keeps
  // the payload out of the URL; Workbench reads + clears it on mount.
  const sendToReactor = (ref: CloneReference) => {
    try {
      sessionStorage.setItem(CLONE_STORAGE_KEY, JSON.stringify(ref))
    } catch {
      /* private mode — the reactor just won't pre-load a clone */
    }
    router.push('/campaign-reactor')
  }

  return (
    <>
      {/* Tabs */}
      <div className="mb-5 inline-flex rounded-full border border-white/10 bg-white/[0.03] p-1">
        {(
          [
            { id: 'winners', label: 'Our Winners', icon: Trophy },
            { id: 'external', label: 'Ad Library', icon: Search },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              tab === t.id ? 'bg-cyan text-black' : 'text-white/60 hover:text-white/85'
            }`}
          >
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'winners' ? (
        <Panel>
          <PanelHeader
            icon={<Trophy size={16} />}
            accent="cyan"
            title="Our Winners"
            subtitle="Proven ads from ORACLE, ranked by winner score. Clone one to regenerate fresh creative on the same structure."
            accessory={
              winnersLive ? (
                <Pill tone="primary">{initialWinners.length} winners</Pill>
              ) : (
                <Pill tone="default">Demo winners</Pill>
              )
            }
          />
          {initialWinners.length === 0 ? (
            <EmptyState label="No winners logged yet — sync Meta performance or mark a concept a winner to fill this." />
          ) : (
            <div className="grid grid-cols-1 gap-3 p-5 md:grid-cols-2">
              {initialWinners.map((w) => (
                <WinnerTile key={w.id} winner={w} onClone={() => cloneWinner(w)} />
              ))}
            </div>
          )}
        </Panel>
      ) : (
        <Panel>
          <PanelHeader
            icon={<Search size={16} />}
            accent="cyan"
            title="Ad Library"
            subtitle="Paste any ad's copy or transcript to clone it — or search Meta's Ad Library where available."
          />
          <div className="space-y-5 p-5">
            {/* Paste-to-clone — the primary, always-available path */}
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <p className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.1em] text-white/45">
                <Clipboard size={13} /> Paste an ad to clone
              </p>
              <textarea
                value={paste}
                onChange={(e) => setPaste(e.target.value)}
                rows={4}
                placeholder="Paste the ad's primary text, script, or transcript here…"
                className="w-full resize-none rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-[13px] text-white/80 placeholder:text-white/30 focus:border-cyan/40 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => extractToEditor(paste, 'Pasted ad')}
                disabled={paste.trim().length < 20 || extracting}
                className="mt-2.5 inline-flex items-center gap-2 rounded-full bg-cyan px-4 py-2 text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {extracting ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                Extract &amp; Clone
              </button>
            </div>

            {/* Optional live search */}
            <div>
              <div className="flex gap-2">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && search()}
                  placeholder="Search competitor ads (e.g. a brand or product)…"
                  className="flex-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-[13px] text-white/80 placeholder:text-white/30 focus:border-cyan/40 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={search}
                  disabled={!query.trim() || searching}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/75 transition-colors hover:border-white/20 hover:text-white disabled:opacity-40"
                >
                  {searching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                  Search
                </button>
              </div>
              {note && (
                <p className="mt-2 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-[12px] text-white/50">
                  {note}
                </p>
              )}
              {results.length > 0 && (
                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                  {results.map((ad) => (
                    <ExternalTile
                      key={ad.id}
                      ad={ad}
                      busy={extracting}
                      onClone={() =>
                        extractToEditor(
                          [ad.title, ad.body].filter(Boolean).join('\n'),
                          `${ad.pageName} (Ad Library)`,
                        )
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </Panel>
      )}

      {editing && (
        <CloneEditor
          reference={editing}
          onChange={setEditing}
          onCancel={() => setEditing(null)}
          onSend={() => sendToReactor(editing)}
        />
      )}
    </>
  )
}

/* -------------------------------- sub-parts -------------------------------- */

function EmptyState({ label }: { label: string }) {
  return (
    <div className="grid place-items-center px-6 py-14 text-center">
      <Copy size={30} className="mb-3 text-white/15" />
      <p className="max-w-md text-sm text-white/40">{label}</p>
    </div>
  )
}

function TaxonomyChips({ taxonomy }: { taxonomy?: CreativeTaxonomy }) {
  const tags = taxonomyToTags(taxonomy)
  if (!tags.length) return null
  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((t) => (
        <span
          key={t}
          className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[11px] text-white/55"
        >
          {t}
        </span>
      ))}
    </div>
  )
}

function WinnerTile({ winner, onClone }: { winner: WinnerCard; onClone: () => void }) {
  const m = winner.metrics
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">{winner.title}</p>
          <p className="text-[12px] text-white/45">{winner.conceptType}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-[12px] font-bold text-emerald-300">
            {winner.scoreBand}
          </span>
          {winner.scoreConfidence && (
            <span
              className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                winner.scoreConfidence === 'high'
                  ? 'bg-white/10 text-white/60'
                  : 'bg-cyan/15 text-cyan'
              }`}
            >
              {winner.scoreConfidence}
            </span>
          )}
        </div>
      </div>
      <p className="line-clamp-3 text-[13px] leading-relaxed text-white/65">{winner.conceptText}</p>
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-white/45">
        {typeof m.ctr === 'number' && <span>CTR {m.ctr.toFixed(2)}%</span>}
        {typeof m.roas === 'number' && <span>ROAS {m.roas.toFixed(1)}x</span>}
        {typeof m.spend === 'number' && <span>${Math.round(m.spend).toLocaleString()} spend</span>}
      </div>
      <TaxonomyChips taxonomy={winner.taxonomy} />
      <button
        type="button"
        onClick={onClone}
        className="mt-1 inline-flex items-center justify-center gap-2 rounded-full border border-cyan/40 bg-cyan/10 px-4 py-2 text-sm font-semibold text-cyan transition-colors hover:bg-cyan/20"
      >
        <Copy size={14} /> Clone &amp; Iterate
      </button>
    </div>
  )
}

function ExternalTile({ ad, onClone, busy }: { ad: ExternalAd; onClone: () => void; busy: boolean }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-white">{ad.pageName}</p>
        {typeof ad.daysActive === 'number' && (
          <span className="shrink-0 rounded-md bg-white/10 px-2 py-0.5 text-[11px] text-white/55">
            {ad.daysActive}d active
          </span>
        )}
      </div>
      {ad.title && <p className="text-[13px] font-medium text-white/80">{ad.title}</p>}
      <p className="line-clamp-4 text-[13px] leading-relaxed text-white/60">{ad.body || '—'}</p>
      <button
        type="button"
        onClick={onClone}
        disabled={busy}
        className="mt-1 inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.03] px-4 py-2 text-sm font-semibold text-white/80 transition-colors hover:border-white/25 disabled:opacity-40"
      >
        <Copy size={14} /> Clone
      </button>
    </div>
  )
}

function CloneEditor({
  reference,
  onChange,
  onCancel,
  onSend,
}: {
  reference: CloneReference
  onChange: (r: CloneReference) => void
  onCancel: () => void
  onSend: () => void
}) {
  const set = (key: keyof CreativeDNA, v: string) => onChange({ ...reference, [key]: v })
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm">
      <div className="my-8 w-full max-w-2xl rounded-2xl border border-white/10 bg-[#0a0a0a] shadow-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-6 py-4">
          <div className="flex items-center gap-2">
            <Copy size={16} className="text-cyan" />
            <p className="font-display text-sm font-semibold text-white">
              Review Creative DNA{reference.sourceLabel ? ` — ${reference.sourceLabel}` : ''}
            </p>
          </div>
          <button type="button" onClick={onCancel} className="text-white/40 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-white/40">
              Taxonomy tag
            </p>
            <TaxonomyChips taxonomy={reference.taxonomy} />
          </div>

          {DNA_FIELDS.map((f) => (
            <label key={f.key} className="block">
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.1em] text-white/40">
                {f.label}
              </span>
              {f.long ? (
                <textarea
                  value={reference[f.key]}
                  onChange={(e) => set(f.key, e.target.value)}
                  rows={2}
                  className="w-full resize-none rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-[13px] text-white/85 focus:border-cyan/40 focus:outline-none"
                />
              ) : (
                <input
                  value={reference[f.key]}
                  onChange={(e) => set(f.key, e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-[13px] text-white/85 focus:border-cyan/40 focus:outline-none"
                />
              )}
            </label>
          ))}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-white/10 px-6 py-4">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full px-4 py-2 text-sm text-white/50 hover:text-white/80"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSend}
            className="inline-flex items-center gap-2 rounded-full bg-cyan px-5 py-2.5 text-sm font-semibold text-black transition-opacity hover:opacity-90"
          >
            Send to Reactor <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}
