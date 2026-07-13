'use client'

import { useEffect, useRef } from 'react'

/**
 * Liquid-glass environment — the living neon field the glass refracts.
 *
 * A slow canvas of drifting neon orbs (cyan → violet → magenta) sits behind the
 * whole app, blurred and additively blended, with an engineering grid + vignette
 * layered on top. Because the glass surfaces bend this backdrop through the
 * #liquid-glass displacement filter, the *moving* field is what makes the static
 * refraction read as living liquid — so the filter itself can stay static (cheap)
 * while the app still feels alive. Pauses when the tab is hidden; renders a
 * single static frame under prefers-reduced-motion.
 */
export function LiquidGlassBackdrop() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let w = 0
    let h = 0
    let dpr = 1
    function size() {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = canvas!.clientWidth
      h = canvas!.clientHeight
      canvas!.width = Math.max(1, Math.floor(w * dpr))
      canvas!.height = Math.max(1, Math.floor(h * dpr))
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    size()
    window.addEventListener('resize', size)

    const palette: [number, number, number][] = [
      [58, 232, 255], // cyan
      [155, 107, 255], // violet
      [255, 92, 200], // magenta
      [80, 140, 255], // blue
      [52, 211, 153], // emerald (rare, keeps it from feeling monochrome)
    ]
    const orbs = Array.from({ length: 7 }, (_, i) => ({
      r: 220 + Math.random() * 320,
      col: palette[i % palette.length],
      ax: Math.random() * Math.PI * 2,
      ay: Math.random() * Math.PI * 2,
      sx: 0.05 + Math.random() * 0.09,
      sy: 0.05 + Math.random() * 0.09,
      spanX: 0.36 + Math.random() * 0.14,
      spanY: 0.34 + Math.random() * 0.14,
    }))

    function draw(t: number) {
      ctx!.clearRect(0, 0, w, h)
      ctx!.globalCompositeOperation = 'lighter'
      for (const o of orbs) {
        const x = (0.5 + o.spanX * Math.sin(o.ax + t * o.sx)) * w
        const y = (0.5 + o.spanY * Math.cos(o.ay + t * o.sy)) * h
        const g = ctx!.createRadialGradient(x, y, 0, x, y, o.r)
        const [r, gr, b] = o.col
        g.addColorStop(0, `rgba(${r},${gr},${b},0.42)`)
        g.addColorStop(1, `rgba(${r},${gr},${b},0)`)
        ctx!.fillStyle = g
        ctx!.beginPath()
        ctx!.arc(x, y, o.r, 0, Math.PI * 2)
        ctx!.fill()
      }
    }

    let raf = 0
    if (reduce) {
      draw(6)
    } else {
      let start: number | null = null
      const loop = (ts: number) => {
        if (start === null) start = ts
        if (!document.hidden) draw((ts - start) / 1000)
        raf = requestAnimationFrame(loop)
      }
      raf = requestAnimationFrame(loop)
    }

    return () => {
      window.removeEventListener('resize', size)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div className="lg-backdrop" aria-hidden="true">
      <canvas ref={canvasRef} className="lg-backdrop__orbs" />
      <div className="lg-backdrop__grid" />
      <div className="lg-backdrop__vignette" />
    </div>
  )
}
