import type { CopyOutput, ImageResult } from '@/types'

interface AdPreviewProps {
  copy: CopyOutput
  image: ImageResult
  modelLabel: string
}

export function AdPreview({ copy, image, modelLabel }: AdPreviewProps) {
  return (
    <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.02] overflow-hidden">
      <div className="px-6 py-4 border-b border-amber-500/20 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-amber-400">Final Ad Preview</h3>
          <p className="text-xs text-white/30 mt-0.5">Ready for review and approval</p>
        </div>
        <span className="shrink-0 text-xs px-2 py-1 rounded-md bg-white/5 text-white/50 border border-white/10">
          Copy: {modelLabel}
        </span>
      </div>

      <div className="p-6">
        <div className="max-w-sm mx-auto rounded-xl overflow-hidden border border-white/10 bg-white/5">
          <div className="p-3 border-b border-white/10 flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
              <span className="text-xs font-bold text-amber-400">SB</span>
            </div>
            <div>
              <p className="text-xs font-semibold">Summit Build Co</p>
              <p className="text-xs text-white/30">Sponsored</p>
            </div>
          </div>

          <div className="p-3">
            <p className="text-sm font-semibold leading-snug mb-2">{copy.finalHook}</p>
            <p className="text-xs text-white/60 leading-relaxed">{copy.finalBody}</p>
          </div>

          {image.status === 'complete' && image.imageUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={image.imageUrl} alt="Ad creative" className="w-full aspect-square object-cover" />
          ) : (
            <div className="aspect-square bg-white/5 flex items-center justify-center">
              <p className="text-xs text-white/20">No image generated</p>
            </div>
          )}

          <div className="p-3 border-t border-white/10">
            <p className="text-xs text-white/40">summitbuildco.com.au</p>
            <button
              type="button"
              className="mt-2 w-full py-2 rounded-lg bg-white/10 text-xs font-semibold text-white hover:bg-white/15 transition-colors"
            >
              {copy.finalCta}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
