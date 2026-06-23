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

// Intelligence-base growth: cumulative stored assets over time. Answers the core
// system thesis — "is the Vault actually compounding?" The filled area is the
// running total; the tooltip surfaces how many assets landed that week.
export function GrowthAreaChart({ data }: { data: GrowthPoint[] }) {
  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id="growthFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={accentColor('cyan', 0.45)} />
              <stop offset="100%" stopColor={accentColor('blue', 0)} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={CHART_GRID} vertical={false} />
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
            cursor={{ stroke: accentColor('cyan', 0.4), strokeWidth: 1 }}
            contentStyle={{
              background: CHART_TOOLTIP_BG,
              border: `1px solid ${CHART_TOOLTIP_BORDER}`,
              borderRadius: 12,
              fontSize: 12,
              color: '#fff',
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
            stroke={accentColor('cyan')}
            strokeWidth={2}
            fill="url(#growthFill)"
            dot={false}
            activeDot={{ r: 4, fill: accentColor('cyan'), stroke: '#04060c', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
