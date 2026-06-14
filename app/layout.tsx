import type { Metadata } from 'next'
import './globals.css'

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
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@900&family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased text-[#e6edf6]">
        <div className="reactor-bg" />
        {children}
      </body>
    </html>
  )
}
