'use client'

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { GrowthPoint } from '@/lib/dashboard-data'
import {
  accentColor,
  CHART_AXIS,
  CHART_GRID,
  CHART_TOOLTIP_BG,
  CHART_TOOLTIP_BORDER,
} from './chart-theme'

// Small glowing marker rendered at every datapoint along the growth line.
function GlowDot({ cx, cy }: { cx?: number; cy?: number }) {
  if (cx == null || cy == null) return null
  return <circle cx={cx} cy={cy} r={3} className="chart-dot" />
}

// Intelligence-base growth: cumulative stored assets over time. Answers the core
// system thesis — "is the Vault actually compounding?" The filled area is the
// running total; the tooltip surfaces how many assets landed that week.
export function GrowthAreaChart({ data }: { data: GrowthPoint[] }) {
  return (
    <div className="chart-field h-[260px] w-full p-1">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 12, right: 10, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id="growthFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={accentColor('cyan', 0.5)} />
              <stop offset="55%" stopColor={accentColor('blue', 0.16)} />
              <stop offset="100%" stopColor={accentColor('blue', 0)} />
            </linearGradient>
            <linearGradient id="growthStroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={accentColor('violet')} />
              <stop offset="50%" stopColor={accentColor('cyan')} />
              <stop offset="100%" stopColor={accentColor('blue')} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={CHART_GRID} strokeDasharray="3 5" vertical />
          <XAxis
            dataKey="label"
            tick={{ fill: CHART_AXIS, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            minTickGap={24}
          />
          <YAxis
            tick={{ fill: CHART_AXIS, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={48}
            allowDecimals={false}
          />
          <Tooltip
            cursor={{ stroke: accentColor('cyan', 0.4), strokeWidth: 1, strokeDasharray: '4 4' }}
            contentStyle={{
              background: CHART_TOOLTIP_BG,
              border: `1px solid ${CHART_TOOLTIP_BORDER}`,
              borderRadius: 12,
              fontSize: 12,
              color: '#fff',
              boxShadow: '0 18px 40px -20px rgba(0,0,0,0.9), 0 0 24px -12px rgba(34,211,238,0.6)',
            }}
            labelStyle={{ color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}
            formatter={(value, name) => [
              Number(value).toLocaleString(),
              name === 'cumulative' ? 'Total assets' : 'Added',
            ]}
          />
          <Area
            type="monotone"
            dataKey="cumulative"
            stroke="url(#growthStroke)"
            strokeWidth={2.6}
            fill="url(#growthFill)"
            className="growth-line"
            dot={<GlowDot />}
            activeDot={{ r: 5, fill: accentColor('cyan'), stroke: '#04060c', strokeWidth: 2 }}
            isAnimationActive
            animationDuration={1400}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
