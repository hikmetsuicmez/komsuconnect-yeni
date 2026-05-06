# Sprint 2 Frontend Dashboard — Tasarım Dokümanı

**Tarih:** 2026-05-07  
**Branch:** sprint/2-business-panel  
**Kapsam:** Esnaf dashboard sayfası, profil CRUD, ürün CRUD

---

## 1. Bağlam

Sprint 1'de auth akışı (login/register) tamamlandı. Sprint 2'de esnafların kendi profillerini yönetebileceği ve ürünlerini listeleyip düzenleyebileceği bir dashboard inşa ediliyor.

Backend endpoint'leri hazır:
- `GET /api/v1/businesses/me` → Giriş yapmış esnafın profili
- `POST /api/v1/businesses` → Profil oluştur
- `PUT /api/v1/businesses/{id}` → Profil güncelle
- `GET /api/v1/businesses/{businessId}/products` → Ürün listesi
- `POST /api/v1/businesses/{businessId}/products` → Ürün ekle
- `PUT /api/v1/businesses/{businessId}/products/{productId}` → Ürün güncelle
- `DELETE /api/v1/businesses/{businessId}/products/{productId}` → Ürün sil

---

## 2. Mimari: Nested Routes + React Context

Seçilen yaklaşım: **Next.js App Router nested routes + BusinessContext**.

Gerekçe: URL her zaman aktif sekmeyi yansıtır, Sprint 3'te yeni sekmeler eklemek yalnızca yeni route + Sidebar item gerektirir, context sayesinde profil verisi tüm alt sayfalarda paylaşılır.

```
src/
├── app/
│   └── dashboard/
│       ├── layout.tsx          ← BusinessProvider + Sidebar + auth guard
│       ├── page.tsx            ← redirect → /dashboard/profile
│       ├── profile/
│       │   └── page.tsx        ← profil formu
│       └── products/
│           └── page.tsx        ← ürün tablosu + modal
├── components/
│   └── dashboard/
│       ├── Sidebar.tsx
│       ├── ProfileForm.tsx
│       ├── ProductTable.tsx
│       └── ProductModal.tsx
├── context/
│   └── BusinessContext.tsx
├── hooks/
│   └── useBusiness.ts
├── store/
│   └── authStore.ts            ← persist middleware eklenir
└── types/
    └── business.ts
```

---

## 3. TypeScript Tipleri (`src/types/business.ts`)

```typescript
export interface BusinessProfile {
  id: string
  userId: string
  businessName: string
  description: string | null
  address: string | null
  city: string | null
  phone: string | null
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
}

export type UpdateBusinessProfileRequest = CreateBusinessProfileRequest

export interface CreateProductRequest {
  name: string
  description?: string
  price: number
  imageUrl?: string
  available: boolean
}

export type UpdateProductRequest = CreateProductRequest
```

---

## 4. BusinessContext (`src/context/BusinessContext.tsx`)

```typescript
interface BusinessContextValue {
  profile: BusinessProfile | null
  hasProfile: boolean
  isLoading: boolean
  error: string | null
  refreshProfile: () => Promise<void>
}
```

**Davranış:**
- `dashboard/layout.tsx` mount'unda `GET /api/v1/businesses/me` çağrılır
- 200 → `profile` dolu, `hasProfile: true`
- 404 → `profile: null`, `hasProfile: false`
- Diğer hatalar → `error` state'e yazılır
- `refreshProfile()` — profil POST/PUT sonrası context'i yeniler

---

## 5. Auth Persist (`src/store/authStore.ts`)

Zustand `persist` middleware eklenir:

```typescript
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({ /* mevcut state */ }),
    { name: 'komsuconnect-auth' }
  )
)
```

localStorage key: `komsuconnect-auth`. Token ve user bilgisi sayfa yenilemesinden sonra da korunur.

**Teknik borç:** Sprint 3'te `POST /api/v1/auth/me` endpoint'i ile token sunucu tarafında doğrulanacak ve localStorage yerine httpOnly cookie'ye geçilecek. (Bakınız: `CLAUDE.md` → Teknik Borçlar)

---

## 6. UI Komponentleri

### Sidebar (`src/components/dashboard/Sidebar.tsx`)

- `usePathname()` ile aktif route vurgulanır (accent rengi + sol border)
- Nav itemlar: **Profil**, **Ürünlerim**
- `hasProfile: false` → Ürünlerim `opacity-40 pointer-events-none`, `title="Önce profilinizi kaydedin"`
- Mobile: `hidden md:flex` (Sprint 3'te hamburger menüye dönüştürülecek)

### ProfileForm (`src/components/dashboard/ProfileForm.tsx`)

- React Hook Form + Zod, Türkçe hata mesajları
- Alanlar: İşletme Adı (required), Açıklama (textarea), Adres, Şehir, Telefon
- `hasProfile` false → `POST /api/v1/businesses`
- `hasProfile` true → `PUT /api/v1/businesses/{id}`
- Başarı → `refreshProfile()` çağrısı

Zod şeması:
```typescript
z.object({
  businessName: z.string().min(1, 'İşletme adı zorunludur'),
  description:  z.string().optional(),
  address:      z.string().max(255).optional(),
  city:         z.string().max(100).optional(),
  phone:        z.string().min(7).max(20).optional().or(z.literal('')),
})
```

### ProductTable (`src/components/dashboard/ProductTable.tsx`)

- Mount'ta `GET /api/v1/businesses/{businessId}/products`
- Sütunlar: Ürün Adı | Fiyat | Durum (badge) | Aksiyonlar (Düzenle / Sil)
- Boş durum: "Henüz ürün eklenmedi"
- Silme: `window.confirm` + `DELETE` endpoint
- Sağ üstte "Yeni Ürün Ekle" butonu

### ProductModal (`src/components/dashboard/ProductModal.tsx`)

- `product?: Product` prop'u: undefined → yeni ürün, dolu → düzenleme
- Alanlar: Ürün Adı (required), Açıklama, Fiyat (required, > 0), Müsait mi (checkbox)
- imageUrl bu sprint kapsamı dışında
- ESC ve backdrop click → kapatır
- Başarı → `onSuccess()` callback → tablo yenilenir

Zod şeması:
```typescript
z.object({
  name:        z.string().min(1, 'Ürün adı zorunludur'),
  description: z.string().optional(),
  price:       z.number({ invalid_type_error: 'Fiyat zorunludur' })
                .min(0.01, 'Fiyat 0\'dan büyük olmalıdır'),
  available:   z.boolean(),
})
```

---

## 7. Sayfalar & Routing

### `dashboard/layout.tsx`

1. Auth guard: `isAuthenticated` + `BUSINESS` rol kontrolü
2. `BusinessProvider` ile children'ı sarar
3. Sidebar (sol, 240px) + main content (sağ, flex-1) layout'u render eder

```
┌────────────────────────────────────────────┐
│  Header (global)                           │
├──────────────┬─────────────────────────────┤
│   Sidebar    │   <children />              │
│   (240px)    │   (flex-1, p-8)             │
└──────────────┴─────────────────────────────┘
```

### `dashboard/page.tsx`

```typescript
import { redirect } from 'next/navigation'
export default function DashboardPage() {
  redirect('/dashboard/profile')
}
```

### `dashboard/profile/page.tsx`

- `useBusiness()` → `{ profile, isLoading }`
- `isLoading` → spinner
- `ProfileForm`'a `profile` prop'u geçer

### `dashboard/products/page.tsx`

- `useBusiness()` → `{ profile, hasProfile, isLoading }`
- `isLoading` sonrası `hasProfile: false` → `redirect('/dashboard/profile')`
- `ProductTable`'a `businessId={profile.id}` geçer

---

## 8. Hata Yönetimi

| Senaryo | Davranış |
|---|---|
| `/me` 404 | `hasProfile: false`, Profil sekmesi açılır |
| `/me` 401 | `authStore.logout()` + `/login` (mevcut interceptor) |
| `/me` 5xx | `error` state, sayfada Türkçe hata mesajı |
| Profil kaydetme hatası | Form altında Türkçe sunucu hatası |
| Ürün silme hatası | `alert()` ile Türkçe hata mesajı |
| Ürün CRUD 403/404 | Modal'da Türkçe hata mesajı |

---

## 9. Kapsam Dışı (Bu Sprint)

- imageUrl upload UI
- Sidebar mobile hamburger menü
- Ürün tablosunda pagination
- Optimistic updates
- `/auth/me` endpoint entegrasyonu (Sprint 3)

---

## 10. Definition of Done

- [ ] `authStore` persist çalışıyor, sayfa yenilemede oturum korunuyor
- [ ] Dashboard layout sidebar + nested routes doğru çalışıyor
- [ ] Profil yoksa: Profil formu boş açılıyor, POST ile kaydediliyor
- [ ] Profil varsa: Form dolu açılıyor, PUT ile güncelleniyor
- [ ] Ürünlerim sekmesi profil kaydedilince aktif oluyor
- [ ] Ürün ekleme/düzenleme/silme çalışıyor
- [ ] Tüm hatalar Türkçe mesajla gösteriliyor
- [ ] BUSINESS dışı kullanıcılar dashboard'a erişemiyor
