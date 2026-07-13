'use client'

import { useEffect } from 'react'

/**
 * Liquid Glass effects layer — mounted once in the platform shell.
 *
 * 1. Registers the #liquid-glass SVG filter (feTurbulence → feDisplacementMap)
 *    that `.liquid-glass` reads through `backdrop-filter` to physically refract
 *    the content behind it. Animated so the surface reads as living liquid.
 * 2. Delegates a pointer-tracked specular hotspot onto every `.liquid-glass`
 *    element via CSS custom properties (--mx/--my), so no per-button wiring is
 *    needed anywhere in the app.
 *
 * The filter is invisible on its own; it only takes effect where an element
 * opts into the `.liquid-glass` class. Respects reduced-motion (the CSS handles
 * the transitions; the turbulence animation is cheap and paused by the browser
 * when the tab is hidden).
 */
export function LiquidGlassFX() {
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const SEL = '.liquid-glass, .glass, .reactor-panel'
    function onMove(e: PointerEvent) {
      const el = (e.target as HTMLElement | null)?.closest<HTMLElement>(SEL)
      if (!el) return
      const r = el.getBoundingClientRect()
      el.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`)
      el.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`)
    }
    function onLeave(e: PointerEvent) {
      const el = (e.target as HTMLElement | null)?.closest<HTMLElement>(SEL)
      if (!el) return
      el.style.setProperty('--mx', '50%')
      el.style.setProperty('--my', '-10%')
    }

    if (!reduce) {
      document.addEventListener('pointermove', onMove, { passive: true })
      document.addEventListener('pointerout', onLeave, { passive: true })
    }
    return () => {
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerout', onLeave)
    }
  }, [])

  return (
    <svg
      aria-hidden="true"
      width="0"
      height="0"
      focusable="false"
      className="pointer-events-none absolute h-0 w-0"
    >
      <filter
        id="liquid-glass"
        x="-30%"
        y="-30%"
        width="160%"
        height="160%"
        colorInterpolationFilters="sRGB"
      >
        <feTurbulence type="fractalNoise" baseFrequency="0.009 0.013" numOctaves={2} seed={9} result="noise">
          <animate
            attributeName="baseFrequency"
            dur="20s"
            repeatCount="indefinite"
            values="0.009 0.013; 0.014 0.010; 0.009 0.013"
            calcMode="spline"
            keySplines="0.4 0 0.6 1; 0.4 0 0.6 1"
            keyTimes="0;0.5;1"
          />
        </feTurbulence>
        <feGaussianBlur in="noise" stdDeviation="1.1" result="soft" />
        <feDisplacementMap in="SourceGraphic" in2="soft" scale="42" xChannelSelector="R" yChannelSelector="G" />
      </filter>

      {/* Static, gentler refraction used sitewide on panels + buttons. No
          per-frame turbulence recompute (that would be costly across dozens of
          backdrop-filtered surfaces); the drifting backdrop supplies the motion. */}
      <filter
        id="liquid-glass-soft"
        x="-20%"
        y="-20%"
        width="140%"
        height="140%"
        colorInterpolationFilters="sRGB"
      >
        <feTurbulence type="fractalNoise" baseFrequency="0.011 0.015" numOctaves={2} seed={4} result="n" />
        <feGaussianBlur in="n" stdDeviation="1" result="s" />
        <feDisplacementMap in="SourceGraphic" in2="s" scale="16" xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </svg>
  )
}
