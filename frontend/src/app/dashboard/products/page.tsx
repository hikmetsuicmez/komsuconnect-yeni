// src/app/dashboard/products/page.tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useBusiness } from '@/hooks/useBusiness'
import ProductTable from '@/components/dashboard/ProductTable'

export default function ProductsPage() {
  const { profile, hasProfile, isLoading } = useBusiness()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !hasProfile) {
      router.replace('/dashboard/profile')
    }
  }, [isLoading, hasProfile, router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-foreground/60 animate-pulse">Yükleniyor…</div>
      </div>
    )
  }

  if (!profile) return null

  return <ProductTable businessId={profile.id} />
}
