'use client'

import Link from 'next/link'
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
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-heading text-3xl text-foreground mb-1">
            Pano{profile?.businessName ? ` — ${profile.businessName}` : ''}
          </h1>
          <p className="text-foreground/60 text-sm">
            {profile
              ? 'İşletme bilgilerinizi güncelleyin.'
              : 'Ürün ekleyebilmek için önce işletme profilinizi doldurun.'}
          </p>
        </div>
        {profile && (
          <Link
            href={`/businesses/${profile.id}`}
            className="text-sm border border-accent text-accent px-4 py-2 hover:bg-accent hover:text-white transition-colors shrink-0"
          >
            Profili Önizle →
          </Link>
        )}
      </div>
      <ProfileForm profile={profile} />
    </div>
  )
}
