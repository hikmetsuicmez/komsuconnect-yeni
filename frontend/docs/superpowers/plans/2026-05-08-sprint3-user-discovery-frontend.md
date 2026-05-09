# Sprint 3 — Kullanıcı Keşif Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ana sayfaya esnaf keşif ekranı, esnaf profil sayfası, şehir filtresi ve header güncellemesi ekle; tüm public sayfalar giriş gerektirmeden erişilebilir olsun.

**Architecture:** `app/page.tsx` ve `app/businesses/[id]/page.tsx` async Server Component olarak çalışır; şehir filtresi `?city=` URL param üzerinden SSR'a aktarılır. Sadece `CityFilter.tsx` `"use client"` — router.push ile URL'i günceller. Server Component'lerde native `fetch` + `revalidate` kullanılır, Axios değil.

**Tech Stack:** Next.js 16 App Router, TypeScript strict, Tailwind CSS, next/image, native fetch

---

## Dosya Haritası

| Durum | Dosya | Sorumluluk |
|---|---|---|
| Modify | `src/types/business.ts` | Public görünüm tipleri eklenir |
| Modify | `next.config.ts` | next/image remotePatterns |
| Create | `src/lib/businessApi.ts` | Server-side fetch fonksiyonları |
| Create | `src/components/businesses/BusinessCard.tsx` | Esnaf özet kartı |
| Create | `src/components/businesses/ProductCard.tsx` | Ürün kartı |
| Create | `src/components/businesses/BusinessGrid.tsx` | Grid wrapper + boş durum |
| Create | `src/components/businesses/CityFilter.tsx` | "use client" şehir dropdown |
| Modify | `src/app/page.tsx` | Ana sayfa — async Server Component |
| Create | `src/app/loading.tsx` | Ana sayfa skeleton |
| Create | `src/app/error.tsx` | Global error boundary |
| Create | `src/app/businesses/[id]/page.tsx` | Esnaf profil sayfası — SSR |
| Create | `src/app/businesses/[id]/loading.tsx` | Profil sayfası skeleton |
| Create | `src/app/businesses/[id]/error.tsx` | Profil sayfası error boundary |
| Modify | `src/components/shared/Header.tsx` | Keşfet + Panel linkleri |

---

## Task 1: Public Tip Tanımları

**Files:**
- Modify: `src/types/business.ts`

- [ ] **Step 1: Mevcut dosyaya public tipleri ekle**

`src/types/business.ts` dosyasının sonuna aşağıdakileri ekle (mevcut interface'lere dokunma):

```typescript
export interface BusinessPublicSummary {
  id: string
  businessName: string
  description: string | null
  city: string | null
  productCount: number
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
}
```

- [ ] **Step 2: TypeScript kontrolü**

```bash
npx tsc --noEmit
```

Beklenen: hata yok.

- [ ] **Step 3: Commit**

```bash
git add src/types/business.ts
git commit -m "feat: add public business and product types for discovery"
```

---

## Task 2: next.config.ts — Image Konfigürasyonu

**Files:**
- Modify: `next.config.ts`

- [ ] **Step 1: remotePatterns ekle**

`next.config.ts` dosyasını aşağıdaki şekilde güncelle:

```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },
}

export default nextConfig
```

- [ ] **Step 2: Commit**

```bash
git add next.config.ts
git commit -m "feat: configure next/image remote patterns for product images"
```

---

## Task 3: Server-Side Fetch Fonksiyonları

**Files:**
- Create: `src/lib/businessApi.ts`

- [ ] **Step 1: Dosyayı oluştur**

```typescript
import { notFound } from 'next/navigation'
import type {
  BusinessPublicSummary,
  BusinessPublicDetail,
} from '@/types/business'

const BASE = process.env.NEXT_PUBLIC_API_URL

export async function getBusinesses(
  city?: string
): Promise<BusinessPublicSummary[]> {
  const url = city
    ? `${BASE}/api/v1/businesses?city=${encodeURIComponent(city)}`
    : `${BASE}/api/v1/businesses`
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
  const res = await fetch(`${BASE}/api/v1/businesses/${id}`, {
    next: { revalidate: 30 },
  })
  if (!res.ok) notFound()
  return res.json()
}
```

- [ ] **Step 2: TypeScript kontrolü**

```bash
npx tsc --noEmit
```

Beklenen: hata yok.

- [ ] **Step 3: Commit**

```bash
git add src/lib/businessApi.ts
git commit -m "feat: add server-side business API fetch functions"
```

---

## Task 4: BusinessCard Bileşeni

**Files:**
- Create: `src/components/businesses/BusinessCard.tsx`

- [ ] **Step 1: Bileşeni oluştur**

```tsx
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import type { BusinessPublicSummary } from '@/types/business'

interface Props {
  business: BusinessPublicSummary
}

export default function BusinessCard({ business }: Props) {
  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="font-heading text-xl font-bold text-foreground mb-1">
          {business.businessName}
        </h2>
        {business.description && (
          <p className="text-foreground/60 text-sm mb-3 line-clamp-2">
            {business.description}
          </p>
        )}
        <div className="flex items-center gap-4 text-foreground/60 text-sm mb-4">
          {business.city && <span>{business.city}</span>}
          <span>{business.productCount} ürün</span>
        </div>
        <Link
          href={`/businesses/${business.id}`}
          className="inline-block bg-accent text-white text-sm px-4 py-2 rounded-lg hover:bg-accent/90 transition-colors"
        >
          İncele
        </Link>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 2: TypeScript kontrolü**

```bash
npx tsc --noEmit
```

Beklenen: hata yok.

- [ ] **Step 3: Commit**

```bash
git add src/components/businesses/BusinessCard.tsx
git commit -m "feat: add BusinessCard component"
```

---

## Task 5: ProductCard Bileşeni

**Files:**
- Create: `src/components/businesses/ProductCard.tsx`

- [ ] **Step 1: Bileşeni oluştur**

```tsx
import Image from 'next/image'
import type { ProductPublic } from '@/types/business'

interface Props {
  product: ProductPublic
}

export default function ProductCard({ product }: Props) {
  return (
    <div
      className={`rounded-xl border border-muted bg-surface overflow-hidden${
        !product.available ? ' opacity-50' : ''
      }`}
    >
      <div className="relative h-40 bg-muted">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-foreground/30 text-xs">Görsel yok</span>
          </div>
        )}
        {!product.available && (
          <span className="absolute top-2 right-2 bg-primary/80 text-foreground/60 text-xs px-2 py-1 rounded">
            Tükendi
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-heading font-semibold text-foreground mb-1">
          {product.name}
        </h3>
        {product.description && (
          <p className="text-foreground/60 text-sm mb-2 line-clamp-2">
            {product.description}
          </p>
        )}
        <span className="text-accent font-bold text-sm">
          ₺{Number(product.price).toFixed(2)}
        </span>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: TypeScript kontrolü**

```bash
npx tsc --noEmit
```

Beklenen: hata yok.

- [ ] **Step 3: Commit**

```bash
git add src/components/businesses/ProductCard.tsx
git commit -m "feat: add ProductCard component with availability state"
```

---

## Task 6: BusinessGrid Bileşeni

**Files:**
- Create: `src/components/businesses/BusinessGrid.tsx`

- [ ] **Step 1: Bileşeni oluştur**

```tsx
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
```

- [ ] **Step 2: TypeScript kontrolü**

```bash
npx tsc --noEmit
```

Beklenen: hata yok.

- [ ] **Step 3: Commit**

```bash
git add src/components/businesses/BusinessGrid.tsx
git commit -m "feat: add BusinessGrid with empty state handling"
```

---

## Task 7: CityFilter Bileşeni (Client Component)

**Files:**
- Create: `src/components/businesses/CityFilter.tsx`

- [ ] **Step 1: Bileşeni oluştur**

```tsx
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
```

- [ ] **Step 2: TypeScript kontrolü**

```bash
npx tsc --noEmit
```

Beklenen: hata yok.

- [ ] **Step 3: Commit**

```bash
git add src/components/businesses/CityFilter.tsx
git commit -m "feat: add CityFilter client component with URL param navigation"
```

---

## Task 8: Ana Sayfa Güncelleme

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Dosyayı tamamen değiştir**

```tsx
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
```

- [ ] **Step 2: TypeScript kontrolü**

```bash
npx tsc --noEmit
```

Beklenen: hata yok.

- [ ] **Step 3: Dev server'ı başlat ve doğrula**

```bash
npm run dev
```

Kontrol et:
- `http://localhost:3000` açılıyor ve esnaf listesi görünüyor
- `http://localhost:3000/?city=Istanbul` şehir filtreli listeyi gösteriyor
- Backend çalışmıyorsa boş durum mesajı görünüyor

- [ ] **Step 4: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: rebuild home page as SSR discovery page with city filter"
```

---

## Task 9: Ana Sayfa Loading & Error Sınırları

**Files:**
- Create: `src/app/loading.tsx`
- Create: `src/app/error.tsx`

- [ ] **Step 1: loading.tsx oluştur**

```tsx
export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10 text-center space-y-3">
        <div className="h-10 bg-muted rounded animate-pulse w-96 mx-auto" />
        <div className="h-5 bg-muted rounded animate-pulse w-64 mx-auto" />
      </div>
      <div className="h-10 bg-muted rounded animate-pulse w-48 mb-8" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl bg-surface border border-muted p-6 space-y-3"
          >
            <div className="h-6 bg-muted rounded animate-pulse w-3/4" />
            <div className="h-4 bg-muted rounded animate-pulse w-full" />
            <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
            <div className="h-8 bg-muted rounded animate-pulse w-24" />
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: error.tsx oluştur**

```tsx
'use client'

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <h2 className="font-heading text-2xl font-bold text-foreground mb-3">
        Bir şeyler yanlış gitti
      </h2>
      <p className="text-foreground/60 mb-6">
        Sayfa yüklenirken bir hata oluştu.
      </p>
      <button
        onClick={reset}
        className="bg-accent text-white px-6 py-2 rounded-lg hover:bg-accent/90 transition-colors"
      >
        Yenile
      </button>
    </div>
  )
}
```

- [ ] **Step 3: TypeScript kontrolü**

```bash
npx tsc --noEmit
```

Beklenen: hata yok.

- [ ] **Step 4: Commit**

```bash
git add src/app/loading.tsx src/app/error.tsx
git commit -m "feat: add home page loading skeleton and error boundary"
```

---

## Task 10: Esnaf Profil Sayfası

**Files:**
- Create: `src/app/businesses/[id]/page.tsx`

- [ ] **Step 1: Dizini oluştur ve page.tsx yaz**

```tsx
import type { Metadata } from 'next'
import { getBusinessById } from '@/lib/businessApi'
import ProductCard from '@/components/businesses/ProductCard'

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
      description:
        business.description ?? `${business.businessName} ürünlerini keşfet`,
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10">
        <h1 className="font-heading text-3xl font-bold text-foreground mb-2">
          {business.businessName}
        </h1>
        {business.description && (
          <p className="text-foreground/70 mb-4">{business.description}</p>
        )}
        <div className="flex flex-wrap gap-4 text-sm text-foreground/60">
          {business.city && <span>📍 {business.city}</span>}
          {business.address && <span>{business.address}</span>}
          {business.phone && (
            <a
              href={`tel:${business.phone}`}
              className="hover:text-accent transition-colors"
            >
              📞 {business.phone}
            </a>
          )}
        </div>
      </div>

      <h2 className="font-heading text-xl font-semibold text-foreground mb-6">
        Ürünler ({business.productCount})
      </h2>

      {business.products.length === 0 ? (
        <p className="text-foreground/60">
          Bu esnaf henüz ürün eklememiş.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {business.products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: TypeScript kontrolü**

```bash
npx tsc --noEmit
```

Beklenen: hata yok.

- [ ] **Step 3: Dev server'da doğrula**

Backend çalışıyorsa `http://localhost:3000/businesses/{geçerli-id}` adresi:
- Esnaf adı, şehir, telefon görünüyor
- Ürün kartları grid'de listeleniyor
- `available: false` ürünler grayed-out + "Tükendi" badge

Geçersiz ID için `http://localhost:3000/businesses/00000000-0000-0000-0000-000000000000`:
- Next.js 404 sayfasına yönlendiriyor

- [ ] **Step 4: Commit**

```bash
git add src/app/businesses/
git commit -m "feat: add business profile page with SSR and generateMetadata"
```

---

## Task 11: Profil Sayfası Loading & Error Sınırları

**Files:**
- Create: `src/app/businesses/[id]/loading.tsx`
- Create: `src/app/businesses/[id]/error.tsx`

- [ ] **Step 1: loading.tsx oluştur**

```tsx
export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10 space-y-3">
        <div className="h-9 bg-muted rounded animate-pulse w-64" />
        <div className="h-4 bg-muted rounded animate-pulse w-full max-w-lg" />
        <div className="h-4 bg-muted rounded animate-pulse w-48" />
      </div>
      <div className="h-6 bg-muted rounded animate-pulse w-32 mb-6" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl bg-surface border border-muted overflow-hidden"
          >
            <div className="h-40 bg-muted animate-pulse" />
            <div className="p-4 space-y-2">
              <div className="h-5 bg-muted rounded animate-pulse w-3/4" />
              <div className="h-4 bg-muted rounded animate-pulse w-full" />
              <div className="h-4 bg-muted rounded animate-pulse w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: error.tsx oluştur**

```tsx
'use client'

import Link from 'next/link'

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <h2 className="font-heading text-2xl font-bold text-foreground mb-3">
        Esnaf bulunamadı
      </h2>
      <p className="text-foreground/60 mb-6">
        Bu esnaf mevcut değil ya da yüklenirken bir hata oluştu.
      </p>
      <div className="flex gap-4">
        <Link
          href="/"
          className="bg-accent text-white px-6 py-2 rounded-lg hover:bg-accent/90 transition-colors"
        >
          Ana Sayfaya Dön
        </Link>
        <button
          onClick={reset}
          className="border border-muted text-foreground/70 px-6 py-2 rounded-lg hover:border-accent hover:text-foreground transition-colors"
        >
          Tekrar Dene
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: TypeScript kontrolü**

```bash
npx tsc --noEmit
```

Beklenen: hata yok.

- [ ] **Step 4: Commit**

```bash
git add src/app/businesses/[id]/loading.tsx src/app/businesses/[id]/error.tsx
git commit -m "feat: add business profile loading skeleton and error boundary"
```

---

## Task 12: Header Güncellemesi

**Files:**
- Modify: `src/components/shared/Header.tsx`

- [ ] **Step 1: Header'ı güncelle**

`src/components/shared/Header.tsx` dosyasını tamamen şu içerikle değiştir:

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

const AUTH_ROUTES = ['/login', '/register']

export default function Header() {
  const { isAuthenticated, logout, user } = useAuth()
  const pathname = usePathname()

  if (AUTH_ROUTES.includes(pathname)) return null

  return (
    <header className="sticky top-0 z-50 bg-primary border-b border-muted">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="font-heading text-xl font-bold text-accent">
          KomsuConnect
        </Link>
        <nav className="flex items-center gap-4">
          <Link
            href="/"
            className="text-sm text-foreground/70 hover:text-foreground transition-colors"
          >
            Esnafları Keşfet
          </Link>
          {isAuthenticated && user?.accountType === 'BUSINESS' && (
            <Link
              href="/dashboard"
              className="text-sm text-foreground/70 hover:text-foreground transition-colors"
            >
              Panel
            </Link>
          )}
          {isAuthenticated ? (
            <button
              onClick={logout}
              className="text-sm text-foreground/70 hover:text-foreground transition-colors"
            >
              Çıkış Yap
            </button>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm text-foreground/70 hover:text-foreground transition-colors"
              >
                Giriş Yap
              </Link>
              <Link
                href="/register"
                className="text-sm bg-accent text-white px-4 py-2 rounded-lg hover:bg-accent/90 transition-colors"
              >
                Kayıt Ol
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
```

- [ ] **Step 2: TypeScript kontrolü**

```bash
npx tsc --noEmit
```

Beklenen: hata yok.

- [ ] **Step 3: Dev server'da doğrula**

- Giriş yapmamış kullanıcı: `[KomsuConnect] [Esnafları Keşfet] [Giriş Yap] [Kayıt Ol]`
- Giriş yapmış BUSINESS kullanıcı: `[KomsuConnect] [Esnafları Keşfet] [Panel] [Çıkış Yap]`
- Giriş yapmış non-BUSINESS kullanıcı: `[KomsuConnect] [Esnafları Keşfet] [Çıkış Yap]`
- `/login` ve `/register` sayfalarında header gizli

- [ ] **Step 4: Final TypeScript kontrolü**

```bash
npx tsc --noEmit
```

Beklenen: sıfır hata.

- [ ] **Step 5: Commit**

```bash
git add src/components/shared/Header.tsx
git commit -m "feat: add discovery and dashboard links to header"
```

---

## Self-Review Notları

**Spec coverage:**
- [x] 21st.dev MCP → mevcut `Card` bileşeni kullanıldı (yeniden aranmadı; sprint spec'te "21st.dev'den card, filter ve grid ara" diyor ama mevcut `src/components/ui/card.tsx` zaten kurulu)
- [x] Ana sayfa: şehir dropdown, esnaf grid, boş durum, loading skeleton
- [x] Esnaf profil: isim, açıklama, adres, şehir, telefon, ürün grid
- [x] Ürün kartı: isim, açıklama, fiyat, müsaitlik durumu (grayed-out)
- [x] SSR + generateMetadata
- [x] Header: Esnafları Keşfet linki
- [x] Public route: home page ve businesses/[id] auth gerektirmiyor

**Kapsam notu:** Sprint görevinde "21st.dev Magic MCP'den card, filter ve grid komponentleri ara" denildi. Ancak `src/components/ui/card.tsx` zaten mevcut ve proje standartlarına uygun. `CityFilter` için 21st.dev'de arama yapılabilir ama custom `<select>` dropdown yeterli — ek dependency gerektirmiyor. Uygulama ajanı 21st.dev'de arama yapmayı tercih ederse Task 7 öncesinde yapabilir.
