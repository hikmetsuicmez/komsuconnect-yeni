# Sprint 3 — Kullanıcı Keşif Frontend Tasarımı

**Tarih:** 2026-05-08  
**Branch:** sprint/3-user-discovery  
**Durum:** Onaylandı

---

## Kapsam

Sprint 3 frontend görevleri: ana sayfa esnaf keşif ekranı, esnaf profil sayfası, header güncellemesi ve public route erişimi.

---

## Mimari Kararlar

### Veri Fetching Yaklaşımı
**Yaklaşım 1 — Tam Server Component + Client Island** seçildi.

- `app/page.tsx` ve `app/businesses/[id]/page.tsx` async Server Component olarak kalır
- Sadece şehir filtresi dropdown'u `"use client"` olan `CityFilter` bileşenine ayrılır
- Şehir filtresi URL query param (`?city=istanbul`) olarak çalışır; dropdown değişince `router.push` tetiklenir
- Server Component'lerde native `fetch` + `revalidate` kullanılır (Axios değil, token gerekmez)
- Public endpoint'ler: `GET /api/v1/businesses`, `GET /api/v1/businesses/cities`, `GET /api/v1/businesses/{id}`

### Dizin Yapısı
Düz yapı — `(main)` route grubu kullanılmaz.

```
src/
├── app/
│   ├── page.tsx                        ← async Server Component (güncellenir)
│   ├── loading.tsx                     ← Ana sayfa skeleton (yeni)
│   ├── error.tsx                       ← Global error boundary (yeni)
│   └── businesses/
│       └── [id]/
│           ├── page.tsx                ← async Server Component (yeni)
│           ├── loading.tsx             ← Profil sayfası skeleton (yeni)
│           └── error.tsx              ← Profil sayfası error boundary (yeni)
├── components/
│   ├── shared/
│   │   └── Header.tsx                  ← "Esnafları Keşfet" + "Panel" linkleri eklenir
│   └── businesses/
│       ├── CityFilter.tsx              ← "use client" — dropdown + router.push
│       ├── BusinessCard.tsx            ← Esnaf özet kartı
│       ├── BusinessGrid.tsx            ← Grid wrapper + boş durum
│       └── ProductCard.tsx            ← Ürün kartı (available grayed-out)
├── types/
│   └── business.ts                     ← Public tip tanımları eklenir
└── lib/
    └── businessApi.ts                  ← Server-side fetch fonksiyonları (yeni)
```

---

## Tip Tanımları (`src/types/business.ts` — eklenenler)

```typescript
export interface BusinessPublicSummary {
  id: string
  businessName: string
  description: string | null
  city: string | null
  productCount: number
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

export interface ProductPublic {
  id: string
  name: string
  description: string | null
  price: number
  imageUrl: string | null
  available: boolean
}
```

---

## Server-Side Fetch (`src/lib/businessApi.ts`)

```typescript
const BASE = `${process.env.NEXT_PUBLIC_API_URL}/api/v1`

export async function getBusinesses(city?: string): Promise<BusinessPublicSummary[]>
// GET /api/v1/businesses?city={city} veya GET /api/v1/businesses
// revalidate: 60 saniye
// Hata durumunda boş dizi döner

export async function getCities(): Promise<string[]>
// GET /api/v1/businesses/cities
// revalidate: 300 saniye
// Hata durumunda boş dizi döner

export async function getBusinessById(id: string): Promise<BusinessPublicDetail>
// GET /api/v1/businesses/{id}
// revalidate: 30 saniye
// Hata durumunda notFound() fırlatır
```

---

## Bileşenler

### `CityFilter.tsx` (Client Component)
- `cities: string[]` ve `selectedCity: string | undefined` prop alır
- `<select>` dropdown; ilk seçenek "Tüm Şehirler" (değer: `""`)
- `onChange` → `router.push('/?city=value')` veya `router.push('/')`
- `useSearchParams` ile mevcut seçimi gösterir

### `BusinessCard.tsx`
- `BusinessPublicSummary` prop alır
- `bg-surface border-muted rounded-xl` kart
- İşletme adı: `font-heading font-bold`
- Şehir + ürün sayısı: `text-foreground/60 text-sm`
- "İncele" butonu: `bg-accent` → `href="/businesses/{id}"`

### `BusinessGrid.tsx`
- `businesses: BusinessPublicSummary[]` prop alır
- `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6`
- Boş durum: "Bu şehirde henüz esnaf bulunmuyor" + "Tümünü Gör" butonu (şehir seçiliyse)
- Hiç esnaf yoksa: "Henüz kayıtlı esnaf yok"

### `ProductCard.tsx`
- `ProductPublic` prop alır
- `available: false` → `opacity-50` + "Tükendi" badge
- Fiyat: `₺{price}` formatında
- `imageUrl` varsa `next/image`, yoksa `bg-muted` placeholder blok

---

## Sayfalar

### Ana Sayfa (`app/page.tsx`)
```tsx
export const revalidate = 60

export async function generateMetadata() {
  return { title: 'KomsuConnect — Esnafları Keşfet' }
}

export default async function Home({ searchParams }) {
  const city = searchParams?.city
  const [businesses, cities] = await Promise.all([getBusinesses(city), getCities()])
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <HeroSection />
      <CityFilter cities={cities} selectedCity={city} />
      <BusinessGrid businesses={businesses} />
    </div>
  )
}
```

### Esnaf Profil Sayfası (`app/businesses/[id]/page.tsx`)
```tsx
export const revalidate = 30

export async function generateMetadata({ params }) {
  const business = await getBusinessById(params.id)
  return {
    title: `${business.businessName} — KomsuConnect`,
    description: business.description ?? `${business.businessName} ürünlerini keşfet`,
  }
}

export default async function BusinessPage({ params }) {
  const business = await getBusinessById(params.id)
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <BusinessHeader business={business} />
      <ProductGrid products={business.products} />
    </div>
  )
}
```
- `ProductGrid`: `available: false` ürünler listenin sonuna taşınmaz, sıra korunur; sadece görsel olarak grayed-out

### Loading Skeletons
- `app/loading.tsx`: 6 adet kart şeklinde `animate-pulse` blok
- `app/businesses/[id]/loading.tsx`: başlık + 4 ürün kartı şeklinde pulse

### Error Boundaries
- `app/error.tsx` ve `app/businesses/[id]/error.tsx`: `"use client"` — "Bir şeyler yanlış gitti" mesajı + "Yenile" butonu

---

## Header Güncellemesi

Nav sırası (her zaman görünür): `[Esnafları Keşfet]`  
Koşullu: `isAuthenticated && user?.accountType === 'BUSINESS'` → `[Panel]` linki  
Auth butonları: mevcut haliyle korunur

---

## Hata & Edge Case Tablosu

| Durum | Davranış |
|---|---|
| Şehir seçili, esnaf yok | Boş durum + "Tümünü Gör" butonu |
| Hiç esnaf yok | "Henüz kayıtlı esnaf yok" |
| Esnafın ürünü yok | "Bu esnaf henüz ürün eklememiş" |
| Geçersiz business ID | `notFound()` → 404 |
| `available: false` ürün | `opacity-50` + "Tükendi" badge |
| `imageUrl: null` | `bg-muted` renk bloğu placeholder |
| `city` query param geçersiz | Boş liste + boş durum mesajı |

---

## Auth & Route Koruması

- `app/page.tsx`, `app/businesses/[id]/page.tsx` → auth kontrolü yok, tamamen public
- `app/dashboard/layout.tsx` → mevcut haliyle korunur, dokunulmaz
- API endpoint'leri public, server-side fetch'te token gönderilmez

---

## Kapsam Dışı

- Kullanıcı hesabı türüne göre farklı ana sayfa
- Harita tabanlı konum filtreleme
- Esnaf arama (text search)
- Favori esnaf kaydetme
- httpOnly cookie'ye geçiş (teknik borç, Sprint 4)
