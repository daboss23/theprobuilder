import type { Metadata } from 'next'
import './globals.css'
import { GlossTracker } from '@/components/reactor/GlossTracker'

export const metadata: Metadata = {
  title: 'TPB Creative Reactor — Engineered For Performance',
  description:
    'Creative Intelligence Command Center for The Professional Builder. Engineered For Performance.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Orbitron:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased text-[#e6edf6]">
        {/* Liquid-glass environment — moving neon aurora behind translucent glass */}
        <div className="reactor-aurora" aria-hidden="true">
          <span className="aurora-blob aurora-blob--cyan" />
          <span className="aurora-blob aurora-blob--violet" />
          <span className="aurora-blob aurora-blob--magenta" />
          <span className="aurora-blob aurora-blob--azure" />
        </div>
        <div className="reactor-bg" aria-hidden="true" />
        <div className="reactor-nodes" aria-hidden="true" />
        <GlossTracker />
        {children}
      </body>
    </html>
  )
}
