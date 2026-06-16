'use client'

import { useEffect, useRef, useState } from 'react'
import { Database, Lock, Unlock } from 'lucide-react'

type DoorPhase = 'sealed' | 'unlocking' | 'opening' | 'open'

/**
 * Cinematic blast-door reveal for the Knowledge Vault. Mounts sealed over the
 * page, runs a brief unlock sequence, then slides its two halves apart to
 * reveal the vault contents. Plays on every visit, is skippable on click, and
 * opens instantly when the user prefers reduced motion.
 */
export function VaultDoor({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<DoorPhase>('sealed')
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      setPhase('open')
      return
    }
    // Auto-run the sequence: sealed → unlocking → opening → open.
    const t = timers.current
    t.push(setTimeout(() => setPhase('unlocking'), 650))
    t.push(setTimeout(() => setPhase('opening'), 1300))
    t.push(setTimeout(() => setPhase('open'), 2500))
    return () => t.forEach(clearTimeout)
  }, [])

  // Let the user skip straight through the animation.
  const skip = () => {
    timers.current.forEach(clearTimeout)
    setPhase('opening')
    timers.current.push(setTimeout(() => setPhase('open'), 1200))
  }

  const opening = phase === 'opening' || phase === 'open'

  return (
    <div className="relative">
      {children}

      {phase !== 'open' && (
        <div
          className="vault-door-overlay fixed inset-0 z-[60] overflow-hidden"
          role="presentation"
          onClick={skip}
        >
          {/* Left blast door */}
          <div
            className={`absolute inset-y-0 left-0 w-1/2 border-r border-glow/20 bg-gradient-to-br from-[#0b1322] via-[#070d18] to-[#04060c] transition-transform duration-[1200ms] ease-[cubic-bezier(0.7,0,0.2,1)] ${
              opening ? '-translate-x-full' : 'translate-x-0'
            }`}
          >
            <div className="vault-door-plating absolute inset-0 opacity-70" />
            <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-glow/60 to-transparent" />
          </div>

          {/* Right blast door */}
          <div
            className={`absolute inset-y-0 right-0 w-1/2 border-l border-glow/20 bg-gradient-to-bl from-[#0b1322] via-[#070d18] to-[#04060c] transition-transform duration-[1200ms] ease-[cubic-bezier(0.7,0,0.2,1)] ${
              opening ? 'translate-x-full' : 'translate-x-0'
            }`}
          >
            <div className="vault-door-plating absolute inset-0 opacity-70" />
            <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-glow/60 to-transparent" />
          </div>

          {/* Centre seal — fades out as the doors part */}
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
              <button
                type="button"
                onClick={skip}
                className="mt-1 font-mono text-[10px] uppercase tracking-[0.3em] text-white/30 transition-colors hover:text-glow"
              >
                Click to enter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
