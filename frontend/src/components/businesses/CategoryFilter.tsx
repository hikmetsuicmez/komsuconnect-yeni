'use client'

import { useRouter } from 'next/navigation'
import { CATEGORIES } from '@/constants/categories'
import type { BusinessCategory } from '@/types/business'

interface Props {
  selectedCategory?: BusinessCategory
  selectedCity?: string
}

export default function CategoryFilter({ selectedCategory, selectedCity }: Props) {
  const router = useRouter()

  const handleSelect = (value: BusinessCategory) => {
    const params = new URLSearchParams()
    if (selectedCity) params.set('city', selectedCity)
    if (selectedCategory !== value) params.set('category', value)
    const query = params.toString()
    router.push(query ? `/?${query}` : '/')
  }

  return (
    <div className="flex gap-2 flex-wrap mb-6">
      {CATEGORIES.map(({ value, label, Icon }) => {
        const isActive = selectedCategory === value
        return (
          <button
            key={value}
            type="button"
            aria-pressed={isActive}
            onClick={() => handleSelect(value)}
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg border text-xs font-medium transition-colors ${
              isActive
                ? 'border-[#C2492C] bg-[#C2492C]/10 text-[#C2492C]'
                : 'border-muted text-foreground/60 hover:border-foreground/40 hover:text-foreground'
            }`}
          >
            <Icon className="h-5 w-5" />
            {label}
          </button>
        )
      })}
    </div>
  )
}
