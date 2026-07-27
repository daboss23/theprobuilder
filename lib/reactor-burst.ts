/**
 * Reactor ignition burst — the particle/electric explosion that erupts from the
 * Fire Reactor button on click. Defined once here so every ignition CTA (topbar,
 * modal, quick launch, canvas, studio) can detonate the same effect with one
 * call, exactly like `.fire-btn` is the one button.
 *
 * It runs imperatively against `document.body` rather than through React state
 * because the launch modal unmounts the instant it fires — a component-local
 * effect would be torn down before it could play. The nodes append to the body,
 * animate via the `.reactor-burst*` classes in `globals.css`, and remove
 * themselves once the longest animation has finished.
 *
 * The only inline style set here is per-particle geometry (flight angle,
 * distance, timing) expressed as CSS custom properties — values a static
 * Tailwind/CSS class cannot know because they are randomised per shard. All
 * appearance lives in the stylesheet.
 */

const PARTICLE_COUNT = 26
const BOLT_COUNT = 9
const RING_COUNT = 3
const LIFETIME_MS = 1100

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

/**
 * Detonate an ignition burst centred on a screen coordinate (viewport pixels).
 * Safe to call with no window (SSR) — it simply no-ops.
 */
export function fireReactorBurst(x: number, y: number): void {
  if (typeof document === 'undefined') return

  const root = document.createElement('div')
  root.className = 'reactor-burst'
  root.style.left = `${x}px`
  root.style.top = `${y}px`

  // Core flash + expanding shockwave rings — the "frequency" pulse.
  const flash = document.createElement('span')
  flash.className = 'reactor-burst__flash'
  root.appendChild(flash)

  for (let i = 0; i < RING_COUNT; i++) {
    const ring = document.createElement('span')
    ring.className = 'reactor-burst__ring'
    ring.style.setProperty('--delay', `${i * 90}ms`)
    root.appendChild(ring)
  }

  // Electric bolts — thin arcs that shoot straight out and snap away.
  for (let i = 0; i < BOLT_COUNT; i++) {
    const bolt = document.createElement('span')
    bolt.className = 'reactor-burst__bolt'
    bolt.style.setProperty('--angle', `${(360 / BOLT_COUNT) * i + rand(-12, 12)}deg`)
    bolt.style.setProperty('--dist', `${rand(70, 130)}px`)
    bolt.style.setProperty('--delay', `${rand(0, 70)}ms`)
    root.appendChild(bolt)
  }

  // Particle shards — cyan/violet sparks that jump out and fall away.
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const p = document.createElement('span')
    p.className = 'reactor-burst__particle'
    p.style.setProperty('--angle', `${rand(0, 360)}deg`)
    p.style.setProperty('--dist', `${rand(60, 160)}px`)
    p.style.setProperty('--size', `${rand(3, 7)}px`)
    p.style.setProperty('--delay', `${rand(0, 90)}ms`)
    p.style.setProperty('--hue', Math.random() > 0.5 ? '186' : '265')
    root.appendChild(p)
  }

  document.body.appendChild(root)
  window.setTimeout(() => root.remove(), LIFETIME_MS)
}

/**
 * Convenience wrapper for a click handler: detonate from the clicked element's
 * centre. Use when a button's ignition should visibly explode out of it.
 */
export function burstFromEvent(e: { currentTarget: Element }): void {
  const rect = e.currentTarget.getBoundingClientRect()
  fireReactorBurst(rect.left + rect.width / 2, rect.top + rect.height / 2)
}
