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
        background: '#060B18',
        card: '#0C1322',
        surface: '#121C32',
        border: '#26375A',
        primary: '#4C8DFF',
        glow: '#7DB8FF',
        cyan: '#2DE0FA',
        violet: '#B896FF',
        emerald: '#3EE6A8',
        pink: '#FF78C4',
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
        glow: '0 0 0 1px rgba(125,184,255,0.26), 0 0 34px -6px rgba(76,141,255,0.6)',
        'glow-lg': '0 0 0 1px rgba(125,184,255,0.34), 0 0 64px -10px rgba(76,141,255,0.75)',
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
