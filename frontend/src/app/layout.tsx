import type { Metadata } from 'next'
import { Alfa_Slab_One, Bagel_Fat_One, Inter } from 'next/font/google'
import './globals.css'
import Header from '@/components/shared/Header'
import SessionInit from '@/components/shared/SessionInit'

const alfaSlab = Alfa_Slab_One({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-alfa-slab',
})

const bagelFat = Bagel_Fat_One({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bagel',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'KomsuConnect',
  description: 'Mahalle esnafını keşfet',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={`${alfaSlab.variable} ${bagelFat.variable} ${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col text-foreground font-body antialiased">
        <SessionInit />
        <Header />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  )
}
