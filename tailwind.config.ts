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
