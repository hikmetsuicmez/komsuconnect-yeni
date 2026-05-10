'use client'

import { useRouter } from 'next/navigation'
import type { BusinessCategory } from '@/types/business'

interface Props {
  cities: string[]
  selectedCity?: string
  selectedCategory?: BusinessCategory
}

export default function CityFilter({ cities, selectedCity, selectedCategory }: Props) {
  const router = useRouter()

  if (cities.length === 0) return null

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    const params = new URLSearchParams()
    if (value) params.set('city', value)
    if (selectedCategory) params.set('category', selectedCategory)
    const query = params.toString()
    router.push(query ? `/?${query}` : '/')
  }

  return (
    <div className="mb-8">
      <select
        value={selectedCity ?? ''}
        onChange={handleChange}
        className="bg-surface border border-muted text-foreground rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-accent cursor-pointer"
      >
        <option value="">Tüm Şehirler</option>
        {cities.map((city) => (
          <option key={city} value={city}>
            {city}
          </option>
        ))}
      </select>
    </div>
  )
}
