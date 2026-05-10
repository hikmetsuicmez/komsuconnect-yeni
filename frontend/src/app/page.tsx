import { Suspense } from 'react'
import { getBusinesses, getCities } from '@/lib/businessApi'
import BusinessGrid from '@/components/businesses/BusinessGrid'
import CityFilter from '@/components/businesses/CityFilter'
import CategoryFilter from '@/components/businesses/CategoryFilter'
import type { Metadata } from 'next'
import type { BusinessCategory } from '@/types/business'
import { CATEGORY_LABELS } from '@/constants/categories'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'KomsuConnect — Esnafları Keşfet',
  description: 'Mahallenin esnafını keşfet.',
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ city?: string; category?: string }>
}) {
  const params = await searchParams
  const city = params?.city
  const rawCategory = params?.category
  const category: BusinessCategory | undefined =
    rawCategory && rawCategory in CATEGORY_LABELS
      ? (rawCategory as BusinessCategory)
      : undefined

  const [businesses, cities] = await Promise.all([
    getBusinesses(city, category),
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
          <CategoryFilter selectedCategory={category} selectedCity={city} />
          <CityFilter cities={cities} selectedCity={city} selectedCategory={category} />
        </Suspense>
        <BusinessGrid businesses={businesses} selectedCity={city} />
      </div>
    </div>
  )
}
