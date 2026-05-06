# Sprint 2 Frontend Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the esnaf (business) dashboard with sidebar navigation, profile CRUD, and product CRUD using nested Next.js App Router routes and a shared BusinessContext.

**Architecture:** Nested routes (`/dashboard/profile`, `/dashboard/products`) share business profile state via `BusinessContext` provided in `dashboard/layout.tsx`. The layout handles auth guard + sidebar layout. Profile form is smart (POST when no profile exists, PUT when updating). Products tab is locked until profile is saved.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, Tailwind CSS, Zustand v5 + persist, React Hook Form, Zod v4, Axios, Lucide React, 21st.dev Magic MCP

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| CREATE | `src/types/business.ts` | BusinessProfile, Product, request/response types |
| MODIFY | `src/store/authStore.ts` | Add Zustand persist middleware |
| CREATE | `src/context/BusinessContext.tsx` | Fetch + share profile state, refreshProfile action |
| CREATE | `src/hooks/useBusiness.ts` | Convenience hook for BusinessContext |
| CREATE | `src/components/ui/dialog.tsx` | 21st.dev'den alınan modal/dialog primitive'i (Task 9'da oluşturulur) |
| CREATE | `src/components/dashboard/Sidebar.tsx` | Left nav, 21st.dev ilhamıyla, disables Ürünlerim when no profile |
| MODIFY | `src/app/dashboard/layout.tsx` | Add BusinessProvider + sidebar layout |
| MODIFY | `src/app/dashboard/page.tsx` | Redirect to /dashboard/profile |
| CREATE | `src/components/dashboard/ProfileForm.tsx` | Profile create/update form (RHF + Zod) |
| CREATE | `src/app/dashboard/profile/page.tsx` | Profile tab page |
| CREATE | `src/components/dashboard/ProductModal.tsx` | Add/edit product modal, dialog.tsx kullanır |
| CREATE | `src/components/dashboard/ProductTable.tsx` | Product list with edit/delete actions |
| CREATE | `src/app/dashboard/products/page.tsx` | Products tab page |

---

## Task 1: TypeScript Business Types

**Files:**
- Create: `src/types/business.ts`

- [ ] **Step 1: Create the types file**

```typescript
// src/types/business.ts
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

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npm run build
```

Expected: No type errors related to business.ts (other pre-existing errors are acceptable at this stage).

- [ ] **Step 3: Commit**

```bash
git add src/types/business.ts
git commit -m "feat: add TypeScript types for BusinessProfile and Product"
```

---

## Task 2: Auth Store Persist Middleware

**Files:**
- Modify: `src/store/authStore.ts`

**Context:** Zustand v5. The current store uses the non-curried form `create<State>(set => ...)`. Adding `persist` requires the curried form `create<State>()(persist(...))`.

- [ ] **Step 1: Update authStore.ts with persist middleware**

Replace the entire file content:

```typescript
// src/store/authStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types/auth'

interface AuthState {
  token: string | null
  user: User | null
  isAuthenticated: boolean
  login: (token: string, user: User) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      login: (token, user) => set({ token, user, isAuthenticated: true }),
      logout: () => set({ token: null, user: null, isAuthenticated: false }),
    }),
    { name: 'komsuconnect-auth' }
  )
)
```

- [ ] **Step 2: Verify build passes**

```bash
npm run build
```

Expected: No new TypeScript errors.

- [ ] **Step 3: Manual verification**

Start the dev server (`npm run dev`), log in as a BUSINESS user, refresh the page — session should be preserved (no redirect to login).

- [ ] **Step 4: Commit**

```bash
git add src/store/authStore.ts
git commit -m "feat: add Zustand persist middleware for auth session persistence"
```

---

## Task 3: BusinessContext + useBusiness Hook

**Files:**
- Create: `src/context/BusinessContext.tsx`
- Create: `src/hooks/useBusiness.ts`

- [ ] **Step 1: Create BusinessContext**

```typescript
// src/context/BusinessContext.tsx
'use client'

import { createContext, useCallback, useEffect, useState } from 'react'
import api from '@/lib/api'
import type { BusinessProfile } from '@/types/business'

interface BusinessContextValue {
  profile: BusinessProfile | null
  hasProfile: boolean
  isLoading: boolean
  error: string | null
  refreshProfile: () => Promise<void>
}

export const BusinessContext = createContext<BusinessContextValue | null>(null)

export function BusinessProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<BusinessProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProfile = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await api.get<BusinessProfile>('/api/v1/businesses/me')
      setProfile(response.data)
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } }).response?.status
      if (status === 404) {
        setProfile(null)
      } else {
        setError('Profil yüklenirken bir hata oluştu.')
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  return (
    <BusinessContext.Provider
      value={{
        profile,
        hasProfile: profile !== null,
        isLoading,
        error,
        refreshProfile: fetchProfile,
      }}
    >
      {children}
    </BusinessContext.Provider>
  )
}
```

- [ ] **Step 2: Create useBusiness hook**

```typescript
// src/hooks/useBusiness.ts
import { useContext } from 'react'
import { BusinessContext } from '@/context/BusinessContext'

export function useBusiness() {
  const context = useContext(BusinessContext)
  if (!context) {
    throw new Error('useBusiness must be used within a BusinessProvider')
  }
  return context
}
```

- [ ] **Step 3: Verify build**

```bash
npm run build
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/context/BusinessContext.tsx src/hooks/useBusiness.ts
git commit -m "feat: add BusinessContext and useBusiness hook for shared profile state"
```

---

## Task 4: Sidebar Component

**Files:**
- Create: `src/components/dashboard/Sidebar.tsx`

**21st.dev:** Before writing the sidebar, search 21st.dev for a sidebar navigation component. If a suitable one is found, add it to `src/components/ui/` and adapt it. If nothing fits the dark-mode brand (primary `#1a1a2e`, accent `#e94560`), use the fallback implementation in Step 2.

- [ ] **Step 1: Search 21st.dev for sidebar navigation inspiration**

Use the `mcp__magic__21st_magic_component_inspiration` tool:
```
query: "dashboard sidebar navigation dark"
```

Evaluate the result:
- If a component fits the brand (dark background, left-aligned nav items, active state highlight) → use `mcp__magic__21st_magic_component_builder` to adapt it to the brand colors and save to `src/components/ui/sidebar-nav.tsx`, then use it inside `Sidebar.tsx`.
- If nothing fits → proceed to Step 2 with the fallback implementation.

- [ ] **Step 2: Create Sidebar**

```typescript
// src/components/dashboard/Sidebar.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { User, Package } from 'lucide-react'
import { useBusiness } from '@/hooks/useBusiness'

const navItems = [
  { href: '/dashboard/profile', label: 'Profil', icon: User, requiresProfile: false },
  { href: '/dashboard/products', label: 'Ürünlerim', icon: Package, requiresProfile: true },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { hasProfile } = useBusiness()

  return (
    <aside className="hidden md:flex flex-col w-60 min-h-full bg-surface border-r border-muted p-4 gap-1 shrink-0">
      <p className="text-xs text-foreground/40 uppercase tracking-widest px-3 mb-2">Panel</p>
      {navItems.map(({ href, label, icon: Icon, requiresProfile }) => {
        const isActive = pathname === href
        const isDisabled = requiresProfile && !hasProfile

        if (isDisabled) {
          return (
            <span
              key={href}
              title="Önce profilinizi kaydedin"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm opacity-40 cursor-not-allowed select-none"
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </span>
          )
        }

        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              isActive
                ? 'bg-accent/10 text-accent border-l-2 border-accent pl-[10px]'
                : 'text-foreground/70 hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        )
      })}
    </aside>
  )
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard/Sidebar.tsx
git commit -m "feat: add Dashboard Sidebar with profile-gated navigation"
```

---

## Task 5: Dashboard Layout Update

**Files:**
- Modify: `src/app/dashboard/layout.tsx`

**Context:** The existing layout.tsx already has auth guard logic. We keep the guard and add: (1) BusinessProvider wrapper, (2) flex layout with Sidebar.

- [ ] **Step 1: Replace dashboard/layout.tsx**

```typescript
// src/app/dashboard/layout.tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { BusinessProvider } from '@/context/BusinessContext'
import Sidebar from '@/components/dashboard/Sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login')
      return
    }
    if (user?.accountType !== 'BUSINESS') {
      router.replace('/')
    }
  }, [isAuthenticated, user, router])

  if (!isAuthenticated || user?.accountType !== 'BUSINESS') return null

  return (
    <BusinessProvider>
      <div className="flex min-h-[calc(100vh-4rem)]">
        <Sidebar />
        <main className="flex-1 p-8 min-w-0">{children}</main>
      </div>
    </BusinessProvider>
  )
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: No errors.

- [ ] **Step 3: Manual check**

`npm run dev` → navigate to `/dashboard` as a BUSINESS user → sidebar should appear on the left.

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard/layout.tsx
git commit -m "feat: update dashboard layout with BusinessProvider and Sidebar"
```

---

## Task 6: Dashboard Redirect Page

**Files:**
- Modify: `src/app/dashboard/page.tsx`

**Context:** This is a Server Component (no `'use client'`) so `redirect` from `next/navigation` works as a server-side redirect.

- [ ] **Step 1: Replace dashboard/page.tsx**

```typescript
// src/app/dashboard/page.tsx
import { redirect } from 'next/navigation'

export default function DashboardPage() {
  redirect('/dashboard/profile')
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/page.tsx
git commit -m "feat: redirect /dashboard to /dashboard/profile"
```

---

## Task 7: ProfileForm Component

**Files:**
- Create: `src/components/dashboard/ProfileForm.tsx`

**Context:** `profile` prop is `null` when no profile exists (POST) or a `BusinessProfile` object (PUT). After save, calls `refreshProfile()` to update context and unlock the Ürünlerim tab.

- [ ] **Step 1: Create ProfileForm**

```typescript
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
import type { BusinessProfile } from '@/types/business'

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
    },
  })

  useEffect(() => {
    reset({
      businessName: profile?.businessName ?? '',
      description: profile?.description ?? '',
      address: profile?.address ?? '',
      city: profile?.city ?? '',
      phone: profile?.phone ?? '',
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

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard/ProfileForm.tsx
git commit -m "feat: add ProfileForm with smart POST/PUT and Zod validation"
```

---

## Task 8: Profile Page

**Files:**
- Create: `src/app/dashboard/profile/page.tsx`

- [ ] **Step 1: Create the directory and page**

```typescript
// src/app/dashboard/profile/page.tsx
'use client'

import { useBusiness } from '@/hooks/useBusiness'
import ProfileForm from '@/components/dashboard/ProfileForm'

export default function ProfilePage() {
  const { profile, isLoading, error } = useBusiness()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-foreground/60 animate-pulse">Yükleniyor…</div>
      </div>
    )
  }

  if (error) {
    return <p className="text-accent">{error}</p>
  }

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold mb-2">
        {profile ? 'Profilim' : 'Profilinizi Oluşturun'}
      </h1>
      <p className="text-foreground/60 mb-8">
        {profile
          ? 'İşletme bilgilerinizi güncelleyin.'
          : 'Ürün ekleyebilmek için önce işletme profilinizi doldurun.'}
      </p>
      <ProfileForm profile={profile} />
    </div>
  )
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: No errors.

- [ ] **Step 3: Manual verification**

1. `npm run dev`
2. Log in as BUSINESS user with **no existing profile** → `/dashboard/profile` → form boş açılmalı, "Profil Oluştur" butonu görünmeli
3. Formu doldurup kaydet → `POST /api/v1/businesses` çağrılmalı, başarı mesajı görünmeli, Ürünlerim sekmesi aktif olmalı
4. Sayfayı yenile → form dolu gelmeli, "Güncelle" butonu görünmeli

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard/profile/page.tsx
git commit -m "feat: add profile dashboard page with loading and error states"
```

---

## Task 9: ProductModal Component

**Files:**
- Create: `src/components/ui/dialog.tsx` (21st.dev'den — modal primitive)
- Create: `src/components/dashboard/ProductModal.tsx`

**Context:** `product` prop is `undefined` for new product (POST) or a `Product` for editing (PUT). `onSuccess` callback is called after successful save — the parent (ProductTable) uses it to refresh the list.

**Note on price input:** Price is stored as `number` in `Product` but HTML `<input type="number">` gives a string. The form uses `z.string()` with manual `parseFloat` to avoid Zod v4's `z.coerce.number()` pitfalls with empty strings.

**21st.dev:** Search for a modal/dialog component first. The found primitive goes to `src/components/ui/dialog.tsx`. ProductModal then uses it as the outer shell instead of the raw `<div className="fixed inset-0 ...">` fallback.

- [ ] **Step 1: Search 21st.dev for a modal/dialog component**

Use the `mcp__magic__21st_magic_component_inspiration` tool:
```
query: "modal dialog dark overlay"
```

Then use `mcp__magic__21st_magic_component_builder` to build and adapt to project brand colors:
- Background: `bg-surface` (`#16213e`)
- Border: `border-muted` (`#0f3460`)
- Overlay: `bg-black/60`
- Close button: `text-foreground/40 hover:text-foreground`

Save the result as `src/components/ui/dialog.tsx`. It should export at minimum:
```typescript
// Expected exports from dialog.tsx
export function Dialog({ open, onClose, children }: {
  open: boolean
  onClose: () => void
  children: React.ReactNode
})
export function DialogHeader({ children }: { children: React.ReactNode })
export function DialogTitle({ children }: { children: React.ReactNode })
export function DialogContent({ children }: { children: React.ReactNode })
```

If 21st.dev does not return a usable result, skip `dialog.tsx` and use the raw overlay `<div>` implementation in ProductModal directly (the fallback in Step 2 is self-contained and does not import from dialog.tsx).

- [ ] **Step 2: Create ProductModal**

```typescript
// src/components/dashboard/ProductModal.tsx
'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import api from '@/lib/api'
import type { Product } from '@/types/business'

const productSchema = z.object({
  name: z.string().min(1, 'Ürün adı zorunludur'),
  description: z.string().optional(),
  price: z
    .string()
    .min(1, 'Fiyat zorunludur')
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: "Fiyat 0'dan büyük olmalıdır",
    }),
  available: z.boolean(),
})

type ProductFormData = z.infer<typeof productSchema>

interface ProductModalProps {
  businessId: string
  product?: Product
  onClose: () => void
  onSuccess: () => void
}

export default function ProductModal({
  businessId,
  product,
  onClose,
  onSuccess,
}: ProductModalProps) {
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product?.name ?? '',
      description: product?.description ?? '',
      price: product?.price?.toString() ?? '',
      available: product?.available ?? true,
    },
  })

  useEffect(() => {
    reset({
      name: product?.name ?? '',
      description: product?.description ?? '',
      price: product?.price?.toString() ?? '',
      available: product?.available ?? true,
    })
  }, [product, reset])

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose])

  const onSubmit = async (data: ProductFormData) => {
    setServerError(null)
    const payload = {
      name: data.name,
      ...(data.description && { description: data.description }),
      price: parseFloat(data.price),
      available: data.available,
    }
    try {
      if (product) {
        await api.put(
          `/api/v1/businesses/${businessId}/products/${product.id}`,
          payload
        )
      } else {
        await api.post(`/api/v1/businesses/${businessId}/products`, payload)
      }
      onSuccess()
    } catch {
      setServerError('Ürün kaydedilirken bir hata oluştu. Lütfen tekrar deneyin.')
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-surface border border-muted rounded-xl p-6 w-full max-w-md mx-4 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading text-xl font-bold">
            {product ? 'Ürünü Düzenle' : 'Yeni Ürün Ekle'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-foreground/40 hover:text-foreground transition-colors"
            aria-label="Kapat"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="prod-name">Ürün Adı *</Label>
            <Input
              id="prod-name"
              {...register('name')}
              placeholder="Örn: Tam Buğday Ekmeği"
            />
            {errors.name && (
              <p className="text-xs text-accent">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="prod-description">Açıklama</Label>
            <textarea
              id="prod-description"
              {...register('description')}
              placeholder="Ürün hakkında kısa bilgi"
              rows={2}
              className="w-full rounded-lg border border-muted bg-primary px-3 py-2 text-sm text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-1 focus:ring-accent resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="prod-price">Fiyat (₺) *</Label>
            <Input
              id="prod-price"
              type="number"
              step="0.01"
              min="0.01"
              {...register('price')}
              placeholder="0.00"
            />
            {errors.price && (
              <p className="text-xs text-accent">{errors.price.message}</p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <input
              id="prod-available"
              type="checkbox"
              {...register('available')}
              className="h-4 w-4 accent-accent rounded"
            />
            <Label htmlFor="prod-available">Müsait</Label>
          </div>

          {serverError && <p className="text-sm text-accent">{serverError}</p>}

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? 'Kaydediliyor…' : product ? 'Güncelle' : 'Ekle'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              İptal
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard/ProductModal.tsx
git commit -m "feat: add ProductModal for creating and editing products"
```

---

## Task 10: ProductTable Component

**Files:**
- Create: `src/components/dashboard/ProductTable.tsx`

**Context:** Fetches products on mount using `businessId` from props. Manages modal open/close state and which product is being edited. After add/edit/delete, refetches the list.

- [ ] **Step 1: Create ProductTable**

```typescript
// src/components/dashboard/ProductTable.tsx
'use client'

import { useCallback, useEffect, useState } from 'react'
import { Pencil, Trash2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import api from '@/lib/api'
import type { Product } from '@/types/business'
import ProductModal from './ProductModal'

interface ProductTableProps {
  businessId: string
}

export default function ProductTable({ businessId }: ProductTableProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined)

  const fetchProducts = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await api.get<Product[]>(
        `/api/v1/businesses/${businessId}/products`
      )
      setProducts(response.data)
    } catch {
      setError('Ürünler yüklenirken bir hata oluştu.')
    } finally {
      setIsLoading(false)
    }
  }, [businessId])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const handleDelete = async (product: Product) => {
    if (!window.confirm(`"${product.name}" ürününü silmek istediğinizden emin misiniz?`)) return
    try {
      await api.delete(`/api/v1/businesses/${businessId}/products/${product.id}`)
      await fetchProducts()
    } catch {
      alert('Ürün silinirken bir hata oluştu. Lütfen tekrar deneyin.')
    }
  }

  const openAddModal = () => {
    setEditingProduct(undefined)
    setModalOpen(true)
  }

  const openEditModal = (product: Product) => {
    setEditingProduct(product)
    setModalOpen(true)
  }

  const handleModalSuccess = () => {
    setModalOpen(false)
    fetchProducts()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-foreground/60 animate-pulse">Yükleniyor…</div>
      </div>
    )
  }

  if (error) {
    return <p className="text-accent">{error}</p>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-3xl font-bold">Ürünlerim</h1>
          <p className="text-foreground/60 mt-1">
            {products.length} ürün
          </p>
        </div>
        <Button onClick={openAddModal} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Yeni Ürün Ekle
        </Button>
      </div>

      {products.length === 0 ? (
        <div className="rounded-xl border border-muted bg-surface p-12 text-center">
          <p className="text-foreground/60 mb-4">Henüz ürün eklenmedi.</p>
          <Button onClick={openAddModal} variant="outline">
            İlk ürününü ekle
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border border-muted overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-muted bg-muted/30">
                <th className="text-left px-4 py-3 text-foreground/60 font-medium">
                  Ürün Adı
                </th>
                <th className="text-left px-4 py-3 text-foreground/60 font-medium">
                  Fiyat
                </th>
                <th className="text-left px-4 py-3 text-foreground/60 font-medium">
                  Durum
                </th>
                <th className="text-right px-4 py-3 text-foreground/60 font-medium">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody>
              {products.map((product, index) => (
                <tr
                  key={product.id}
                  className={`border-b border-muted last:border-0 ${
                    index % 2 === 0 ? 'bg-surface' : 'bg-surface/60'
                  }`}
                >
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-foreground">{product.name}</p>
                      {product.description && (
                        <p className="text-foreground/50 text-xs mt-0.5 line-clamp-1">
                          {product.description}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-foreground/80">
                    ₺{product.price.toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        product.available
                          ? 'bg-green-500/10 text-green-400'
                          : 'bg-foreground/10 text-foreground/50'
                      }`}
                    >
                      {product.available ? 'Müsait' : 'Tükendi'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(product)}
                        className="p-1.5 text-foreground/40 hover:text-foreground transition-colors rounded"
                        aria-label="Düzenle"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(product)}
                        className="p-1.5 text-foreground/40 hover:text-accent transition-colors rounded"
                        aria-label="Sil"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <ProductModal
          businessId={businessId}
          product={editingProduct}
          onClose={() => setModalOpen(false)}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard/ProductTable.tsx
git commit -m "feat: add ProductTable with inline edit/delete and empty state"
```

---

## Task 11: Products Page

**Files:**
- Create: `src/app/dashboard/products/page.tsx`

**Context:** Reads `hasProfile` from context. After `isLoading` resolves to false, if `hasProfile` is still false, redirects to profile page. This prevents direct URL access to `/dashboard/products` before profile creation.

- [ ] **Step 1: Create the directory and page**

```typescript
// src/app/dashboard/products/page.tsx
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

  return <ProductTable businessId={profile.id} />
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: Successful build with no type errors.

- [ ] **Step 3: Full manual test of the products flow**

1. `npm run dev`
2. Log in as BUSINESS user with an existing profile
3. Click "Ürünlerim" in sidebar → product list renders
4. Click "Yeni Ürün Ekle" → modal açılır
5. Boş form submit → validasyon hataları Türkçe görünür
6. Geçerli bilgi gir (ad, fiyat > 0, müsait seç) → "Ekle" → modal kapanır, ürün listede görünür
7. Ürünün Düzenle butonuna tıkla → modal açılır, alanlar dolu gelir → değiştir → "Güncelle" → listede güncellenir
8. Ürünün Sil butonuna tıkla → confirm dialog → Tamam → ürün listeden kalkar
9. Sidebar'da "Ürünlerim" aktif, "Profil"e tıkla → profil sayfası açılır

- [ ] **Step 4: Test profile-lock behavior**

1. Log in as BUSINESS user with **no existing profile**
2. URL'e manuel `/dashboard/products` yaz → `/dashboard/profile`'e yönlenmeli
3. Profil oluştur → "Ürünlerim" sekmesi aktif hale gelmeli

- [ ] **Step 5: Commit**

```bash
git add src/app/dashboard/products/page.tsx
git commit -m "feat: add products dashboard page with profile-guard redirect"
```

---

## Task 12: Final Integration Check

- [ ] **Step 1: Full build verification**

```bash
npm run build
```

Expected: `✓ Compiled successfully` with no errors or type issues.

- [ ] **Step 2: End-to-end manual walkthrough**

1. Open the app as a logged-out user → go to `/dashboard` → redirect to `/login`
2. Log in as USER (non-business) → redirect to `/` (no dashboard access)
3. Log in as BUSINESS user (no profile) → `/dashboard/profile` → form boş, "Profil Oluştur" butonu
4. Profil doldur ve kaydet → başarı mesajı, "Ürünlerim" sekmesi aktif
5. Sayfayı yenile → oturum korunuyor (persist), profil dolu geliyor
6. Ürün ekle, düzenle, sil → tüm akışlar çalışıyor
7. Sidebar "Profil" ve "Ürünlerim" aktif geçiş yapıyor, URL değişiyor

- [ ] **Step 3: Final commit (if any outstanding changes)**

```bash
git add -p
git commit -m "feat: complete sprint 2 esnaf dashboard with profile and product CRUD"
```

---

## Kapsam Dışı (Bu Sprint)

- imageUrl upload UI
- Sidebar mobile hamburger menü
- Ürün tablosunda pagination
- Optimistic updates
- `/auth/me` endpoint entegrasyonu (Sprint 3 teknik borcu)
