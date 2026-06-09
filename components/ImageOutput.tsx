import type { ImageResult } from '@/types'

interface ImageOutputProps {
  higgsfield: ImageResult
  openai: ImageResult
}

function StatusBadge({ status }: { status: ImageResult['status'] }) {
  const label =
    status === 'complete' ? 'Generated' : status === 'generating' ? 'Generating...' : status === 'error' ? 'Error' : 'Idle'
  const cls =
    status === 'complete'
      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      : status === 'generating'
        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse'
        : status === 'error'
          ? 'bg-red-500/10 text-red-400 border-red-500/20'
          : 'bg-white/5 text-white/40 border-white/10'
  return <span className={`text-xs px-2 py-1 rounded-md border ${cls}`}>{label}</span>
}

function ImagePanel({ label, result }: { label: string; result: ImageResult }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.02] overflow-hidden">
      <div className="px-3 py-2.5 border-b border-white/10 flex items-center justify-between">
        <span className="text-xs font-medium text-white/70">{label}</span>
        <StatusBadge status={result.status} />
      </div>
      <div className="p-3">
        {result.status === 'generating' && (
          <div className="aspect-square rounded-md bg-white/5 border border-white/10 flex items-center justify-center">
            <div className="text-center">
              <div className="w-7 h-7 border-2 border-amber-500/40 border-t-amber-500 rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-xs text-white/30">Rendering...</p>
            </div>
          </div>
        )}

        {result.status === 'complete' && result.imageUrl && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={result.imageUrl}
            alt={`${label} ad creative`}
            className="w-full rounded-md object-cover aspect-square"
          />
        )}

        {(result.status === 'error' || (result.status === 'complete' && !result.imageUrl)) && (
          <div className="aspect-square rounded-md bg-red-500/5 border border-red-500/20 flex items-center justify-center p-4 text-center">
            <p className="text-xs text-red-400/60">Image unavailable. Copy is still ready to use.</p>
          </div>
        )}

        {result.status === 'idle' && (
          <div className="aspect-square rounded-md bg-white/5 border border-white/10 flex items-center justify-center">
            <p className="text-xs text-white/20">Waiting</p>
          </div>
        )}
      </div>
    </div>
  )
}

export function ImageOutput({ higgsfield, openai }: ImageOutputProps) {
  const prompt = higgsfield.prompt || openai.prompt

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
      <div className="px-6 py-4 border-b border-white/10">
        <h3 className="text-sm font-semibold">Image Creative</h3>
        <p className="text-xs text-white/30 mt-0.5">Higgsfield and OpenAI, side by side</p>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ImagePanel label="Higgsfield · flux-1.1-pro" result={higgsfield} />
          <ImagePanel label="OpenAI · gpt-image-1" result={openai} />
        </div>

        {prompt && (
          <div className="mt-4 p-3 rounded-lg bg-white/5 border border-white/5">
            <p className="text-xs text-white/30 mb-1">Shared Image Prompt</p>
            <p className="text-xs text-white/50 leading-relaxed">{prompt}</p>
          </div>
        )}
      </div>
    </div>
  )
}
