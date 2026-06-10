import type { ReactNode } from 'react'
import { Sidebar } from '@/components/reactor/Sidebar'
import { Topbar } from '@/components/reactor/Topbar'

export default function PlatformLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 px-5 py-6 lg:px-8 lg:py-8">
          <div className="mx-auto max-w-[1400px] space-y-6">{children}</div>
        </main>
      </div>
    </div>
  )
}
