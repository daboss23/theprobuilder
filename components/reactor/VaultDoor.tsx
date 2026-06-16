'use client'

import { useEffect, useRef, useState } from 'react'
import { Database, Lock, Unlock } from 'lucide-react'

type DoorPhase = 'sealed' | 'unlocking' | 'opening'

/**
 * Immersive Knowledge Vault shell. Plays the rendered blast-door clip (camera
 * pushes inside), then keeps that interior as a living, dimmed backdrop while
 * the vault knowledge floats on top of it — you never leave the vault. Falls
 * back to a CSS blast-door when the clip can't load, and enters instantly under
 * reduced-motion. Plays on every visit; skippable on click.
 */
export function VaultDoor({ children }: { children: React.ReactNode }) {
  const [entered, setEntered] = useState(false)
  const [phase, setPhase] = useState<DoorPhase>('sealed')
  const [useVideo, setUseVideo] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  // Respect reduced-motion: drop straight into the interior.
  useEffect(() => {
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduced) setEntered(true)
  }, [])

  // CSS-fallback unlock sequence (only when the clip isn't used).
  useEffect(() => {
    if (useVideo || entered) return
    const t = timers.current
    t.push(setTimeout(() => setPhase('unlocking'), 650))
    t.push(setTimeout(() => setPhase('opening'), 1300))
    t.push(setTimeout(() => setEntered(true), 2500))
    return () => t.forEach(clearTimeout)
  }, [useVideo, entered])

  // Click anywhere on the sealed door to drop straight inside.
  const skip = () => {
    if (entered) return
    timers.current.forEach(clearTimeout)
    if (useVideo) {
      const v = videoRef.current
      if (v && v.duration) v.currentTime = Math.max(0, v.duration - 0.05)
    } else {
      setPhase('opening')
    }
    setEntered(true)
  }

  const opening = phase === 'opening'

  return (
    <div className="vault-shell relative isolate min-h-[calc(100vh-150px)] overflow-hidden rounded-2xl">
      {/* ---- Living vault interior backdrop ---------------------------------- */}
      <div className="absolute inset-0 -z-10 bg-[#04060c]">
        {useVideo ? (
          <video
            ref={videoRef}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ease-out ${
              entered ? 'opacity-30' : 'opacity-100'
            }`}
            src="/vault/vault-door.mp4"
            autoPlay
            muted
            playsInline
            preload="auto"
            onEnded={() => setEntered(true)}
            onError={() => setUseVideo(false)}
          />
        ) : (
          <>
            {/* CSS blast-door fallback */}
            <div
              className={`absolute inset-y-0 left-0 w-1/2 border-r border-glow/20 bg-gradient-to-br from-[#0b1322] via-[#070d18] to-[#04060c] transition-transform duration-[1200ms] ease-[cubic-bezier(0.7,0,0.2,1)] ${
                opening || entered ? '-translate-x-full' : 'translate-x-0'
              }`}
            >
              <div className="vault-door-plating absolute inset-0 opacity-70" />
            </div>
            <div
              className={`absolute inset-y-0 right-0 w-1/2 border-l border-glow/20 bg-gradient-to-bl from-[#0b1322] via-[#070d18] to-[#04060c] transition-transform duration-[1200ms] ease-[cubic-bezier(0.7,0,0.2,1)] ${
                opening || entered ? 'translate-x-full' : 'translate-x-0'
              }`}
            >
              <div className="vault-door-plating absolute inset-0 opacity-70" />
            </div>
          </>
        )}

        {/* Legibility scrim — fades in once you're inside */}
        <div
          className={`vault-interior-scrim pointer-events-none absolute inset-0 transition-opacity duration-1000 ${
            entered ? 'opacity-100' : 'opacity-0'
          }`}
        />
      </div>

      {/* ---- Sealed-door messaging (only before entry) ---------------------- */}
      {!entered && (
        <button
          type="button"
          onClick={skip}
          className="absolute inset-0 z-20 grid place-items-end justify-center pb-10"
          aria-label="Enter the Knowledge Vault"
        >
          <span className="flex flex-col items-center gap-3 text-center">
            {!useVideo && (
              <span
                className={`vault-seal grid h-24 w-24 place-items-center rounded-full border border-glow/40 ${
                  phase === 'unlocking' ? 'is-unlocking' : ''
                }`}
              >
                {phase === 'unlocking' ? (
                  <Unlock size={30} className="text-glow" />
                ) : (
                  <Lock size={30} className="text-glow/80" />
                )}
              </span>
            )}
            <span className="flex items-center gap-2 font-display text-xs font-bold uppercase tracking-[0.3em] text-glow">
              <Database size={13} /> Knowledge Vault
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/40">
              Click to enter
            </span>
          </span>
        </button>
      )}

      {/* ---- The knowledge, living inside the vault ------------------------- */}
      <div
        className={`relative z-10 px-4 py-6 transition-all duration-1000 ease-out sm:px-6 ${
          entered ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'
        }`}
      >
        {children}
      </div>
    </div>
  )
}
