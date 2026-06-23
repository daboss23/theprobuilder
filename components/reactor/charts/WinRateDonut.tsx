'use client'

import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'
import type { OutcomeSummary } from '@/lib/dashboard-data'
import { accentColor } from './chart-theme'

// Outcome win-rate donut: the feedback-loop instrument. Answers "are the concepts
// the reactor generates actually winning in market?" The centre shows the win
// rate across decided outcomes; the ring splits winners / losers / in-market.
export function WinRateDonut({ outcomes }: { outcomes: OutcomeSummary }) {
  const data = [
    { name: 'Winners', value: outcomes.winners, color: accentColor('emerald') },
    { name: 'In market', value: outcomes.pending, color: accentColor('amber') },
    { name: 'Retired', value: outcomes.losers, color: accentColor('pink') },
  ].filter((d) => d.value > 0)

  const hasData = data.length > 0

  return (
    <div className="flex items-center gap-5">
      <div className="relative h-[140px] w-[140px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={hasData ? data : [{ name: 'none', value: 1, color: 'rgba(255,255,255,0.08)' }]}
              dataKey="value"
              innerRadius={48}
              outerRadius={66}
              startAngle={90}
              endAngle={-270}
              stroke="none"
              paddingAngle={hasData ? 3 : 0}
            >
              {(hasData ? data : [{ color: 'rgba(255,255,255,0.08)' }]).map((d, i) => (
                <Cell key={i} fill={d.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-2xl font-bold tabular text-white">
            {outcomes.winRate}%
          </span>
          <span className="text-[10px] uppercase tracking-[0.14em] text-white/40">Win rate</span>
        </div>
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        {data.map((d) => (
          <div key={d.name} className="flex items-center gap-2 text-xs">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: d.color }} />
            <span className="text-white/55">{d.name}</span>
            <span className="ml-auto font-display font-semibold tabular text-white">{d.value}</span>
          </div>
        ))}
        {!hasData && <p className="text-xs text-white/40">No outcomes logged yet.</p>}
      </div>
    </div>
  )
}
