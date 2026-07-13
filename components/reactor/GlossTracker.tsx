'use client'

import { useEffect } from 'react'

/**
 * Pointer-tracked gloss — the liquid-glass signature interaction.
 *
 * Writes the cursor position into `--mx` / `--my` on the document root. A fixed
 * light layer (`.lg-pointer-glow`, globals.css) sits BEHIND the translucent
 * panels, so as the cursor moves a bright neon spot drifts under the frosted
 * glass and refracts through it — "the glass bends the light behind it."
 *
 * Renders the light layer itself. Pointer listener is passive + rAF-throttled,
 * and it no-ops under `prefers-reduced-motion` (the glow just holds center).
 */
export function GlossTracker() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const root = document.documentElement
    let frame = 0
    let x = window.innerWidth / 2
    let y = window.innerHeight * 0.3

    const paint = () => {
      frame = 0
      root.style.setProperty('--mx', `${x}px`)
      root.style.setProperty('--my', `${y}px`)
    }
    const onMove = (e: PointerEvent) => {
      x = e.clientX
      y = e.clientY
      if (!frame) frame = requestAnimationFrame(paint)
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onMove)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  return <div className="lg-pointer-glow" aria-hidden="true" />
}
