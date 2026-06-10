diff --git a/components/reactor/Topbar.tsx b/components/reactor/Topbar.tsx
index 6835673c40d709f2821a73025a63ea884ce12f15..ad1d03372170b06d78aaab403c194f1be9662563 100644
--- a/components/reactor/Topbar.tsx
+++ b/components/reactor/Topbar.tsx
@@ -1,95 +1,95 @@
 'use client'
 
 import { useState } from 'react'
 import Link from 'next/link'
 import Image from 'next/image'
 import { usePathname } from 'next/navigation'
 import { Menu, X, Search, Bell } from 'lucide-react'
 import { navItems } from '@/lib/nav'
 import { cn } from '@/lib/utils'
 
 export function Topbar() {
   const pathname = usePathname()
   const [open, setOpen] = useState(false)
   const current = navItems.find((n) => n.href === pathname)
 
   return (
-    <header className="sticky top-0 z-30 border-b border-border bg-background/70 backdrop-blur-xl">
+    <header className="reactor-topbar sticky top-0 z-30">
       <div className="flex h-16 items-center gap-4 px-5 lg:px-8">
         <button
           type="button"
           onClick={() => setOpen((v) => !v)}
           className="lg:hidden grid h-9 w-9 place-items-center rounded-lg border border-border text-white/70"
           aria-label="Toggle navigation"
         >
           {open ? <X size={18} /> : <Menu size={18} />}
         </button>
 
         <div className="lg:hidden">
           <Image
             src="/TPG-Reactor-Logo.png"
             alt="TPB Creative Reactor"
             width={1619}
             height={971}
-            className="h-7 w-auto"
+            className="reactor-logo h-7 w-auto"
           />
         </div>
 
         <div className="hidden lg:flex items-center gap-3">
           {current?.system && (
             <span className="font-mono text-[11px] tracking-widest text-glow/70">
               SYSTEM {current.system}
             </span>
           )}
           <h1 className="font-display text-base font-semibold tracking-tight text-white">
             {current?.label ?? 'Reactor Dashboard'}
           </h1>
         </div>
 
         <div className="ml-auto flex items-center gap-2">
-          <div className="hidden md:flex items-center gap-2 rounded-lg border border-border bg-surface/50 px-3 py-2 text-sm text-white/40 w-64">
+          <div className="topbar-control hidden w-64 items-center gap-2 rounded-xl border border-border bg-surface/50 px-3 py-2 text-sm text-white/40 md:flex">
             <Search size={15} />
             <span className="text-xs">Search intelligence…</span>
             <kbd className="ml-auto rounded bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-white/40">
               ⌘K
             </kbd>
           </div>
           <button
             type="button"
-            className="relative grid h-9 w-9 place-items-center rounded-lg border border-border text-white/60 hover:text-white"
+            className="topbar-control relative grid h-9 w-9 place-items-center rounded-xl border border-border text-white/60 hover:text-white"
             aria-label="Alerts"
           >
             <Bell size={16} />
             <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-cyan shadow-[0_0_8px_2px_rgba(0,212,255,0.7)]" />
           </button>
-          <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-primary to-cyan text-xs font-bold text-white">
+          <div className="topbar-avatar grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-cyan text-xs font-bold text-white">
             TPB
           </div>
         </div>
       </div>
 
       {open && (
-        <nav className="lg:hidden border-t border-border bg-card/95 px-3 py-3 space-y-1">
+        <nav className="mobile-reactor-nav space-y-1 border-t border-border bg-card/95 px-3 py-3 lg:hidden">
           {navItems.map((item) => {
             const active = pathname === item.href
             const Icon = item.icon
             return (
               <Link
                 key={item.href}
                 href={item.href}
                 onClick={() => setOpen(false)}
                 className={cn(
                   'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm',
                   active ? 'bg-primary/15 text-white' : 'text-white/60',
                 )}
               >
                 <Icon size={17} className={active ? 'text-glow' : 'text-white/40'} />
                 {item.label}
               </Link>
             )
           })}
         </nav>
       )}
     </header>
   )
 }
