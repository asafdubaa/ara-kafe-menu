import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Ara Kafe',
  description: 'Discover our delicious menu at Ara Kafe',
  generator: 'Next.js',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  )
}
