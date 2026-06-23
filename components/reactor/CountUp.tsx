'use client'

import { useEffect, useRef, useState } from 'react'

// Animated numeral for KPI instruments. Renders the final value on the server so
// the dashboard reads correctly with JS disabled, then eases up to it on mount —
// a subtle "system coming online" beat. Honours prefers-reduced-motion.
export function CountUp({
  value,
  duration = 900,
  className,
}: {
  value: number
  duration?: number
  className?: string
}) {
  const [display, setDisplay] = useState(value)
  const ref = useRef<HTMLSpanElement>(null)
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true

    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduce || value <= 0) {
      setDisplay(value)
      return
    }

    // Only animate once the card scrolls into view so off-screen numbers don't
    // burn the run before the user ever sees them.
    const node = ref.current
    const run = () => {
      const start = performance.now()
      const from = 0
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration)
        // easeOutCubic
        const eased = 1 - Math.pow(1 - t, 3)
        setDisplay(Math.round(from + (value - from) * eased))
        if (t < 1) requestAnimationFrame(tick)
        else setDisplay(value)
      }
      setDisplay(0)
      requestAnimationFrame(tick)
    }

    if (!node || typeof IntersectionObserver === 'undefined') {
      run()
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          run()
          io.disconnect()
        }
      },
      { threshold: 0.3 },
    )
    io.observe(node)
    return () => io.disconnect()
  }, [value, duration])

  return (
    <span ref={ref} className={className}>
      {display.toLocaleString()}
    </span>
  )
}
