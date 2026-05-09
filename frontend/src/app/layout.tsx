import type { Metadata } from 'next'
import { Playfair_Display, Inter } from 'next/font/google'
import './globals.css'
import Header from '@/components/shared/Header'
import SessionInit from '@/components/shared/SessionInit'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'KomsuConnect',
  description: 'Mahalle esnafını keşfet',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr" className={`${playfair.variable} ${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-primary text-foreground font-body antialiased">
        <SessionInit />
        <Header />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  )
}
