import Link from 'next/link'
import BusinessCard from './BusinessCard'
import type { BusinessPublicSummary } from '@/types/business'

interface Props {
  businesses: BusinessPublicSummary[]
  selectedCity?: string
}

export default function BusinessGrid({ businesses, selectedCity }: Props) {
  if (businesses.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-foreground/60 text-lg mb-4">
          {selectedCity
            ? 'Bu şehirde henüz esnaf bulunmuyor.'
            : 'Henüz kayıtlı esnaf yok.'}
        </p>
        {selectedCity && (
          <Link href="/" className="text-accent hover:underline text-sm">
            Tüm esnafları gör
          </Link>
        )}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {businesses.map((business) => (
        <BusinessCard key={business.id} business={business} />
      ))}
    </div>
  )
}
