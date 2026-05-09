'use client'

import { useRouter } from 'next/navigation'

interface Props {
  cities: string[]
  selectedCity?: string
}

export default function CityFilter({ cities, selectedCity }: Props) {
  const router = useRouter()

  if (cities.length === 0) return null

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    if (value) {
      router.push(`/?city=${encodeURIComponent(value)}`)
    } else {
      router.push('/')
    }
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
