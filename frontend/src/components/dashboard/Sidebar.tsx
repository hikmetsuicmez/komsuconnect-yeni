'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { User, Package } from 'lucide-react'
import { useBusiness } from '@/hooks/useBusiness'

const navItems = [
  { href: '/dashboard/profile', label: 'Profil', icon: User, requiresProfile: false },
  { href: '/dashboard/products', label: 'Ürünlerim', icon: Package, requiresProfile: true },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { hasProfile } = useBusiness()

  return (
    <aside className="hidden md:flex flex-col w-60 min-h-full bg-surface border-r border-muted p-4 gap-1 shrink-0">
      <p className="text-xs text-foreground/40 uppercase tracking-widest px-3 mb-2">Panel</p>
      {navItems.map(({ href, label, icon: Icon, requiresProfile }) => {
        const isActive = pathname === href
        const isDisabled = requiresProfile && !hasProfile

        if (isDisabled) {
          return (
            <span
              key={href}
              title="Önce profilinizi kaydedin"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm opacity-40 cursor-not-allowed select-none"
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </span>
          )
        }

        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              isActive
                ? 'bg-accent/10 text-accent border-l-2 border-accent pl-[10px]'
                : 'text-foreground/70 hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        )
      })}
    </aside>
  )
}
