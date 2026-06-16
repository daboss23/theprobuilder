'use client'

import { useEffect, useRef, useState } from 'react'
import { Database, Lock, Unlock } from 'lucide-react'

type DoorPhase = 'sealed' | 'unlocking' | 'opening' | 'open'

/**
 * Cinematic vault entrance for the Knowledge Vault. Plays a rendered blast-door
 * clip that opens and pushes the camera inside, then fades the page content in
 * over the final frame. Falls back to a CSS blast-door when the video can't
 * load, and opens instantly when the user prefers reduced motion. Plays on
 * every visit and is skippable on click.
 */
export function VaultDoor({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<DoorPhase>('sealed')
  const [useVideo, setUseVideo] = useState(true)
  const [fading, setFading] = useState(false)
  const [hidden, setHidden] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  // Respect reduced-motion: skip the whole reveal.
  useEffect(() => {
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      setHidden(true)
      setPhase('open')
    }
  }, [])

  // CSS-fallback unlock sequence (only runs when the video isn't used).
  useEffect(() => {
    if (useVideo || hidden) return
    const t = timers.current
    t.push(setTimeout(() => setPhase('unlocking'), 650))
    t.push(setTimeout(() => setPhase('opening'), 1300))
    t.push(setTimeout(() => endReveal(), 2500))
    return () => t.forEach(clearTimeout)
  }, [useVideo, hidden])

  // Fade the overlay out, revealing the vault content beneath, then unmount it.
  const endReveal = () => {
    setFading(true)
    timers.current.push(setTimeout(() => setHidden(true), 900))
  }

  // Click anywhere to skip to the interior.
  const skip = () => {
    timers.current.forEach(clearTimeout)
    if (useVideo) {
      const v = videoRef.current
      if (v && v.duration) v.currentTime = Math.max(0, v.duration - 0.05)
      endReveal()
    } else {
      setPhase('opening')
      timers.current.push(setTimeout(endReveal, 1100))
    }
  }

  const opening = phase === 'opening' || phase === 'open'

  if (hidden) return <div className="relative">{children}</div>

  return (
    <div className="relative">
      {children}

      <div
        className={`vault-door-overlay fixed inset-0 z-[60] overflow-hidden transition-opacity duration-[900ms] ease-out ${
          fading ? 'opacity-0' : 'opacity-100'
        }`}
        role="presentation"
        onClick={skip}
      >
        {useVideo ? (
          <>
            <video
              ref={videoRef}
              className="absolute inset-0 h-full w-full object-cover"
              src="/vault/vault-door.mp4"
              autoPlay
              muted
              playsInline
              preload="auto"
              onEnded={endReveal}
              onError={() => setUseVideo(false)}
            />
            {/* Edge vignette so the square clip blends into the panel on wide screens */}
            <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_180px_60px_#04060c]" />
            <button
              type="button"
              onClick={skip}
              className="absolute bottom-8 left-1/2 -translate-x-1/2 font-mono text-[10px] uppercase tracking-[0.3em] text-white/40 transition-colors hover:text-glow"
            >
              Click to enter
            </button>
          </>
        ) : (
          <>
            {/* CSS blast-door fallback */}
            <div
              className={`absolute inset-y-0 left-0 w-1/2 border-r border-glow/20 bg-gradient-to-br from-[#0b1322] via-[#070d18] to-[#04060c] transition-transform duration-[1200ms] ease-[cubic-bezier(0.7,0,0.2,1)] ${
                opening ? '-translate-x-full' : 'translate-x-0'
              }`}
            >
              <div className="vault-door-plating absolute inset-0 opacity-70" />
              <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-glow/60 to-transparent" />
            </div>
            <div
              className={`absolute inset-y-0 right-0 w-1/2 border-l border-glow/20 bg-gradient-to-bl from-[#0b1322] via-[#070d18] to-[#04060c] transition-transform duration-[1200ms] ease-[cubic-bezier(0.7,0,0.2,1)] ${
                opening ? 'translate-x-full' : 'translate-x-0'
              }`}
            >
              <div className="vault-door-plating absolute inset-0 opacity-70" />
              <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-glow/60 to-transparent" />
            </div>
            <div
              className={`pointer-events-none absolute inset-0 grid place-items-center transition-opacity duration-500 ${
                opening ? 'opacity-0' : 'opacity-100'
              }`}
            >
              <div className="flex flex-col items-center gap-5 text-center">
                <div
                  className={`vault-seal grid h-28 w-28 place-items-center rounded-full border border-glow/40 ${
                    phase === 'unlocking' ? 'is-unlocking' : ''
                  }`}
                >
                  {phase === 'unlocking' ? (
                    <Unlock size={34} className="text-glow" />
                  ) : (
                    <Lock size={34} className="text-glow/80" />
                  )}
                </div>
                <div className="space-y-1">
                  <p className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-[0.3em] text-glow">
                    <Database size={14} /> Knowledge Vault
                  </p>
                  <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-white/40">
                    {phase === 'unlocking' ? 'Access granted — opening' : 'Authenticating…'}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
