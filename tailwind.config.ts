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
        background: '#04060C',
        card: '#0A0F1B',
        surface: '#0E1626',
        border: '#1B2840',
        primary: '#3B82F6',
        glow: '#5EA8FF',
        cyan: '#22D3EE',
        violet: '#A78BFA',
        emerald: '#34D399',
        pink: '#F472B6',
        success: '#34D399',
        warning: '#FBBF24',
        danger: '#FB7185',
        // Liquid Glass reference palette (see DESIGN.md §2)
        liquid: {
          bg: '#050914',
          'bg-2': '#070B16',
          'bg-3': '#0B1020',
          cyan: '#22E7FF',
          blue: '#4DA3FF',
          violet: '#8B5CF6',
          magenta: '#FF4FD8',
          teal: '#2FFFD2',
          flame: '#FF4B3E',
          ember: '#FF6A3D',
        },
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
        glow: '0 0 0 1px rgba(94,168,255,0.18), 0 0 26px -6px rgba(59,130,246,0.45)',
        'glow-lg': '0 0 0 1px rgba(94,168,255,0.25), 0 0 52px -10px rgba(59,130,246,0.6)',
        panel: '0 1px 0 0 rgba(255,255,255,0.05) inset, 0 20px 50px -28px rgba(0,0,0,0.9)',
        // Liquid glass floating card — coloured halo + deep float shadow
        liquid:
          'inset 0 1px 0 rgba(200,235,255,0.16), inset 0 0 0 1px rgba(255,255,255,0.03), 0 2px 4px rgba(0,0,0,0.5), 0 0 48px -20px rgba(34,231,255,0.45), 0 34px 62px -30px rgba(0,0,0,0.95)',
        'liquid-hover':
          'inset 0 1px 0 rgba(210,240,255,0.22), inset 0 0 0 1px rgba(255,255,255,0.05), 0 2px 4px rgba(0,0,0,0.5), 0 0 68px -14px rgba(34,231,255,0.6), 0 46px 76px -30px rgba(0,0,0,0.98)',
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-130%) skewX(-14deg)' },
          '55%, 100%': { transform: 'translateX(340%) skewX(-14deg)' },
        },
        'float-soft': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        breathe: {
          '0%, 100%': { opacity: '0.55' },
          '50%': { opacity: '1' },
        },
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
        shimmer: 'shimmer 3s ease-in-out infinite',
        'float-soft': 'float-soft 6s ease-in-out infinite',
        breathe: 'breathe 2.8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
export default config
