'use client'

import { useRouter } from 'next/navigation'

// Flame size pattern across the 8 flame divs, kept in render order so the
// nth-child positioning in globals.css spreads them edge-to-edge.
const FLAME_SIZES = ['f-md', 'f-lg', 'f-sm', 'f-lg', 'f-md', 'f-lg', 'f-sm', 'f-md'] as const

interface FireReactorButtonProps {
  onClick?: () => void
  href?: string
  size?: 'default' | 'lg'
}

// High-energy launch CTA: animated flames + rising embers behind a glowing
// gradient button (pure CSS/SVG — see the FIRE REACTOR block in globals.css).
// Routes to the Campaign Reactor by default.
export default function FireReactorButton({
  onClick,
  href = '/campaign-reactor',
  size = 'lg',
}: FireReactorButtonProps) {
  const router = useRouter()

  const handleClick = () => {
    if (onClick) onClick()
    else router.push(href)
  }

  return (
    <div className={`fire-reactor-wrap${size === 'default' ? ' is-compact' : ''}`}>
      <div className="fire-reactor-glow" aria-hidden="true" />

      <div className="flames" aria-hidden="true">
        {FLAME_SIZES.map((flameSize, i) => (
          <div key={`flame-${i}`} className={`flame ${flameSize}`}>
            <div className="core" />
          </div>
        ))}
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={`ember-${i}`} className="ember" />
        ))}
      </div>

      <button type="button" className="fire-reactor-btn" onClick={handleClick}>
        <svg className="reactor-icon" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="coreGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fffbe6" />
              <stop offset="35%" stopColor="#ffd23f" />
              <stop offset="70%" stopColor="#ff7a00" />
              <stop offset="100%" stopColor="#b33b00" />
            </radialGradient>
          </defs>

          <circle cx="50" cy="50" r="47" fill="#1a0500" opacity="0.35" />
          <circle cx="50" cy="50" r="47" fill="none" stroke="#2a0a00" strokeWidth="2" />

          <g stroke="#ffb347" strokeWidth="2.4" strokeLinecap="round" opacity="0.9">
            <line x1="50" y1="50" x2="50" y2="4" />
            <line x1="50" y1="50" x2="50" y2="96" />
            <line x1="50" y1="50" x2="4" y2="50" />
            <line x1="50" y1="50" x2="96" y2="50" />
            <line x1="50" y1="50" x2="18" y2="18" />
            <line x1="50" y1="50" x2="82" y2="18" />
            <line x1="50" y1="50" x2="18" y2="82" />
            <line x1="50" y1="50" x2="82" y2="82" />
          </g>
          <g stroke="#ff9100" strokeWidth="1.4" strokeLinecap="round" opacity="0.75">
            <line x1="50" y1="50" x2="50" y2="14" />
            <line x1="50" y1="50" x2="50" y2="86" />
            <line x1="50" y1="50" x2="14" y2="50" />
            <line x1="50" y1="50" x2="86" y2="50" />
          </g>

          <circle cx="50" cy="50" r="20" fill="url(#coreGrad)" />
          <circle cx="50" cy="50" r="20" fill="none" stroke="#fff8e0" strokeWidth="1" opacity="0.6" />
        </svg>
        Fire Reactor
      </button>
    </div>
  )
}
