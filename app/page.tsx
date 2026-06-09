'use client'

import { useState } from 'react'
import { BriefForm } from '@/components/BriefForm'
import { CopyOutput } from '@/components/CopyOutput'
import { ImageOutput } from '@/components/ImageOutput'
import { AdPreview } from '@/components/AdPreview'
import { BuilderBar } from '@/components/BuilderBar'
import type {
  Builder,
  CampaignBrief,
  CopyModel,
  CopyOutput as CopyOutputType,
  ImageProvider,
  ImageResult,
} from '@/types'

type AppState = 'idle' | 'generating-copy' | 'generating-image' | 'complete' | 'error'

const MODEL_LABELS: Record<CopyModel, string> = {
  claude: 'Claude · claude-sonnet-4-6',
  openai: 'OpenAI · gpt-5.5',
}

const emptyImage = (provider: ImageProvider): ImageResult => ({
  provider,
  prompt: '',
  imageUrl: null,
  status: 'idle',
})

async function postJson(url: string, body: unknown) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return res.json()
}

export default function Home() {
  const [appState, setAppState] = useState<AppState>('idle')
  const [selectedBuilder, setSelectedBuilder] = useState<Builder | null>(null)
  const [brief, setBrief] = useState<CampaignBrief>({ angle: '', goal: '' })
  const [copyClaude, setCopyClaude] = useState<CopyOutputType | null>(null)
  const [copyOpenai, setCopyOpenai] = useState<CopyOutputType | null>(null)
  const [selectedModel, setSelectedModel] = useState<CopyModel>('claude')
  const [imgHiggsfield, setImgHiggsfield] = useState<ImageResult>(emptyImage('higgsfield'))
  const [imgOpenai, setImgOpenai] = useState<ImageResult>(emptyImage('openai'))
  const [saved, setSaved] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const selectedCopy = selectedModel === 'claude' ? copyClaude : copyOpenai
  const previewImage =
    imgHiggsfield.status === 'complete'
      ? imgHiggsfield
      : imgOpenai.status === 'complete'
        ? imgOpenai
        : imgHiggsfield

  const isGenerating = appState === 'generating-copy' || appState === 'generating-image'
  const brandName = selectedBuilder?.name ?? 'Summit Build Co'

  const handleGenerate = async (b: CampaignBrief) => {
    setBrief(b)
    setAppState('generating-copy')
    setCopyClaude(null)
    setCopyOpenai(null)
    setSelectedModel('claude')
    setImgHiggsfield(emptyImage('higgsfield'))
    setImgOpenai(emptyImage('openai'))
    setSaved(false)
    setErrorMsg(null)

    const builderId = selectedBuilder?.id ?? null

    try {
      // 1. Both copy models, same brief, in parallel.
      const [claudeRes, openaiRes] = await Promise.allSettled([
        postJson('/api/generate-copy', { brief: b, builderId }),
        postJson('/api/generate-copy-openai', { brief: b, builderId }),
      ])

      let claudeCopy: CopyOutputType | null = null
      if (claudeRes.status === 'fulfilled' && claudeRes.value?.success) {
        claudeCopy = claudeRes.value.data as CopyOutputType
        setCopyClaude(claudeCopy)
      }

      let openaiCopy: CopyOutputType | null = null
      if (openaiRes.status === 'fulfilled' && openaiRes.value?.success) {
        openaiCopy = openaiRes.value.data as CopyOutputType
        setCopyOpenai(openaiCopy)
      }

      // Claude is primary. Fall back to OpenAI only if Claude failed.
      const primary = claudeCopy ?? openaiCopy
      if (!primary) throw new Error('Both copy generators failed. Check your API keys.')
      if (!claudeCopy && openaiCopy) setSelectedModel('openai')

      const imagePrompt =
        primary.imagePrompt ||
        `Professional advertising photograph for ${brandName} — ${b.angle}`

      // 2. Both image providers, same prompt, in parallel.
      setAppState('generating-image')
      setImgHiggsfield({ provider: 'higgsfield', prompt: imagePrompt, imageUrl: null, status: 'generating' })
      setImgOpenai({ provider: 'openai', prompt: imagePrompt, imageUrl: null, status: 'generating' })

      const [hfRes, oaRes] = await Promise.allSettled([
        postJson('/api/generate-image', { prompt: imagePrompt }),
        postJson('/api/generate-image-openai', { prompt: imagePrompt }),
      ])

      const hfUrl =
        hfRes.status === 'fulfilled' && hfRes.value?.success ? (hfRes.value.imageUrl ?? null) : null
      const oaUrl =
        oaRes.status === 'fulfilled' && oaRes.value?.success ? (oaRes.value.imageUrl ?? null) : null

      setImgHiggsfield({
        provider: 'higgsfield',
        prompt: imagePrompt,
        imageUrl: hfUrl,
        status: hfUrl ? 'complete' : 'error',
      })
      setImgOpenai({
        provider: 'openai',
        prompt: imagePrompt,
        imageUrl: oaUrl,
        status: oaUrl ? 'complete' : 'error',
      })

      setAppState('complete')
    } catch (err) {
      console.error(err)
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong')
      setAppState('error')
    }
  }

  const handleSave = async () => {
    if (!selectedCopy) return
    try {
      const res = await postJson('/api/save-output', {
        builderId: selectedBuilder?.id ?? null,
        campaignAngle: brief.angle,
        campaignGoal: brief.goal,
        copy: selectedCopy,
        copyModel: selectedModel,
        imagePrompt: selectedCopy.imagePrompt,
        imageUrlHiggsfield: imgHiggsfield.imageUrl,
        imageUrlOpenai: imgOpenai.imageUrl,
      })
      if (res?.success) setSaved(true)
      else setErrorMsg(res?.error || 'Save failed')
    } catch (err) {
      console.error('Save failed:', err)
      setErrorMsg('Save failed')
    }
  }

  const copyModelsShown = appState !== 'idle'

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      <header className="border-b border-white/10 px-8 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Pro Builder Ad Oracle</h1>
            <p className="text-xs text-white/40 mt-0.5">AI Creative System for builders</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
            <span className="text-xs text-white/40">
              {selectedBuilder ? `Brand: ${selectedBuilder.name}` : 'Default brand memory'}
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-8 py-10 space-y-6">
        <BuilderBar selectedBuilder={selectedBuilder} onSelect={setSelectedBuilder} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <BriefForm onGenerate={handleGenerate} isGenerating={isGenerating} appState={appState} />
          </div>

          <div className="lg:col-span-2 space-y-6">
            {appState === 'idle' && (
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-12 text-center">
                <p className="text-white/30 text-sm">
                  {selectedBuilder
                    ? `Enter a campaign brief to generate creative for ${selectedBuilder.name}`
                    : 'Onboard or select a builder, then enter a campaign brief to generate'}
                </p>
              </div>
            )}

            {errorMsg && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/[0.04] p-4">
                <p className="text-sm text-red-400">{errorMsg}</p>
              </div>
            )}

            {copyModelsShown && (
              <section className="space-y-3">
                <div>
                  <h2 className="text-sm font-semibold">Ad Copy — Model Comparison</h2>
                  <p className="text-xs text-white/30 mt-0.5">
                    Two models, one brief. Pick the winner for the final ad.
                  </p>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
                  {(['claude', 'openai'] as const).map((model) => {
                    const copy = model === 'claude' ? copyClaude : copyOpenai
                    if (copy) {
                      return (
                        <CopyOutput
                          key={model}
                          output={copy}
                          modelLabel={MODEL_LABELS[model]}
                          selected={selectedModel === model}
                          onSelect={() => setSelectedModel(model)}
                        />
                      )
                    }
                    return (
                      <div
                        key={model}
                        className="rounded-xl border border-white/10 bg-white/[0.02] p-5 min-h-[160px] flex items-center justify-center text-center"
                      >
                        {appState === 'generating-copy' ? (
                          <span className="flex items-center gap-2 text-xs text-white/40">
                            <span className="w-3 h-3 border border-white/30 border-t-transparent rounded-full animate-spin"></span>
                            {MODEL_LABELS[model]} writing…
                          </span>
                        ) : (
                          <span className="text-xs text-white/30">{MODEL_LABELS[model]} unavailable</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {(appState === 'generating-image' || appState === 'complete') && (
              <ImageOutput higgsfield={imgHiggsfield} openai={imgOpenai} />
            )}

            {appState === 'complete' && selectedCopy && (
              <>
                <AdPreview copy={selectedCopy} image={previewImage} modelLabel={MODEL_LABELS[selectedModel]} />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saved}
                    className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      saved
                        ? 'bg-emerald-500/20 text-emerald-400 cursor-default'
                        : 'bg-amber-500 hover:bg-amber-400 text-black'
                    }`}
                  >
                    {saved ? '✓ Saved to Library' : 'Save to Library'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
