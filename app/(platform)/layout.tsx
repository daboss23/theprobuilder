diff --git a/app/(platform)/layout.tsx b/app/(platform)/layout.tsx
index f1f43b9a852c1f494bb0cbeeac3aa38b8153a72a..035ce50d0d05df50213f99433ef25bb2c8264e15 100644
--- a/app/(platform)/layout.tsx
+++ b/app/(platform)/layout.tsx
@@ -1,17 +1,17 @@
 import type { ReactNode } from 'react'
 import { Sidebar } from '@/components/reactor/Sidebar'
 import { Topbar } from '@/components/reactor/Topbar'
 
 export default function PlatformLayout({ children }: { children: ReactNode }) {
   return (
-    <div className="flex min-h-screen">
+    <div className="reactor-platform flex min-h-screen">
       <Sidebar />
-      <div className="flex min-w-0 flex-1 flex-col">
+      <div className="reactor-stage flex min-w-0 flex-1 flex-col">
         <Topbar />
-        <main className="flex-1 px-5 py-6 lg:px-8 lg:py-8">
-          <div className="mx-auto max-w-[1400px] space-y-6">{children}</div>
+        <main className="reactor-main flex-1 px-3 py-4 sm:px-5 lg:px-6 lg:py-5">
+          <div className="command-surface mx-auto max-w-[1480px] space-y-6">{children}</div>
         </main>
       </div>
     </div>
   )
 }
