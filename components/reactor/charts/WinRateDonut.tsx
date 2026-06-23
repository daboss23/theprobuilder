'use client'

import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'
import type { OutcomeSummary } from '@/lib/dashboard-data'
import { accentColor } from './chart-theme'

// Outcome win-rate donut: the feedback-loop instrument. Answers "are the concepts
// the reactor generates actually winning in market?" The centre shows the win
// rate across decided outcomes; the ring splits winners / in-market / retired.
export function WinRateDonut({ outcomes }: { outcomes: OutcomeSummary }) {
  const data = [
    { name: 'Winners', value: outcomes.winners, color: accentColor('emerald') },
    { name: 'In market', value: outcomes.pending, color: accentColor('amber') },
    { name: 'Retired', value: outcomes.losers, color: accentColor('pink') },
  ].filter((d) => d.value > 0)

  const hasData = data.length > 0

  return (
    <div className="flex items-center gap-5">
      <div className="donut-wrap donut-glow relative h-[148px] w-[148px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            {/* Recessed track ring behind the data */}
            <Pie
              data={[{ value: 1 }]}
              dataKey="value"
              innerRadius={50}
              outerRadius={68}
              startAngle={90}
              endAngle={-270}
              stroke="none"
              isAnimationActive={false}
            >
              <Cell fill="rgba(255,255,255,0.05)" />
            </Pie>
            <Pie
              data={hasData ? data : [{ name: 'none', value: 1, color: 'rgba(255,255,255,0.06)' }]}
              dataKey="value"
              innerRadius={50}
              outerRadius={68}
              startAngle={90}
              endAngle={-270}
              stroke="none"
              paddingAngle={hasData ? 3 : 0}
              cornerRadius={6}
              isAnimationActive
              animationDuration={1100}
            >
              {(hasData ? data : [{ color: 'rgba(255,255,255,0.06)' }]).map((d, i) => (
                <Cell key={i} fill={d.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-[1.7rem] font-bold leading-none tabular text-white text-glow">
            {outcomes.winRate}%
          </span>
          <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald/80">
            Win Rate
          </span>
        </div>
      </div>
      <div className="min-w-0 flex-1 space-y-1.5">
        {data.map((d) => (
          <div key={d.name} className="donut-stat text-xs">
            <span className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: d.color, boxShadow: `0 0 8px ${d.color}` }}
              />
              <span className="text-white/60">{d.name}</span>
            </span>
            <span className="font-display text-sm font-bold tabular text-white">{d.value}</span>
          </div>
        ))}
        {!hasData && <p className="text-xs text-white/40">No outcomes logged yet.</p>}
      </div>
    </div>
  )
}
