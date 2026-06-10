diff --git a/components/reactor/Sidebar.tsx b/components/reactor/Sidebar.tsx
index e15a6d1e2052caa85485fb72e329080a18a74898..7535d8f89209cb17397ca21f409476432711f2d7 100644
--- a/components/reactor/Sidebar.tsx
+++ b/components/reactor/Sidebar.tsx
@@ -1,71 +1,73 @@
 'use client'
 
 import Link from 'next/link'
 import Image from 'next/image'
 import { usePathname } from 'next/navigation'
 import { navItems } from '@/lib/nav'
 import { cn } from '@/lib/utils'
 
 export function Sidebar() {
   const pathname = usePathname()
 
   return (
-    <aside className="hidden lg:flex w-[268px] shrink-0 flex-col border-r border-border bg-card/60 backdrop-blur-xl">
-      <div className="px-5 py-6 border-b border-border">
+    <aside className="reactor-sidebar hidden w-[268px] shrink-0 flex-col lg:flex">
+      <div className="reactor-brand px-5 py-5">
         <Link href="/" className="block">
           <Image
             src="/TPG-Reactor-Logo.png"
             alt="TPB Creative Reactor"
             width={1619}
             height={971}
             priority
-            className="w-full h-auto"
+            className="reactor-logo h-auto w-full"
           />
         </Link>
       </div>
 
-      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
+      <nav className="reactor-nav flex-1 space-y-1 overflow-y-auto px-3 py-4">
         {navItems.map((item) => {
           const active = pathname === item.href
           const Icon = item.icon
           return (
             <Link
               key={item.href}
               href={item.href}
               className={cn(
-                'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all',
-                active
-                  ? 'bg-primary/15 text-white shadow-[inset_0_0_0_1px_rgba(46,168,255,0.35)]'
-                  : 'text-white/55 hover:text-white hover:bg-white/[0.03]',
+                'reactor-nav-item group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all',
+                active ? 'is-active text-white' : 'text-white/55 hover:text-white',
               )}
             >
               {active && (
                 <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-full bg-glow shadow-[0_0_12px_2px_rgba(46,168,255,0.7)]" />
               )}
               <Icon
                 size={17}
                 className={cn(active ? 'text-glow' : 'text-white/40 group-hover:text-glow/80')}
               />
               <span className="flex-1 truncate font-medium">{item.label}</span>
               {item.system && (
                 <span className="font-mono text-[10px] tracking-widest text-white/25">
                   {item.system}
                 </span>
               )}
             </Link>
           )
         })}
       </nav>
 
-      <div className="px-5 py-4 border-t border-border">
-        <div className="flex items-center gap-2">
-          <span className="h-2 w-2 rounded-full bg-success animate-pulse-glow shadow-[0_0_10px_2px_rgba(32,201,151,0.7)]" />
-          <span className="text-[11px] font-medium uppercase tracking-wider text-white/40">
-            Reactor Online
-          </span>
+      <div className="reactor-status-wrap px-4 py-4">
+        <div className="reactor-status-module">
+          <div className="flex items-center gap-2">
+            <span className="h-2 w-2 rounded-full bg-success animate-pulse-glow shadow-[0_0_10px_2px_rgba(32,201,151,0.7)]" />
+            <span className="text-[11px] font-medium uppercase tracking-wider text-white/40">
+              Reactor Online
+            </span>
+          </div>
+          <p className="mt-1 font-mono text-[10px] text-white/25">
+            Engineered For Performance.
+          </p>
         </div>
-        <p className="mt-1 font-mono text-[10px] text-white/25">Engineered For Performance.</p>
       </div>
     </aside>
   )
 }
