// Shared colour tokens for recharts modules so charts read from the exact same
// neon accent channels as the rest of the command center (globals.css .acc-*).
import type { DataAccent } from '@/lib/reactor-data'

export const ACCENT_RGB: Record<DataAccent, string> = {
  blue: '96 160 255',
  cyan: '45 224 250',
  violet: '184 150 255',
  emerald: '62 230 168',
  pink: '255 120 196',
  amber: '255 200 56',
}

export function accentColor(accent: DataAccent, alpha = 1): string {
  return `rgb(${ACCENT_RGB[accent]} / ${alpha})`
}

// Recharts needs concrete colour strings on its presentation props (fill/stroke);
// these are SVG attributes, not DOM inline styles, so they stay within the
// "Tailwind for layout, tokens for colour" rule.
export const CHART_GRID = 'rgba(255,255,255,0.06)'
export const CHART_AXIS = 'rgba(255,255,255,0.35)'
export const CHART_TOOLTIP_BG = 'rgba(6,14,26,0.94)'
export const CHART_TOOLTIP_BORDER = 'rgba(255,255,255,0.12)'
