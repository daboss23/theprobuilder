diff --git a/app/(platform)/page.tsx b/app/(platform)/page.tsx
index 48038951010ed1da358ea7490aa47eadbd18d4c4..1ac32a54dacb00e08586b9b93fb98a04564e33fa 100644
--- a/app/(platform)/page.tsx
+++ b/app/(platform)/page.tsx
@@ -1,216 +1,219 @@
 import {
   Activity,
   Flame,
   Target,
   Atom,
   ArrowUpRight,
 } from 'lucide-react'
 import {
   KpiCard,
   Panel,
   PanelHeader,
   PageHeader,
   ProgressBar,
   Pill,
   TrendBadge,
   type KpiTint,
 } from '@/components/reactor/ui'
 
-// Pastel rotation across the 8 KPI cards, echoing the reference dashboard.
+// Controlled telemetry tints distinguish KPI channels without breaking the console surface.
 const kpiTintCycle: KpiTint[] = ['blue', 'green', 'purple', 'teal', 'teal', 'rose', 'amber', 'blue']
 import {
   reactorKpis,
   winningAngles,
   creativeHeatmap,
   heatmapMonths,
   recommendations,
   reactorStatus,
 } from '@/lib/reactor-data'
 
 function heatColor(v: number): string {
   if (v >= 85) return 'rgba(0,212,255,0.95)'
   if (v >= 70) return 'rgba(46,168,255,0.8)'
   if (v >= 55) return 'rgba(10,132,255,0.6)'
   if (v >= 40) return 'rgba(10,132,255,0.35)'
   return 'rgba(28,36,51,0.7)'
 }
 
 export default function ReactorDashboard() {
   return (
     <>
       <div className="flex flex-wrap items-end justify-between gap-4">
         <PageHeader
           title="Reactor Dashboard"
           subtitle="Mission control for The Professional Builder's creative intelligence. What should TPB create next, based on everything that has already worked?"
           tagline="Engineered For Performance."
         />
         <div className="flex items-center gap-2">
           <Pill tone="success">
             <span className="h-1.5 w-1.5 rounded-full bg-success" /> Live
           </Pill>
           <Pill tone="primary">
             <Activity size={12} /> 2,847 assets synced
           </Pill>
         </div>
       </div>
 
+      <div className="dashboard-console">
       {/* KPI grid */}
-      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
+      <section className="dashboard-kpi-grid grid grid-cols-2 gap-3 md:grid-cols-4">
         {reactorKpis.map((k, i) => (
           <KpiCard key={k.label} {...k} tint={kpiTintCycle[i % kpiTintCycle.length]} />
         ))}
       </section>
 
-      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
+      <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
         {/* Top winning angles */}
         <Panel className="xl:col-span-2">
           <PanelHeader
             icon={<Flame size={16} />}
             title="Top Winning Angles"
             subtitle="Ranked by win index across all campaigns"
           />
           <div className="space-y-3 p-5">
             {winningAngles.map((a) => (
-              <div key={a.name} className="flex items-center gap-4">
+              <div key={a.name} className="telemetry-row flex items-center gap-4">
                 <div className="w-36 shrink-0">
                   <p className="text-sm font-medium text-white">{a.name}</p>
                   <p className="text-[11px] text-white/35">{a.campaigns} campaigns</p>
                 </div>
                 <div className="flex-1">
                   <ProgressBar value={a.score} />
                 </div>
                 <span className="w-10 text-right font-display text-sm font-bold tabular text-white">
                   {a.score}
                 </span>
                 <TrendBadge trend={a.trend} value={a.trend === 'flat' ? '—' : a.trend === 'up' ? '▲' : '▼'} />
               </div>
             ))}
           </div>
         </Panel>
 
         {/* Campaign reactor status */}
         <Panel>
           <PanelHeader
             icon={<Atom size={16} className="animate-pulse-glow" />}
             title="Campaign Reactor Status"
             subtitle="Live pipeline telemetry"
           />
           <div className="space-y-4 p-5">
             {reactorStatus.map((s) => (
-              <div key={s.label}>
+              <div key={s.label} className="telemetry-row">
                 <div className="mb-1.5 flex items-center justify-between">
                   <span className="text-xs text-white/55">{s.label}</span>
                   <span className="font-display text-sm font-bold tabular text-white">
                     {s.value.toLocaleString()}
                     <span className="text-white/30">/{s.total.toLocaleString()}</span>
                   </span>
                 </div>
                 <ProgressBar value={s.value} max={s.total} />
               </div>
             ))}
           </div>
         </Panel>
       </div>
 
       {/* Heatmap */}
       <Panel>
         <PanelHeader
           icon={<Activity size={16} />}
           title="Creative Intelligence Heatmap"
           subtitle="Signal intensity by dimension over the last 6 months"
           accessory={
             <div className="hidden items-center gap-2 text-[11px] text-white/40 sm:flex">
               <span>Low</span>
               <span className="h-2 w-24 rounded-full bg-gradient-to-r from-[#1c2433] via-primary to-cyan" />
               <span>High</span>
             </div>
           }
         />
         <div className="overflow-x-auto p-5">
           <table className="w-full min-w-[560px] border-separate border-spacing-1.5">
             <thead>
               <tr>
                 <th className="w-40" />
                 {heatmapMonths.map((m) => (
                   <th
                     key={m}
                     className="px-2 text-center text-[11px] font-medium uppercase tracking-wider text-white/35"
                   >
                     {m}
                   </th>
                 ))}
               </tr>
             </thead>
             <tbody>
               {creativeHeatmap.map((row) => (
                 <tr key={row.dimension}>
                   <td className="pr-3 text-sm font-medium text-white/70">{row.dimension}</td>
                   {row.cells.map((c, i) => (
                     <td key={i}>
                       <div
-                        className="grid h-9 place-items-center rounded-md text-[11px] font-semibold tabular text-white/90 transition-transform hover:scale-105"
+                        className="heat-cell grid h-9 place-items-center rounded-md text-[11px] font-semibold tabular text-white/90 transition-transform hover:scale-105"
                         style={{
                           background: heatColor(c),
                           boxShadow: c >= 70 ? '0 0 14px -2px rgba(46,168,255,0.6)' : 'none',
                         }}
                       >
                         {c}
                       </div>
                     </td>
                   ))}
                 </tr>
               ))}
             </tbody>
           </table>
         </div>
       </Panel>
 
       {/* Strategic recommendations */}
       <Panel>
         <PanelHeader
           icon={<Target size={16} />}
           title="Strategic Recommendations"
           subtitle="AI-generated next moves for TPB"
           accessory={<Pill tone="primary">24 ready</Pill>}
         />
         <div className="grid grid-cols-1 gap-4 p-5 lg:grid-cols-3">
           {recommendations.map((r) => (
             <div
               key={r.campaign}
-              className="glass-hover rounded-xl border border-border bg-surface/40 p-4"
+              className="recommendation-card glass-hover rounded-xl border border-border bg-surface/40 p-4"
             >
               <div className="mb-2 flex items-center justify-between">
                 <Pill tone={r.priority === 'Critical' ? 'danger' : 'warning'}>{r.priority}</Pill>
                 <span className="font-display text-sm font-bold tabular text-glow">
                   {r.confidence}%
                 </span>
               </div>
               <h3 className="font-display text-base font-semibold text-white">{r.campaign}</h3>
               <p className="mt-1.5 text-xs leading-relaxed text-white/50">{r.reason}</p>
               <div className="mt-3 rounded-lg border border-border bg-background/40 p-3">
                 <p className="text-[10px] font-medium uppercase tracking-wider text-white/35">
                   Suggested Hook
                 </p>
                 <p className="mt-1 text-sm italic text-white/80">“{r.suggestedHook}”</p>
               </div>
               <div className="mt-3 flex flex-wrap gap-1.5">
                 {r.assetsNeeded.map((a) => (
                   <Pill key={a}>{a}</Pill>
                 ))}
               </div>
             </div>
           ))}
         </div>
       </Panel>
 
+      </div>
+
       <div className="flex justify-center pb-2">
         <a
           href="/campaign-reactor"
           className="inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-5 py-2.5 text-sm font-medium text-glow transition-all hover:bg-primary/20 hover:shadow-glow"
         >
           Launch Campaign Reactor <ArrowUpRight size={16} />
         </a>
       </div>
     </>
   )
 }
