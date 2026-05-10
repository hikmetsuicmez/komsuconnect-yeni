'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

const AUTH_ROUTES = ['/login', '/register']

export default function Header() {
  const { isAuthenticated, logout, user } = useAuth()
  const pathname = usePathname()

  if (AUTH_ROUTES.includes(pathname)) return null

  return (
    <header className="sticky top-0 z-50 bg-primary border-b border-primary/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-baseline gap-0.5">
          <span className="font-logo text-xl text-surface">Komşu</span>
          <span className="font-heading text-xl text-accent">Connect</span>
        </Link>
        <nav className="flex items-center gap-4">
          <Link
            href="/"
            className="text-sm text-surface/70 hover:text-surface transition-colors"
          >
            Esnafları Keşfet
          </Link>
          {isAuthenticated && user?.accountType === 'BUSINESS' && (
            <Link
              href="/dashboard"
              className="text-sm text-surface/70 hover:text-surface transition-colors"
            >
              Panel
            </Link>
          )}
          {isAuthenticated ? (
            <button
              onClick={logout}
              className="text-sm text-surface/70 hover:text-surface transition-colors"
            >
              Çıkış Yap
            </button>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm text-surface/70 hover:text-surface transition-colors"
              >
                Giriş Yap
              </Link>
              <Link
                href="/register"
                className="text-sm bg-accent text-white px-4 py-2 rounded-lg hover:bg-accent/90 transition-colors"
              >
                Kayıt Ol
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
