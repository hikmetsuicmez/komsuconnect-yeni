'use client'

import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'

export default function Header() {
  const { isAuthenticated, logout } = useAuth()

  return (
    <header className="sticky top-0 z-50 bg-primary border-b border-muted">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="font-heading text-xl font-bold text-accent">
          KomsuConnect
        </Link>
        <nav className="flex items-center gap-4">
          {isAuthenticated ? (
            <button
              onClick={logout}
              className="text-sm text-foreground/70 hover:text-foreground transition-colors"
            >
              Çıkış Yap
            </button>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm text-foreground/70 hover:text-foreground transition-colors"
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
