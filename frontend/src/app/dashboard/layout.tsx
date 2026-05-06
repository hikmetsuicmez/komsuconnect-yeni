'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { BusinessProvider } from '@/context/BusinessContext'
import Sidebar from '@/components/dashboard/Sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login')
      return
    }
    if (user?.accountType !== 'BUSINESS') {
      router.replace('/')
    }
  }, [isAuthenticated, user, router])

  if (!isAuthenticated || user?.accountType !== 'BUSINESS') return null

  return (
    <BusinessProvider>
      <div className="flex min-h-[calc(100vh-4rem)]">
        <Sidebar />
        <main className="flex-1 p-8 min-w-0">{children}</main>
      </div>
    </BusinessProvider>
  )
}
