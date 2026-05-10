# Sprint 5b Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix double heading bug, add category icons to homepage with combined city+category filtering, add category/neighborhood/workingHours fields to profile form and business profile page.

**Architecture:** Types first → constants → API layer → filter components → homepage wiring → form → profile page. Each task produces a self-contained, TypeScript-clean commit. Filters avoid `useSearchParams` by accepting current params as props from the Server Component, keeping client components simple.

**Tech Stack:** Next.js 16, React 19, TypeScript strict, Tailwind CSS, lucide-react ^1.14, React Hook Form ^7.75, Zod ^4.4, Axios.

---

### Task 1: Fix double "Ürünlerim" heading

**Files:**
- Modify: `src/app/dashboard/products/page.tsx`

The page renders `<h1>Ürünlerim</h1>` at line 30 AND `ProductTable` renders another `<h1>Ürünlerim</h1>` at line 82 of `ProductTable.tsx`. Remove the one in the page — the component already owns it.

- [ ] **Step 1: Remove the h1 from products/page.tsx**

Full replacement for `src/app/dashboard/products/page.tsx`:

```tsx
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

  return (
    <div>
      <ProductTable businessId={profile.id} />
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/dashboard/products/page.tsx
git commit -m "fix: remove duplicate Ürünlerim heading from products page"
```

---

### Task 2: Update TypeScript types

**Files:**
- Modify: `src/types/business.ts`

Add `BusinessCategory` union type and new nullable fields to all relevant interfaces. New fields are nullable in responses (backend may return null for existing records) and optional in requests.

- [ ] **Step 1: Replace src/types/business.ts**

```ts
// src/types/business.ts
export type BusinessCategory =
  | 'BAKERY'
  | 'BUTCHER'
  | 'GROCERY'
  | 'MARKET'
  | 'CAFE'
  | 'FLORIST'
  | 'HABERDASHER'
  | 'REPAIR'
  | 'OTHER'

export interface BusinessProfile {
  id: string
  userId: string
  businessName: string
  description: string | null
  address: string | null
  city: string | null
  phone: string | null
  category: BusinessCategory | null
  neighborhood: string | null
  workingHours: string | null
  createdAt: string
  updatedAt: string
}

export interface Product {
  id: string
  businessProfileId: string
  name: string
  description: string | null
  price: number
  imageUrl: string | null
  available: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateBusinessProfileRequest {
  businessName: string
  description?: string
  address?: string
  city?: string
  phone?: string
  category?: BusinessCategory
  neighborhood?: string
  workingHours?: string
}

export type UpdateBusinessProfileRequest = CreateBusinessProfileRequest

export interface BusinessPublicSummary {
  id: string
  businessName: string
  description: string | null
  city: string | null
  productCount: number
  category: BusinessCategory | null
  neighborhood: string | null
}

export interface ProductPublic {
  id: string
  name: string
  description: string | null
  price: number
  imageUrl: string | null
  available: boolean
}

export interface BusinessPublicDetail {
  id: string
  businessName: string
  description: string | null
  address: string | null
  city: string | null
  phone: string | null
  productCount: number
  products: ProductPublic[]
  category: BusinessCategory | null
  neighborhood: string | null
  workingHours: string | null
}
```

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: No new errors. Existing code continues to compile because the new fields are nullable (no existing usage breaks).

- [ ] **Step 3: Commit**

```bash
git add src/types/business.ts
git commit -m "feat: add category, neighborhood, workingHours to business types"
```

---

### Task 3: Create category constants

**Files:**
- Create: `src/constants/categories.ts`

Central source of truth for category metadata — both the icon-based filter and the profile page import from here.

- [ ] **Step 1: Create src/constants/categories.ts**

```ts
import {
  Wheat,
  Beef,
  ShoppingBasket,
  Store,
  Coffee,
  Flower,
  Scissors,
  Wrench,
  Grid3x3,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { BusinessCategory } from '@/types/business'

export const CATEGORIES: {
  value: BusinessCategory
  label: string
  Icon: LucideIcon
}[] = [
  { value: 'BAKERY',      label: 'Fırın',    Icon: Wheat },
  { value: 'BUTCHER',     label: 'Kasap',    Icon: Beef },
  { value: 'GROCERY',     label: 'Manav',    Icon: ShoppingBasket },
  { value: 'MARKET',      label: 'Bakkal',   Icon: Store },
  { value: 'CAFE',        label: 'Kahveci',  Icon: Coffee },
  { value: 'FLORIST',     label: 'Çiçekçi',  Icon: Flower },
  { value: 'HABERDASHER', label: 'Tuhafiye', Icon: Scissors },
  { value: 'REPAIR',      label: 'Tamirci',  Icon: Wrench },
  { value: 'OTHER',       label: 'Diğer',    Icon: Grid3x3 },
]

export const CATEGORY_LABELS: Record<BusinessCategory, string> = {
  BAKERY:      'Fırın',
  BUTCHER:     'Kasap',
  GROCERY:     'Manav',
  MARKET:      'Bakkal',
  CAFE:        'Kahveci',
  FLORIST:     'Çiçekçi',
  HABERDASHER: 'Tuhafiye',
  REPAIR:      'Tamirci',
  OTHER:       'Diğer',
}
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/constants/categories.ts
git commit -m "feat: add category constants with labels and lucide-react icons"
```

---

### Task 4: Update businessApi.ts for category filter

**Files:**
- Modify: `src/lib/businessApi.ts`

`getBusinesses` needs to forward `category` to `GET /api/v1/businesses?category=BAKERY`. Using `URLSearchParams` to build the query string cleanly handles both, one, or no filters.

- [ ] **Step 1: Replace src/lib/businessApi.ts**

```ts
import { notFound } from 'next/navigation'
import type {
  BusinessPublicSummary,
  BusinessPublicDetail,
  BusinessCategory,
} from '@/types/business'

const BASE = process.env.NEXT_PUBLIC_API_URL
if (!BASE) throw new Error('NEXT_PUBLIC_API_URL is not set')

export async function getBusinesses(
  city?: string,
  category?: BusinessCategory
): Promise<BusinessPublicSummary[]> {
  const params = new URLSearchParams()
  if (city) params.set('city', city)
  if (category) params.set('category', category)
  const query = params.toString()
  const url = `${BASE}/api/v1/businesses${query ? `?${query}` : ''}`
  try {
    const res = await fetch(url, { next: { revalidate: 60 } })
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

export async function getCities(): Promise<string[]> {
  try {
    const res = await fetch(`${BASE}/api/v1/businesses/cities`, {
      next: { revalidate: 300 },
    })
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

export async function getBusinessById(
  id: string
): Promise<BusinessPublicDetail> {
  let res: Response
  try {
    res = await fetch(`${BASE}/api/v1/businesses/${id}`, {
      next: { revalidate: 30 },
    })
  } catch (err) {
    throw new Error(`Failed to fetch business ${id}`, { cause: err })
  }
  if (res.status === 404) notFound()
  if (!res.ok) throw new Error(`Unexpected status ${res.status} for business ${id}`)
  return res.json()
}
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/businessApi.ts
git commit -m "feat: pass category param to getBusinesses API call"
```

---

### Task 5: Update CityFilter to preserve category param

**Files:**
- Modify: `src/components/businesses/CityFilter.tsx`

Currently `router.push('/?city=...')` drops any active `?category=`. Fix: accept `selectedCategory` as a prop (passed from the Server Component) and include it when building the push URL.

- [ ] **Step 1: Replace src/components/businesses/CityFilter.tsx**

```tsx
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
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: No errors (homepage hasn't passed `selectedCategory` yet — that's Task 7).

- [ ] **Step 3: Commit**

```bash
git add src/components/businesses/CityFilter.tsx
git commit -m "fix: preserve category query param when CityFilter changes city"
```

---

### Task 6: Create CategoryFilter component

**Files:**
- Create: `src/components/businesses/CategoryFilter.tsx`

Icon button row. Clicking an active category deselects it (clears the filter). Passes current city through so it isn't lost. Active state: terracotta border + background tint.

- [ ] **Step 1: Create src/components/businesses/CategoryFilter.tsx**

```tsx
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
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/businesses/CategoryFilter.tsx
git commit -m "feat: add CategoryFilter component with lucide-react icons and terracotta active state"
```

---

### Task 7: Wire CategoryFilter into the homepage

**Files:**
- Modify: `src/app/page.tsx`

Read `category` from `searchParams` (same pattern as `city`). Place `CategoryFilter` above `CityFilter`. Both components receive the other's current value as a prop so navigation preserves the combined filter state.

- [ ] **Step 1: Replace src/app/page.tsx**

```tsx
import { Suspense } from 'react'
import { getBusinesses, getCities } from '@/lib/businessApi'
import BusinessGrid from '@/components/businesses/BusinessGrid'
import CityFilter from '@/components/businesses/CityFilter'
import CategoryFilter from '@/components/businesses/CategoryFilter'
import type { Metadata } from 'next'
import type { BusinessCategory } from '@/types/business'

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
  const category = params?.category as BusinessCategory | undefined

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
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: add category filter to homepage above city filter"
```

---

### Task 8: Update ProfileForm with new fields

**Files:**
- Modify: `src/components/dashboard/ProfileForm.tsx`

Add category dropdown (using `CATEGORIES` for options), neighborhood input, workingHours input. Zod v4 `z.enum()` validates category. New fields added after city, before phone.

- [ ] **Step 1: Replace src/components/dashboard/ProfileForm.tsx**

```tsx
// src/components/dashboard/ProfileForm.tsx
'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import api from '@/lib/api'
import { useBusiness } from '@/hooks/useBusiness'
import { CATEGORIES } from '@/constants/categories'
import type { BusinessProfile } from '@/types/business'

const CATEGORY_VALUES = [
  'BAKERY', 'BUTCHER', 'GROCERY', 'MARKET', 'CAFE',
  'FLORIST', 'HABERDASHER', 'REPAIR', 'OTHER',
] as const

const profileSchema = z.object({
  businessName: z.string().min(1, 'İşletme adı zorunludur'),
  description: z.string().optional(),
  address: z.string().max(255, 'Adres en fazla 255 karakter olabilir').optional(),
  city: z.string().max(100, 'Şehir adı en fazla 100 karakter olabilir').optional(),
  phone: z
    .string()
    .refine((val) => val === '' || (val.length >= 7 && val.length <= 20), {
      message: 'Telefon 7-20 karakter arasında olmalıdır',
    })
    .optional(),
  category: z.enum(CATEGORY_VALUES).optional(),
  neighborhood: z.string().max(100, 'Mahalle en fazla 100 karakter olabilir').optional(),
  workingHours: z.string().max(100, 'Çalışma saatleri en fazla 100 karakter olabilir').optional(),
})

type ProfileFormData = z.infer<typeof profileSchema>

interface ProfileFormProps {
  profile: BusinessProfile | null
}

export default function ProfileForm({ profile }: ProfileFormProps) {
  const { refreshProfile } = useBusiness()
  const [serverError, setServerError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      businessName: profile?.businessName ?? '',
      description: profile?.description ?? '',
      address: profile?.address ?? '',
      city: profile?.city ?? '',
      phone: profile?.phone ?? '',
      category: profile?.category ?? undefined,
      neighborhood: profile?.neighborhood ?? '',
      workingHours: profile?.workingHours ?? '',
    },
  })

  useEffect(() => {
    reset({
      businessName: profile?.businessName ?? '',
      description: profile?.description ?? '',
      address: profile?.address ?? '',
      city: profile?.city ?? '',
      phone: profile?.phone ?? '',
      category: profile?.category ?? undefined,
      neighborhood: profile?.neighborhood ?? '',
      workingHours: profile?.workingHours ?? '',
    })
  }, [profile, reset])

  const onSubmit = async (data: ProfileFormData) => {
    setServerError(null)
    setSuccessMessage(null)
    const payload = {
      businessName: data.businessName,
      ...(data.description && { description: data.description }),
      ...(data.address && { address: data.address }),
      ...(data.city && { city: data.city }),
      ...(data.phone && { phone: data.phone }),
      ...(data.category && { category: data.category }),
      ...(data.neighborhood && { neighborhood: data.neighborhood }),
      ...(data.workingHours && { workingHours: data.workingHours }),
    }
    try {
      if (profile) {
        await api.put(`/api/v1/businesses/${profile.id}`, payload)
      } else {
        await api.post('/api/v1/businesses', payload)
      }
      await refreshProfile()
      setSuccessMessage('Profil başarıyla kaydedildi.')
    } catch {
      setServerError('Profil kaydedilirken bir hata oluştu. Lütfen tekrar deneyin.')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-w-xl">
      <div className="space-y-2">
        <Label htmlFor="businessName">İşletme Adı *</Label>
        <Input
          id="businessName"
          {...register('businessName')}
          placeholder="Örn: Ahmet'in Fırını"
        />
        {errors.businessName && (
          <p className="text-xs text-accent">{errors.businessName.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Açıklama</Label>
        <textarea
          id="description"
          {...register('description')}
          placeholder="İşletmenizi kısaca tanıtın"
          rows={3}
          className="w-full rounded-lg border border-muted bg-surface px-3 py-2 text-sm text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-1 focus:ring-accent resize-none"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Adres</Label>
        <Input
          id="address"
          {...register('address')}
          placeholder="Sokak, Mahalle, No"
        />
        {errors.address && (
          <p className="text-xs text-accent">{errors.address.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="city">Şehir</Label>
        <Input id="city" {...register('city')} placeholder="İstanbul" />
        {errors.city && (
          <p className="text-xs text-accent">{errors.city.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Kategori</Label>
        <select
          id="category"
          {...register('category')}
          className="w-full rounded-lg border border-muted bg-surface px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
        >
          <option value="">— Seçiniz —</option>
          {CATEGORIES.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        {errors.category && (
          <p className="text-xs text-accent">{errors.category.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="neighborhood">Mahalle</Label>
        <Input
          id="neighborhood"
          {...register('neighborhood')}
          placeholder="Kadıköy, Moda"
        />
        {errors.neighborhood && (
          <p className="text-xs text-accent">{errors.neighborhood.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="workingHours">Çalışma Saatleri</Label>
        <Input
          id="workingHours"
          {...register('workingHours')}
          placeholder="09:00-18:00"
        />
        {errors.workingHours && (
          <p className="text-xs text-accent">{errors.workingHours.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Telefon</Label>
        <Input
          id="phone"
          {...register('phone')}
          placeholder="05XX XXX XX XX"
        />
        {errors.phone && (
          <p className="text-xs text-accent">{errors.phone.message}</p>
        )}
      </div>

      {serverError && <p className="text-sm text-accent">{serverError}</p>}
      {successMessage && <p className="text-sm text-green-400">{successMessage}</p>}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Kaydediliyor…' : profile ? 'Güncelle' : 'Profil Oluştur'}
      </Button>
    </form>
  )
}
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard/ProfileForm.tsx
git commit -m "feat: add category dropdown, neighborhood, workingHours to profile form"
```

---

### Task 9: Display new fields on business profile page

**Files:**
- Modify: `src/app/businesses/[id]/page.tsx`

Import `CATEGORY_LABELS` from constants, display category (Türkçe label), neighborhood, and workingHours in the info band when present.

- [ ] **Step 1: Replace src/app/businesses/[id]/page.tsx**

```tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { getBusinessById } from '@/lib/businessApi'
import ProductCard from '@/components/businesses/ProductCard'
import { CATEGORY_LABELS } from '@/constants/categories'

export const revalidate = 30

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  try {
    const { id } = await params
    const business = await getBusinessById(id)
    return {
      title: `${business.businessName} — KomsuConnect`,
      description: business.description ?? `${business.businessName} ürünlerini keşfet`,
    }
  } catch {
    return { title: 'Esnaf — KomsuConnect' }
  }
}

export default async function BusinessPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const business = await getBusinessById(id)

  return (
    <div>
      {/* Geri link */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <Link href="/" className="text-sm text-foreground/60 hover:text-foreground transition-colors">
          ← Ana sayfa
        </Link>
      </div>

      {/* Hero banner */}
      <div className="relative w-full h-48 bg-gradient-to-br from-[#D4A340] via-[#C2492C]/80 to-[#26201A] flex items-end mt-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6 w-full">
          <h1 className="font-heading text-4xl text-white">
            {business.businessName}
          </h1>
        </div>
      </div>

      {/* İçerik */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Esnaf detay kartı */}
        <div className="bg-surface border border-muted shadow-[3px_3px_0_#26201A] p-6 mb-8">
          {business.description && (
            <p className="text-foreground/70 mb-4">{business.description}</p>
          )}
          <div className="flex flex-wrap gap-4 text-sm text-foreground/60">
            {business.category && (
              <span>🏪 {CATEGORY_LABELS[business.category]}</span>
            )}
            {business.city && <span>📍 {business.city}</span>}
            {business.neighborhood && <span>{business.neighborhood}</span>}
            {business.address && <span>{business.address}</span>}
            {business.workingHours && <span>🕐 {business.workingHours}</span>}
            {business.phone && (
              <a href={`tel:${business.phone}`} className="hover:text-accent transition-colors">
                📞 {business.phone}
              </a>
            )}
          </div>
        </div>

        {/* Ürünler */}
        <h2 className="font-heading text-2xl text-muted mb-6">
          Ürünler ({business.productCount})
        </h2>

        {business.products.length === 0 ? (
          <p className="text-foreground/60">Bu esnaf henüz ürün eklememiş.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {business.products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/businesses/[id]/page.tsx
git commit -m "feat: display category, neighborhood, workingHours on business profile page"
```

---

### Task 10: Verify Vercel environment variable

**Files:**
- No code changes — Vercel dashboard configuration check.

`.env.local` has `NEXT_PUBLIC_API_URL=http://localhost:8080` (dev only). For production, this must be set in Vercel.

- [ ] **Step 1: Check Vercel dashboard**

Open the Vercel dashboard for the `komsuconnect` project:

1. **Settings → Environment Variables**
2. Confirm `NEXT_PUBLIC_API_URL` exists and is set to the production backend URL (e.g. `https://your-backend.railway.app`)
3. Confirm it is scoped to **Production** (not just Preview or Development)
4. If it is missing or wrong, add/update it and trigger a redeploy

No `.env.local` or `.env.example` changes are needed — local dev values are correct.
