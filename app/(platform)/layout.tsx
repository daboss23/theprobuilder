import type { ReactNode } from 'react'
import { Sidebar } from '@/components/reactor/Sidebar'
import { Topbar } from '@/components/reactor/Topbar'
import { ReactorRunProvider } from '@/components/campaign-reactor/ReactorRunContext'

export default function PlatformLayout({ children }: { children: ReactNode }) {
  return (
    <ReactorRunProvider>
      <div className="reactor-platform flex min-h-screen">
        <Sidebar />
        <div className="reactor-stage flex min-w-0 flex-1 flex-col">
          <Topbar />
          <main className="reactor-main flex-1 px-3 py-4 sm:px-5 lg:px-6 lg:py-5">
            <div className="command-surface mx-auto max-w-[1480px] space-y-6">{children}</div>
          </main>
        </div>
      </div>
    </ReactorRunProvider>
  )
}
