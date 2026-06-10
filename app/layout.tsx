import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Summit Build Co — AI Creative System',
  description: 'Brand-trained AI creative system demo for residential construction marketing',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
