// src/app/dashboard/profile/page.tsx
'use client'

import { useBusiness } from '@/hooks/useBusiness'
import ProfileForm from '@/components/dashboard/ProfileForm'

export default function ProfilePage() {
  const { profile, isLoading, error } = useBusiness()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-foreground/60 animate-pulse">Yükleniyor…</div>
      </div>
    )
  }

  if (error) {
    return <p className="text-accent">{error}</p>
  }

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold mb-2">
        {profile ? 'Profilim' : 'Profilinizi Oluşturun'}
      </h1>
      <p className="text-foreground/60 mb-8">
        {profile
          ? 'İşletme bilgilerinizi güncelleyin.'
          : 'Ürün ekleyebilmek için önce işletme profilinizi doldurun.'}
      </p>
      <ProfileForm profile={profile} />
    </div>
  )
}
