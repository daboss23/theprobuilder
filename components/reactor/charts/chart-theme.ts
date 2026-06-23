// Shared colour tokens for recharts modules so charts read from the exact same
// neon accent channels as the rest of the command center (globals.css .acc-*).
import type { DataAccent } from '@/lib/reactor-data'

export const ACCENT_RGB: Record<DataAccent, string> = {
  blue: '79 141 255',
  cyan: '34 211 238',
  violet: '167 139 250',
  emerald: '52 211 153',
  pink: '244 114 182',
  amber: '251 191 36',
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
