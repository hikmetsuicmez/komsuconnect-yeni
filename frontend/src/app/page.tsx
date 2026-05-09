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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10 text-center">
        <h1 className="font-heading text-4xl font-bold text-foreground mb-3">
          Mahallenin Esnafı Bir Tık Uzağında
        </h1>
        <p className="text-foreground/60 text-lg">
          Yakın çevrendeki esnafları keşfet.
        </p>
      </div>
      <Suspense>
        <CityFilter cities={cities} selectedCity={city} />
      </Suspense>
      <BusinessGrid businesses={businesses} selectedCity={city} />
    </div>
  )
}
