'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/authStore'
import { BusinessProvider } from '@/context/BusinessContext'
import Sidebar from '@/components/dashboard/Sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth()
  const sessionChecked = useAuthStore((state) => state._sessionChecked)
  const router = useRouter()

  useEffect(() => {
    if (!sessionChecked) return
    if (!isAuthenticated) {
      router.replace('/login')
      return
    }
    if (user?.accountType !== 'BUSINESS') {
      router.replace('/')
    }
  }, [sessionChecked, isAuthenticated, user, router])

  if (!sessionChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    )
  }

  if (!isAuthenticated || user?.accountType !== 'BUSINESS') return null

  return (
    <BusinessProvider>
      <div className="flex min-h-[calc(100vh-4rem)] bg-[#F5EAD4]">
        <Sidebar />
        <main className="flex-1 p-8 min-w-0">{children}</main>
      </div>
    </BusinessProvider>
  )
}
