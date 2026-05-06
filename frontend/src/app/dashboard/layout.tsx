'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
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

  return <>{children}</>
}
