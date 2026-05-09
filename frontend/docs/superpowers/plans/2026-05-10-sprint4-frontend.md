# Sprint 4 Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace localStorage token persistence with httpOnly cookie-based session, add imageUrl support to ProductModal, and prepare the project for Vercel deployment.

**Architecture:** SessionInit (invisible client component in root layout) calls `POST /api/v1/auth/me` on every hard page load to restore session from the httpOnly cookie set by the backend. Dashboard layout waits for `_sessionChecked` flag before rendering or redirecting. Async logout calls `POST /api/v1/auth/logout` to clear the server-side cookie before wiping client state. The 401 interceptor is updated to skip redirect on `/auth/me` (unauthenticated users hit this endpoint legitimately).

**Tech Stack:** Next.js 14 App Router, Zustand 5 (no persist middleware), Axios (withCredentials: true), React Hook Form + Zod 4, Playwright 1.59

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `src/store/authStore.ts` | Remove persist, add `_sessionChecked` / `setSessionChecked` |
| Modify | `src/lib/api.ts` | Add `withCredentials: true`; exclude `/auth/me` from 401 redirect |
| **Create** | `src/components/shared/SessionInit.tsx` | Invisible client component; calls `/auth/me` on mount |
| Modify | `src/app/layout.tsx` | Add `<SessionInit />` inside body |
| Modify | `src/app/dashboard/layout.tsx` | Replace `_hasHydrated` → `_sessionChecked`; show spinner while waiting |
| Modify | `src/hooks/useAuth.ts` | Return async `logout` that calls `/api/v1/auth/logout` before clearing store |
| Modify | `src/components/dashboard/ProductModal.tsx` | Add `imageUrl` field (optional URL) to schema + form |
| Modify | `e2e/business/product.spec.ts` | Activate `test.fixme` imageUrl test |
| **Create** | `.env.example` | Document required environment variables |
| Modify | `next.config.ts` | Remove stale TODO comment |

---

### Task 1: Update authStore — remove persist, add `_sessionChecked`

**Files:**
- Modify: `src/store/authStore.ts`

- [ ] **Step 1: Replace the file content**

```typescript
// src/store/authStore.ts
import { create } from 'zustand'
import type { User } from '@/types/auth'

interface AuthState {
  token: string | null
  user: User | null
  isAuthenticated: boolean
  _sessionChecked: boolean
  login: (token: string, user: User) => void
  logout: () => void
  setSessionChecked: (value: boolean) => void
}

export const useAuthStore = create<AuthState>()((set) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  _sessionChecked: false,
  login: (token, user) => set({ token, user, isAuthenticated: true }),
  logout: () => set({ token: null, user: null, isAuthenticated: false }),
  setSessionChecked: (value) => set({ _sessionChecked: value }),
}))
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors related to `authStore`.

- [ ] **Step 3: Commit**

```bash
git add src/store/authStore.ts
git commit -m "refactor: remove localStorage persist from authStore, add _sessionChecked"
```

---

### Task 2: Update api.ts — withCredentials + fix 401 interceptor for /auth/me

**Files:**
- Modify: `src/lib/api.ts`

- [ ] **Step 1: Update the file**

```typescript
// src/lib/api.ts
import axios from 'axios'
import { useAuthStore } from '@/store/authStore'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      !error.config?.url?.endsWith('/auth/me')
    ) {
      useAuthStore.getState().logout()
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
```

Key changes:
- `withCredentials: true` → browser sends httpOnly cookies on cross-origin requests
- 401 interceptor skips redirect when the failing URL ends with `/auth/me` (unauthenticated users legitimately hit this endpoint on page load)

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/api.ts
git commit -m "feat: add withCredentials to axios, skip /auth/me 401 redirect"
```

---

### Task 3: Create SessionInit + update root layout

**Files:**
- Create: `src/components/shared/SessionInit.tsx`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Create SessionInit.tsx**

```typescript
// src/components/shared/SessionInit.tsx
'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import api from '@/lib/api'
import type { AuthResponse } from '@/types/auth'

export default function SessionInit() {
  const login = useAuthStore((state) => state.login)
  const setSessionChecked = useAuthStore((state) => state.setSessionChecked)

  useEffect(() => {
    api
      .post<AuthResponse>('/api/v1/auth/me')
      .then((res) => {
        login(res.data.token, { email: res.data.email, accountType: res.data.role })
      })
      .catch(() => {
        // No valid cookie — user is not authenticated, that's fine
      })
      .finally(() => {
        setSessionChecked(true)
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}
```

Notes:
- Renders nothing — purely side-effectful
- `useEffect` runs once per hard page load (root layout is not re-mounted on client-side navigation)
- `/auth/me` 401 is silently swallowed; the 401 interceptor in api.ts skips redirect for this URL
- `setSessionChecked(true)` always fires in `finally` so the dashboard spinner resolves even when not authenticated

- [ ] **Step 2: Add SessionInit to root layout**

Edit `src/app/layout.tsx` to import and render `SessionInit`:

```typescript
// src/app/layout.tsx
import type { Metadata } from 'next'
import { Playfair_Display, Inter } from 'next/font/google'
import './globals.css'
import Header from '@/components/shared/Header'
import SessionInit from '@/components/shared/SessionInit'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'KomsuConnect',
  description: 'Mahalle esnafını keşfet',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr" className={`${playfair.variable} ${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-primary text-foreground font-body antialiased">
        <SessionInit />
        <Header />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  )
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/shared/SessionInit.tsx src/app/layout.tsx
git commit -m "feat: add SessionInit — restore session from cookie via /auth/me on page load"
```

---

### Task 4: Update dashboard/layout.tsx — use `_sessionChecked`, show spinner

**Files:**
- Modify: `src/app/dashboard/layout.tsx`

- [ ] **Step 1: Update the file**

```typescript
// src/app/dashboard/layout.tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/authStore'
import { BusinessProvider } from '@/context/BusinessContext'
import Sidebar from '@/components/dashboard/Sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth()
  const sessionChecked = useAuthStore((state) => state._sessionChecked)
  const router = useRouter()

  useEffect(() => {
    if (!sessionChecked) return
    if (!isAuthenticated) {
      router.replace('/login')
      return
    }
    if (user?.accountType !== 'BUSINESS') {
      router.replace('/')
    }
  }, [sessionChecked, isAuthenticated, user, router])

  if (!sessionChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    )
  }

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

Changes from previous version:
- `_hasHydrated` → `_sessionChecked` (sourced from `useAuthStore` directly)
- `return null` while waiting → full-page spinner

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/layout.tsx
git commit -m "feat: dashboard waits for session check with spinner before auth redirect"
```

---

### Task 5: Update useAuth — async logout calls /auth/logout

**Files:**
- Modify: `src/hooks/useAuth.ts`

- [ ] **Step 1: Update the hook**

```typescript
// src/hooks/useAuth.ts
import { useAuthStore } from '@/store/authStore'
import api from '@/lib/api'

export function useAuth() {
  const token = useAuthStore((state) => state.token)
  const user = useAuthStore((state) => state.user)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const login = useAuthStore((state) => state.login)
  const storeLogout = useAuthStore((state) => state.logout)

  const logout = async () => {
    try {
      await api.post('/api/v1/auth/logout')
    } catch {
      // Clear local state regardless of server response
    }
    storeLogout()
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
  }

  return { token, user, isAuthenticated, login, logout }
}
```

Note: `Header.tsx` calls `onClick={logout}` — no change needed there. The async function starts on click; the redirect fires after the API call (or immediately after the catch).

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useAuth.ts
git commit -m "feat: logout calls POST /api/v1/auth/logout before clearing store"
```

---

### Task 6: Add imageUrl field to ProductModal

**Files:**
- Modify: `src/components/dashboard/ProductModal.tsx`

- [ ] **Step 1: First, activate the E2E test to verify the failing state (TDD)**

In `e2e/business/product.spec.ts`, the `test.fixme` block on line 78 uses `#prod-image-url` as the input ID. Remove `test.fixme` and change to `test` to make it active:

```typescript
  test('imageUrl ile ürün ekleme → görsel listede render edilir', async ({ page }) => {
```

Run the test to confirm it fails before implementation:

```bash
npx playwright test e2e/business/product.spec.ts --grep "imageUrl" --headed
```

Expected: FAIL — `#prod-image-url` input not found.

- [ ] **Step 2: Update ProductModal.tsx with imageUrl support**

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
  imageUrl: z
    .string()
    .url('Geçerli bir URL giriniz')
    .or(z.literal(''))
    .optional(),
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
      imageUrl: product?.imageUrl ?? '',
    },
  })

  useEffect(() => {
    reset({
      name: product?.name ?? '',
      description: product?.description ?? '',
      price: product?.price?.toString() ?? '',
      available: product?.available ?? true,
      imageUrl: product?.imageUrl ?? '',
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
      ...(data.imageUrl && { imageUrl: data.imageUrl }),
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

          <div className="space-y-2">
            <Label htmlFor="prod-image-url">Görsel URL'si</Label>
            <Input
              id="prod-image-url"
              type="url"
              {...register('imageUrl')}
              placeholder="https://example.com/gorsel.jpg"
            />
            {errors.imageUrl && (
              <p className="text-xs text-accent">{errors.imageUrl.message}</p>
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

Key changes:
- Zod schema: `imageUrl` is `z.string().url(...).or(z.literal('')).optional()` — empty string passes, non-empty must be valid URL
- Form field: `id="prod-image-url"` matches the E2E test selector
- `defaultValues` and `reset()` include `imageUrl`
- Payload: `imageUrl` included only when non-empty

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/dashboard/ProductModal.tsx e2e/business/product.spec.ts
git commit -m "feat: add imageUrl field to ProductModal with URL validation"
```

---

### Task 7: Create .env.example + clean next.config.ts

**Files:**
- Create: `.env.example`
- Modify: `next.config.ts`

- [ ] **Step 1: Create .env.example**

```bash
# .env.example
NEXT_PUBLIC_API_URL=http://localhost:8080
```

- [ ] **Step 2: Remove TODO comment from next.config.ts**

```typescript
// next.config.ts
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

- [ ] **Step 3: Commit**

```bash
git add .env.example next.config.ts
git commit -m "chore: add .env.example, remove stale TODO in next.config.ts"
```

---

### Task 8: Verify E2E tests

- [ ] **Step 1: Start backend and frontend**

Ensure backend is running on `http://localhost:8080` (with `/auth/me` and `/auth/logout` endpoints active), then:

```bash
npm run dev
```

- [ ] **Step 2: Run full E2E suite**

```bash
npx playwright test
```

Expected outcome:
- `e2e/auth/register.spec.ts` — all 3 tests pass
- `e2e/auth/login.spec.ts` — all 4 tests pass (including "sayfa yenilemede oturum korunur" which validates the full cookie flow)
- `e2e/business/profile.spec.ts` — all 3 tests pass
- `e2e/business/product.spec.ts` — all 4 tests pass (imageUrl test now active)

- [ ] **Step 3: If "sayfa yenilemede oturum korunur" fails**

This test requires the backend to set an httpOnly cookie on `/auth/login`. If the backend hasn't implemented cookie-based auth yet, skip this test with `test.skip` and add a comment:

```typescript
test.skip('sayfa yenilemede oturum korunur', async ({ page }) => {
  // Requires backend to set httpOnly cookie on /auth/login
  // and /api/v1/auth/me to validate it
```

- [ ] **Step 4: Commit final state**

```bash
git add -A
git commit -m "test: verify E2E suite passes with cookie-based auth and imageUrl support"
```
