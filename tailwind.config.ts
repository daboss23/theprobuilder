import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Liquid Glass palette — see DESIGN.md. Kept as the same token names so
        // every existing `bg-surface` / `text-glow` / `from-primary` utility
        // across the app shifts to the neon aurora ramp in one move.
        background: '#080B1A',
        card: '#0E1428',
        surface: '#141B33',
        border: '#2A3656',
        primary: '#4D8DFF',
        glow: '#38E8FF',
        cyan: '#38E8FF',
        azure: '#4D8DFF',
        violet: '#A882FF',
        magenta: '#FF6AD6',
        emerald: '#2FE6B0',
        pink: '#FF6AD6',
        success: '#2FE6B0',
        warning: '#FFC24B',
        danger: '#FF6A8B',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-space-grotesk)', 'var(--font-inter)', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      borderRadius: {
        module: '1.25rem',
        panel: '1.5rem',
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(56,232,255,0.18), 0 0 26px -6px rgba(77,141,255,0.5)',
        'glow-lg': '0 0 0 1px rgba(56,232,255,0.25), 0 0 52px -10px rgba(168,130,255,0.6)',
        panel: '0 1px 0 0 rgba(255,255,255,0.14) inset, 0 24px 60px -30px rgba(2,4,14,0.9)',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: '0.45' },
          '50%': { opacity: '1' },
        },
        'core-breathe': {
          '0%, 100%': { opacity: '0.72', transform: 'scale(0.94)' },
          '50%': { opacity: '1', transform: 'scale(1.06)' },
        },
        'orbit-spin': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'pulse-glow': 'pulse-glow 2.6s ease-in-out infinite',
        'core-breathe': 'core-breathe 3.6s ease-in-out infinite',
        'orbit-spin': 'orbit-spin 26s linear infinite',
        'fade-up': 'fade-up 0.4s ease-out both',
      },
    },
  },
  plugins: [],
}
export default config
