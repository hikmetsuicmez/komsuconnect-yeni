import { Suspense } from 'react'
import { getBusinesses, getCities } from '@/lib/businessApi'
import BusinessGrid from '@/components/businesses/BusinessGrid'
import CityFilter from '@/components/businesses/CityFilter'
import type { Metadata } from 'next'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'KomsuConnect — Esnafları Keşfet',
  description: 'Mahallenin esnafını keşfet.',
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ city?: string }>
}) {
  const params = await searchParams
  const city = params?.city

  const [businesses, cities] = await Promise.all([
    getBusinesses(city),
    getCities(),
  ])

  return (
    <div>
      {/* Hero */}
      <div className="border-b border-muted/30 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="font-heading text-5xl sm:text-6xl text-foreground mb-4">
            Mahallenin esnafı,<br />bir tıkla.
          </h1>
          <p className="text-foreground/60 text-lg">
            Yakın çevrendeki esnafları keşfet.
          </p>
        </div>
      </div>

      {/* İçerik */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Suspense>
          <CityFilter cities={cities} selectedCity={city} />
        </Suspense>
        <BusinessGrid businesses={businesses} selectedCity={city} />
      </div>
    </div>
  )
}
