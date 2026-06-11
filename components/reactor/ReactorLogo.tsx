import { cn } from '@/lib/utils'

/* ----------------------------------------------------------------------------
   ReactorLogo — the living TPB Creative Reactor mark.
   An inline-SVG reactor core (segmented housing ring, orbiting electrons,
   breathing plasma core) that pulses on a slow 3.6s loop via globals.css,
   beside the stacked TPB / CREATIVE / REACTOR wordmark.
---------------------------------------------------------------------------- */

function ReactorMark({ size }: { size: number }) {
  return (
    <span className="reactor-mark grid shrink-0 place-items-center">
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        aria-hidden="true"
        role="presentation"
      >
        {/* Segmented housing ring */}
        <circle
          cx="24"
          cy="24"
          r="21.5"
          stroke="#46618a"
          strokeWidth="2.4"
          strokeDasharray="15 6"
          strokeLinecap="round"
          opacity="0.85"
        />
        <circle cx="24" cy="24" r="17.5" stroke="#27374f" strokeWidth="1" opacity="0.9" />

        {/* Orbiting electron shells (slow rotation) */}
        <g className="reactor-orbits">
          <ellipse
            cx="24"
            cy="24"
            rx="15"
            ry="6.2"
            stroke="#38bdf8"
            strokeWidth="1.1"
            opacity="0.85"
          />
          <ellipse
            cx="24"
            cy="24"
            rx="15"
            ry="6.2"
            stroke="#60a5fa"
            strokeWidth="1.1"
            opacity="0.8"
            transform="rotate(60 24 24)"
          />
          <ellipse
            cx="24"
            cy="24"
            rx="15"
            ry="6.2"
            stroke="#818cf8"
            strokeWidth="1.1"
            opacity="0.7"
            transform="rotate(120 24 24)"
          />
          <circle cx="39" cy="24" r="1.6" fill="#7dd3fc" />
          <circle cx="16.5" cy="36.9" r="1.4" fill="#93c5fd" />
          <circle cx="16.5" cy="11.1" r="1.4" fill="#a5b4fc" />
        </g>

        {/* Breathing plasma core */}
        <circle className="reactor-halo" cx="24" cy="24" r="9" fill="#22d3ee" opacity="0.16" />
        <circle className="reactor-halo" cx="24" cy="24" r="6" fill="#38bdf8" opacity="0.3" />
        <circle className="reactor-core" cx="24" cy="24" r="3.4" fill="#dff5ff" />
      </svg>
    </span>
  )
}

export function ReactorLogo({
  size = 'md',
  className,
}: {
  size?: 'sm' | 'md'
  className?: string
}) {
  const mark = size === 'md' ? 46 : 32
  return (
    <span className={cn('flex items-center', size === 'md' ? 'gap-3' : 'gap-2', className)}>
      <ReactorMark size={mark} />
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            'font-display font-bold tracking-[0.08em] text-white',
            size === 'md' ? 'text-xl' : 'text-base',
          )}
        >
          TPB
        </span>
        <span
          className={cn(
            'mt-1 font-display font-medium uppercase text-white/75',
            size === 'md' ? 'text-[11px] tracking-[0.26em]' : 'text-[8px] tracking-[0.22em]',
          )}
        >
          Creative
        </span>
        <span
          className={cn(
            'mt-0.5 font-display font-medium uppercase text-white/75',
            size === 'md' ? 'text-[11px] tracking-[0.26em]' : 'text-[8px] tracking-[0.22em]',
          )}
        >
          Reactor
        </span>
      </span>
    </span>
  )
}
