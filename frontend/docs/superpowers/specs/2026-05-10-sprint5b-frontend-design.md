# Sprint 5b Frontend Design

## Overview

Sprint 5b frontend görevleri: çift başlık bug'ı, kategori ikonları, yeni profil alanları ve esnaf profil sayfası güncellemeleri.

---

## 1. Çift "Ürünlerim" Başlığı Bug'ı

**Sorun:** `dashboard/products/page.tsx:30` ve `ProductTable.tsx:82`'de iki ayrı `<h1>Ürünlerim</h1>` render ediliyor.

**Çözüm:** `products/page.tsx`'teki `<h1>` kaldırılır. Başlık ve ürün sayısı zaten `ProductTable` içinde render ediliyor.

**Etkilenen dosya:** `src/app/dashboard/products/page.tsx`

---

## 2. Ana Sayfa — Kategori İkonları

### Mimari

Her iki filtre de `useSearchParams()` kullanarak mevcut URL'deki parametreleri okur ve sadece kendi parametresini günceller. Bu sayede `?city=Istanbul&category=CAFE` gibi kombine filtreler çalışır.

### Yeni / Güncellenen Dosyalar

| Dosya | Değişiklik |
|---|---|
| `src/constants/categories.ts` | Sabit liste: enum → Türkçe etiket + lucide-react ikon |
| `src/components/businesses/CategoryFilter.tsx` | Yeni client component |
| `src/components/businesses/CityFilter.tsx` | `useSearchParams` ile güncelleme |
| `src/lib/businessApi.ts` | `getBusinesses(city?, category?)` |
| `src/app/page.tsx` | `searchParams.category` okunur, `CategoryFilter` eklenir |

### Kategori Listesi

| Enum | Türkçe | lucide-react İkon |
|---|---|---|
| BAKERY | Fırın | `Wheat` |
| BUTCHER | Kasap | `Beef` |
| GROCERY | Manav | `Carrot` |
| MARKET | Bakkal | `ShoppingBasket` |
| CAFE | Kahveci | `Coffee` |
| FLORIST | Çiçekçi | `Flower2` |
| HABERDASHER | Tuhafiye | `Scissors` |
| REPAIR | Tamirci | `Wrench` |
| OTHER | Diğer | `Store` |

### Layout

Kategori satırı üstte, şehir dropdown'ı altında. Aktif kategori terracotta (`#C2492C`) renkte vurgulanır. Mobilde yatay scroll.

---

## 3. Dashboard Profil Formu — Yeni Alanlar

### Tip Güncellemeleri (`src/types/business.ts`)

- `BusinessProfile`: `category?`, `neighborhood?`, `workingHours?` eklenir
- `CreateBusinessProfileRequest` / `UpdateBusinessProfileRequest`: aynı alanlar
- `BusinessPublicSummary` / `BusinessPublicDetail`: aynı alanlar

### Form Güncellemeleri (`ProfileForm.tsx`)

**Zod schema eklemeleri:**
```ts
category: z.enum(['BAKERY','BUTCHER','GROCERY','MARKET','CAFE','FLORIST','HABERDASHER','REPAIR','OTHER']).optional(),
neighborhood: z.string().max(100, 'Mahalle en fazla 100 karakter olabilir').optional(),
workingHours: z.string().max(100, 'Çalışma saatleri en fazla 100 karakter olabilir').optional(),
```

**Yeni form alanları (şehir alanının altına):**
1. Kategori — `<select>` Türkçe etiketlerle
2. Mahalle — `<Input>` placeholder: "Kadıköy, Moda"
3. Çalışma Saatleri — `<Input>` placeholder: "09:00-18:00"

**Payload:** üç alan dahil edilir.

---

## 4. Esnaf Profil Sayfası — Yeni Alan Gösterimi

`/businesses/[id]/page.tsx` — Mevcut bilgi bandına eklenir:
- Kategori: Türkçe etiketiyle (ikon `🏪`)
- Mahalle (city ile birlikte)
- Çalışma saatleri: `🕐 {workingHours}`

---

## 5. Vercel Env Variable

`.env.example` ve `.env.local` dosyalarında `NEXT_PUBLIC_API_URL` production backend URL'sine işaret ettiği doğrulanır.

---

## Değişmeyen Şeyler

- Auth akışı, Zustand store yapısı
- `ProductTable` mantığı
- Tüm mevcut API endpoint'leri
- SSR/SSG yaklaşımı (ana sayfa ve profil sayfası Server Component olarak kalır)
