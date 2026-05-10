# Sprint 5a — Tasarım Revizyonu Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mevcut koyu lacivert temayı wireframe'lerden türetilen sıcak kraft/kağıt temasıyla değiştir; mevcut işlevselliği bozmadan sadece görsel katmanı güncelle.

**Architecture:** Tailwind v4 `@theme inline` token remap yaklaşımı — semantik token adları korunur (`primary`, `accent`, `surface`, `muted`, `foreground`), yalnızca hex değerleri güncellenir. Font değişimi `layout.tsx`'te, layout yapısal değişiklikleri (hero, split-screen, dashboard) ilgili sayfa dosyalarında yapılır.

**Tech Stack:** Next.js 14 App Router, TypeScript strict, Tailwind CSS v4, next/font/google (Alfa Slab One, Bagel Fat One, Inter)

---

## Dosya Haritası

| Dosya | Değişiklik |
|---|---|
| `src/app/globals.css` | Token remap + font değişkenleri |
| `src/app/layout.tsx` | Font imports (Alfa Slab One, Bagel Fat One), body bg kaldır |
| `src/components/ui/card.tsx` | shadow-sm → solid shadow, rounded-xl kaldır |
| `src/components/shared/Header.tsx` | Logo format, light text on dark bg |
| `src/app/page.tsx` | Hero section ekle |
| `src/components/businesses/BusinessCard.tsx` | Card wrapper kaldır, solid shadow |
| `src/app/(auth)/login/page.tsx` | Split-screen layout, Card kaldır |
| `src/app/(auth)/register/page.tsx` | Split-screen layout, Card kaldır |
| `src/app/businesses/[id]/page.tsx` | Hero banner, geri link, detay kartı |
| `src/components/businesses/ProductCard.tsx` | rounded-xl kaldır, solid shadow |
| `src/app/dashboard/layout.tsx` | bg-[#F5EAD4] ekle |
| `src/components/dashboard/Sidebar.tsx` | Light text on dark bg |
| `src/app/dashboard/profile/page.tsx` | Heading stili, Profili Önizle butonu |
| `src/app/dashboard/products/page.tsx` | Heading ekle |

**Değişmeyen dosyalar** (token remap otomatik günceller): `button.tsx`, `input.tsx`, `label.tsx`, `CityFilter.tsx`

---

## Task 1: Foundation — globals.css + layout.tsx

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: globals.css — token remap + font değişkenleri**

`src/app/globals.css` içeriğini tamamen şununla değiştir:

```css
@import "tailwindcss";

@theme inline {
  /* Token remap: adlar korundu, değerler yeni palete çevrildi */
  --color-primary:    #26201A;   /* header, sidebar, koyu zemin */
  --color-accent:     #C2492C;   /* terracotta — CTA butonlar */
  --color-surface:    #FFFBEF;   /* kart arka planları */
  --color-muted:      #D4A340;   /* altın — border, ikincil vurgu */
  --color-foreground: #26201A;   /* ana metin */

  --font-heading: var(--font-alfa-slab);
  --font-logo:    var(--font-bagel);
  --font-body:    var(--font-inter);
}

body {
  background-color: #F5EAD4;  /* kraft bej sayfa arka planı */
  color: #26201A;
}
```

- [ ] **Step 2: layout.tsx — font imports**

`src/app/layout.tsx` içeriğini tamamen şununla değiştir:

```tsx
import type { Metadata } from 'next'
import { Alfa_Slab_One, Bagel_Fat_One, Inter } from 'next/font/google'
import './globals.css'
import Header from '@/components/shared/Header'
import SessionInit from '@/components/shared/SessionInit'

const alfaSlab = Alfa_Slab_One({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-alfa-slab',
})

const bagelFat = Bagel_Fat_One({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bagel',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'KomsuConnect',
  description: 'Mahalle esnafını keşfet',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={`${alfaSlab.variable} ${bagelFat.variable} ${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col text-foreground font-body antialiased">
        <SessionInit />
        <Header />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  )
}
```

Not: `bg-primary` body'den kaldırıldı — sayfa arka planı (`#F5EAD4`) globals.css `body` kuralından gelir.

- [ ] **Step 3: TypeScript kontrolü**

```bash
cd frontend && npx tsc --noEmit
```

Beklenen çıktı: hata yok.

- [ ] **Step 4: Commit**

```bash
git add src/app/globals.css src/app/layout.tsx
git commit -m "feat: remap design tokens to kraft/paper palette, swap fonts to Alfa Slab One + Bagel Fat One"
```

---

## Task 2: UI Primitives — card.tsx

**Files:**
- Modify: `src/components/ui/card.tsx`

Not: `button.tsx`, `input.tsx`, `label.tsx` token remap ile otomatik güncellenir, kod değişikliği gerekmez.

- [ ] **Step 1: Card component — solid shadow, rounded kaldır**

`src/components/ui/card.tsx` içinde sadece `Card` bileşeninin className'ini güncelle:

```tsx
const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('border border-muted bg-surface shadow-[3px_3px_0_#26201A]', className)}
      {...props}
    />
  )
)
```

Değişiklik: `rounded-xl` kaldırıldı, `shadow-sm` → `shadow-[3px_3px_0_#26201A]`.

- [ ] **Step 2: TypeScript kontrolü**

```bash
npx tsc --noEmit
```

Beklenen çıktı: hata yok.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/card.tsx
git commit -m "feat: update Card with solid kraft shadow, remove rounded corners"
```

---

## Task 3: Header

**Files:**
- Modify: `src/components/shared/Header.tsx`

Not: Header `bg-primary` (`#26201A`) koyu zeminde durduğundan nav linkleri için `text-surface` (krem `#FFFBEF`) kullanılır — `text-foreground` kullanılmaz (o da `#26201A`'dır, görünmez olur).

- [ ] **Step 1: Header — yeni logo + light text**

`src/components/shared/Header.tsx` içeriğini tamamen şununla değiştir:

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
    <header className="sticky top-0 z-50 bg-primary border-b border-primary/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-baseline gap-0.5">
          <span className="font-logo text-xl text-surface">Komşu</span>
          <span className="font-heading text-xl text-accent">Connect</span>
        </Link>
        <nav className="flex items-center gap-4">
          <Link
            href="/"
            className="text-sm text-surface/70 hover:text-surface transition-colors"
          >
            Esnafları Keşfet
          </Link>
          {isAuthenticated && user?.accountType === 'BUSINESS' && (
            <Link
              href="/dashboard"
              className="text-sm text-surface/70 hover:text-surface transition-colors"
            >
              Panel
            </Link>
          )}
          {isAuthenticated ? (
            <button
              onClick={logout}
              className="text-sm text-surface/70 hover:text-surface transition-colors"
            >
              Çıkış Yap
            </button>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm text-surface/70 hover:text-surface transition-colors"
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

Beklenen çıktı: hata yok.

- [ ] **Step 3: Commit**

```bash
git add src/components/shared/Header.tsx
git commit -m "feat: update Header with two-font logo and light text on dark bg"
```

---

## Task 4: Ana Sayfa + BusinessCard

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/components/businesses/BusinessCard.tsx`

Not: `CityFilter.tsx` zaten token tabanlı sınıflar kullanıyor (`bg-surface`, `border-muted`, `text-foreground`, `focus:border-accent`), kod değişikliği gerekmez.

- [ ] **Step 1: page.tsx — hero section ekle**

`src/app/page.tsx` içeriğini tamamen şununla değiştir:

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
          <CityFilter cities={cities} selectedCity={city} />
        </Suspense>
        <BusinessGrid businesses={businesses} selectedCity={city} />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: BusinessCard.tsx — Card wrapper kaldır, solid shadow**

`src/components/businesses/BusinessCard.tsx` içeriğini tamamen şununla değiştir:

```tsx
import Link from 'next/link'
import type { BusinessPublicSummary } from '@/types/business'

interface Props {
  business: BusinessPublicSummary
}

export default function BusinessCard({ business }: Props) {
  return (
    <div className="bg-surface border border-muted shadow-[3px_3px_0_#26201A] p-6">
      <h2 className="font-heading text-xl text-foreground mb-1">
        {business.businessName}
      </h2>
      {business.description && (
        <p className="text-foreground/60 text-sm mb-3 line-clamp-2">
          {business.description}
        </p>
      )}
      <div className="flex items-center gap-4 text-foreground/60 text-sm mb-4">
        {business.city && <span>📍 {business.city}</span>}
        <span>{business.productCount} ürün</span>
      </div>
      <Link
        href={`/businesses/${business.id}`}
        className="inline-block bg-accent text-white text-sm px-4 py-2 hover:bg-accent/90 transition-colors"
      >
        İncele →
      </Link>
    </div>
  )
}
```

- [ ] **Step 3: TypeScript kontrolü**

```bash
npx tsc --noEmit
```

Beklenen çıktı: hata yok.

- [ ] **Step 4: Commit**

```bash
git add src/app/page.tsx src/components/businesses/BusinessCard.tsx
git commit -m "feat: add hero section to home page, restyle BusinessCard with solid shadow"
```

---

## Task 5: Auth Sayfaları — Login + Register

**Files:**
- Modify: `src/app/(auth)/login/page.tsx`
- Modify: `src/app/(auth)/register/page.tsx`

Not: Auth sayfalarında Header `null` döner, bu yüzden layout tam ekrandır (`min-h-screen`). `Card` import'ları kaldırılır.

- [ ] **Step 1: login/page.tsx — split-screen layout**

`src/app/(auth)/login/page.tsx` içeriğini tamamen şununla değiştir:

```tsx
'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/useAuth'
import api from '@/lib/api'
import type { AuthResponse } from '@/types/auth'

const loginSchema = z.object({
  email:    z.string().email({ message: 'Geçerli bir e-posta adresi girin' }),
  password: z.string().min(6, { message: 'Şifre en az 6 karakter olmalıdır' }),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const { isAuthenticated, login } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  useEffect(() => {
    if (isAuthenticated) router.replace('/')
  }, [isAuthenticated, router])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null)
    try {
      const response = await api.post<AuthResponse>('/api/v1/auth/login', data)
      const { token, role } = response.data
      login(token, { email: data.email, accountType: role })
      router.push(role === 'BUSINESS' ? '/dashboard' : '/')
    } catch (error: unknown) {
      if (
        typeof error === 'object' && error !== null &&
        'response' in error &&
        typeof (error as { response?: { status?: number } }).response?.status === 'number'
      ) {
        const status = (error as { response: { status: number } }).response.status
        setServerError(
          status === 401 || status === 400
            ? 'E-posta veya şifre hatalı.'
            : 'Bir hata oluştu. Lütfen tekrar deneyin.'
        )
      } else {
        setServerError('Sunucuya bağlanılamadı. Lütfen tekrar deneyin.')
      }
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Sol panel — md ve üzeri */}
      <div className="hidden md:flex flex-col justify-center px-12 bg-primary w-1/2">
        <div className="mb-6 flex items-baseline gap-0.5">
          <span className="font-logo text-2xl text-surface">Komşu</span>
          <span className="font-heading text-2xl text-accent">Connect</span>
        </div>
        <h2 className="font-heading text-4xl text-surface leading-tight mb-4">
          HOŞ GELDİN.<br />MAHALLENE.
        </h2>
        <p className="text-surface/60 text-sm leading-relaxed max-w-xs">
          Sokağındaki manav, fırın, kasap, çiçekçi — hepsi bir tıkla.
          KomşuConnect, mahalle dokusunu dijitalde yaşatır.
        </p>
      </div>

      {/* Sağ panel */}
      <div className="flex flex-col justify-center px-8 sm:px-12 w-full md:w-1/2 bg-[#F5EAD4]">
        <div className="w-full max-w-sm mx-auto">
          <h1 className="font-heading text-2xl text-foreground mb-1">Tekrar hoş geldin</h1>
          <p className="text-foreground/60 text-sm mb-8">Hesabına giriş yap</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-posta</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40" />
                <Input
                  id="email"
                  type="email"
                  placeholder="ornek@mail.com"
                  className="pl-10"
                  {...register('email')}
                />
              </div>
              {errors.email && <p className="text-xs text-accent">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Şifre</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="pl-10 pr-10"
                  {...register('password')}
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground transition-colors"
                  onClick={() => setShowPassword(v => !v)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-accent">{errors.password.message}</p>}
            </div>

            {serverError && <p className="text-sm text-accent text-center">{serverError}</p>}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Giriş yapılıyor…' : 'Giriş Yap'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-foreground/60">
            Hesabın yok mu?{' '}
            <Link href="/register" className="text-accent hover:underline">Kayıt ol</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: register/page.tsx — split-screen layout**

`src/app/(auth)/register/page.tsx` içeriğini tamamen şununla değiştir:

```tsx
'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Mail, Lock, User, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import api from '@/lib/api'
import type { AuthResponse } from '@/types/auth'

const registerSchema = z.object({
  firstName:   z.string().min(2, { message: 'Ad en az 2 karakter olmalıdır' }),
  lastName:    z.string().min(2, { message: 'Soyad en az 2 karakter olmalıdır' }),
  email:       z.string().email({ message: 'Geçerli bir e-posta adresi girin' }),
  password:    z.string().min(6, { message: 'Şifre en az 6 karakter olmalıdır' }),
  accountType: z.enum(['USER', 'BUSINESS']),
})

type RegisterFormData = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const router = useRouter()
  const { isAuthenticated, login } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  useEffect(() => {
    if (isAuthenticated) router.replace('/')
  }, [isAuthenticated, router])

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { accountType: 'USER' },
  })

  const accountType = watch('accountType')

  const onSubmit = async (data: RegisterFormData) => {
    setServerError(null)
    try {
      const payload = {
        fullName: `${data.firstName} ${data.lastName}`.trim(),
        email:    data.email,
        password: data.password,
        role:     data.accountType,
      }
      const response = await api.post<AuthResponse>('/api/v1/auth/register', payload)
      const { token, role } = response.data
      login(token, { email: data.email, accountType: role })
      router.push(role === 'BUSINESS' ? '/dashboard' : '/')
    } catch (error: unknown) {
      if (
        typeof error === 'object' && error !== null &&
        'response' in error &&
        typeof (error as { response?: { status?: number } }).response?.status === 'number'
      ) {
        const status = (error as { response: { status: number } }).response.status
        if (status === 409) {
          setServerError('Bu e-posta adresi zaten kayıtlı.')
        } else if (status === 400) {
          setServerError('Girilen bilgiler geçersiz. Lütfen kontrol edin.')
        } else {
          setServerError('Bir hata oluştu. Lütfen tekrar deneyin.')
        }
      } else {
        setServerError('Sunucuya bağlanılamadı. Lütfen tekrar deneyin.')
      }
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Sol panel */}
      <div className="hidden md:flex flex-col justify-center px-12 bg-primary w-1/2">
        <div className="mb-6 flex items-baseline gap-0.5">
          <span className="font-logo text-2xl text-surface">Komşu</span>
          <span className="font-heading text-2xl text-accent">Connect</span>
        </div>
        <h2 className="font-heading text-4xl text-surface leading-tight mb-4">
          MAHALLE<br />ESNAFINA<br />KATIL.
        </h2>
        <p className="text-surface/60 text-sm leading-relaxed max-w-xs">
          Dükkanını dijitale taşı, mahallenin müşterilerine ulaş.
        </p>
      </div>

      {/* Sağ panel */}
      <div className="flex flex-col justify-center px-8 sm:px-12 w-full md:w-1/2 bg-[#F5EAD4] overflow-y-auto py-12">
        <div className="w-full max-w-sm mx-auto">
          <h1 className="font-heading text-2xl text-foreground mb-1">Hesap oluştur</h1>
          <p className="text-foreground/60 text-sm mb-8">Mahalle esnafına katıl</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Hesap Tipi */}
            <div className="space-y-2">
              <Label>Hesap Tipi</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setValue('accountType', 'USER')}
                  className={cn(
                    'flex flex-col items-center gap-2 border p-4 text-sm transition-colors',
                    accountType === 'USER'
                      ? 'border-accent bg-accent/10 text-foreground'
                      : 'border-muted bg-surface text-foreground/60 hover:border-foreground/30'
                  )}
                >
                  <User className="h-5 w-5" />
                  <span className="font-medium">Bireysel</span>
                </button>
                <button
                  type="button"
                  onClick={() => setValue('accountType', 'BUSINESS')}
                  className={cn(
                    'flex flex-col items-center gap-2 border p-4 text-sm transition-colors',
                    accountType === 'BUSINESS'
                      ? 'border-accent bg-accent/10 text-foreground'
                      : 'border-muted bg-surface text-foreground/60 hover:border-foreground/30'
                  )}
                >
                  <Building2 className="h-5 w-5" />
                  <span className="font-medium">Esnaf</span>
                </button>
              </div>
            </div>

            {/* Ad Soyad */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="firstName">Ad</Label>
                <Input id="firstName" placeholder="Ahmet" {...register('firstName')} />
                {errors.firstName && <p className="text-xs text-accent">{errors.firstName.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Soyad</Label>
                <Input id="lastName" placeholder="Yılmaz" {...register('lastName')} />
                {errors.lastName && <p className="text-xs text-accent">{errors.lastName.message}</p>}
              </div>
            </div>

            {/* E-posta */}
            <div className="space-y-2">
              <Label htmlFor="email">E-posta</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40" />
                <Input id="email" type="email" placeholder="ornek@mail.com" className="pl-10" {...register('email')} />
              </div>
              {errors.email && <p className="text-xs text-accent">{errors.email.message}</p>}
            </div>

            {/* Şifre */}
            <div className="space-y-2">
              <Label htmlFor="password">Şifre</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="pl-10 pr-10"
                  {...register('password')}
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground transition-colors"
                  onClick={() => setShowPassword(v => !v)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-accent">{errors.password.message}</p>}
            </div>

            {serverError && <p className="text-sm text-accent text-center">{serverError}</p>}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Kaydediliyor…' : 'Kayıt Ol'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-foreground/60">
            Zaten hesabın var mı?{' '}
            <Link href="/login" className="text-accent hover:underline">Giriş yap</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: TypeScript kontrolü**

```bash
npx tsc --noEmit
```

Beklenen çıktı: hata yok. Eğer TS hatası çıkarsa büyük ihtimal `Card` / `CardContent` import'ları kalmış — silindiğinden emin ol.

- [ ] **Step 4: Commit**

```bash
git add src/app/\(auth\)/login/page.tsx src/app/\(auth\)/register/page.tsx
git commit -m "feat: redesign auth pages with split-screen layout"
```

---

## Task 6: Esnaf Profil Sayfası + ProductCard

**Files:**
- Modify: `src/app/businesses/[id]/page.tsx`
- Modify: `src/components/businesses/ProductCard.tsx`

- [ ] **Step 1: businesses/[id]/page.tsx — hero banner + geri link + detay kartı**

`src/app/businesses/[id]/page.tsx` içeriğini tamamen şununla değiştir:

```tsx
import type { Metadata } from 'next'
import Link from 'next/link'
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

      {/* Hero banner — gradient placeholder, gerçek kapak görseli yok */}
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
            {business.city && <span>📍 {business.city}</span>}
            {business.address && <span>{business.address}</span>}
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

- [ ] **Step 2: ProductCard.tsx — rounded-xl kaldır, solid shadow**

`src/components/businesses/ProductCard.tsx` içeriğini tamamen şununla değiştir:

```tsx
import Image from 'next/image'
import type { ProductPublic } from '@/types/business'

interface Props {
  product: ProductPublic
}

export default function ProductCard({ product }: Props) {
  return (
    <div
      className={`border border-muted bg-surface shadow-[3px_3px_0_#26201A] overflow-hidden${
        !product.available ? ' opacity-50' : ''
      }`}
    >
      <div className="relative h-40 bg-muted/20">
        {product.imageUrl ? (
          <Image src={product.imageUrl} alt={product.name} fill className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-foreground/30 text-xs">Görsel yok</span>
          </div>
        )}
        {!product.available && (
          <span className="absolute top-2 right-2 bg-primary/80 text-surface text-xs px-2 py-1">
            Tükendi
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-heading text-foreground mb-1">{product.name}</h3>
        {product.description && (
          <p className="text-foreground/60 text-sm mb-2 line-clamp-2">{product.description}</p>
        )}
        <span className="text-muted font-bold text-sm">₺{Number(product.price).toFixed(2)}</span>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: TypeScript kontrolü**

```bash
npx tsc --noEmit
```

Beklenen çıktı: hata yok.

- [ ] **Step 4: Commit**

```bash
git add src/app/businesses/\[id\]/page.tsx src/components/businesses/ProductCard.tsx
git commit -m "feat: add gradient hero banner to business profile, restyle ProductCard"
```

---

## Task 7: Dashboard

**Files:**
- Modify: `src/app/dashboard/layout.tsx`
- Modify: `src/components/dashboard/Sidebar.tsx`
- Modify: `src/app/dashboard/profile/page.tsx`
- Modify: `src/app/dashboard/products/page.tsx`

Not: Sidebar `bg-primary` (`#26201A`) koyu zeminde, nav linkleri için `text-surface` (krem) kullanılır.

- [ ] **Step 1: dashboard/layout.tsx — kraft bej arka plan**

`src/app/dashboard/layout.tsx` içinde return bloğundaki div'e `bg-[#F5EAD4]` ekle:

```tsx
return (
  <BusinessProvider>
    <div className="flex min-h-[calc(100vh-4rem)] bg-[#F5EAD4]">
      <Sidebar />
      <main className="flex-1 p-8 min-w-0">{children}</main>
    </div>
  </BusinessProvider>
)
```

Sadece `<div className="flex min-h-[calc(100vh-4rem)]">` satırını `<div className="flex min-h-[calc(100vh-4rem)] bg-[#F5EAD4]">` olarak değiştir; dosyanın geri kalanı aynı kalır.

- [ ] **Step 2: Sidebar.tsx — light text on dark bg**

`src/components/dashboard/Sidebar.tsx` içeriğini tamamen şununla değiştir:

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { User, Package } from 'lucide-react'
import { useBusiness } from '@/hooks/useBusiness'

const navItems = [
  { href: '/dashboard/profile', label: 'Profil',     icon: User,    requiresProfile: false },
  { href: '/dashboard/products', label: 'Ürünlerim', icon: Package, requiresProfile: true  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { hasProfile } = useBusiness()

  return (
    <aside className="hidden md:flex flex-col w-60 min-h-full bg-primary border-r border-primary/20 p-4 gap-1 shrink-0">
      <p className="text-xs text-muted uppercase tracking-widest px-3 mb-2">Panel</p>
      {navItems.map(({ href, label, icon: Icon, requiresProfile }) => {
        const isActive = pathname === href
        const isDisabled = requiresProfile && !hasProfile

        if (isDisabled) {
          return (
            <span
              key={href}
              title="Önce profilinizi kaydedin"
              className="flex items-center gap-3 px-3 py-2 text-sm opacity-40 cursor-not-allowed select-none text-surface"
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
            className={`flex items-center gap-3 px-3 py-2 text-sm transition-colors ${
              isActive
                ? 'bg-accent/10 text-accent border-l-2 border-accent pl-[10px]'
                : 'text-surface/70 hover:text-surface hover:bg-surface/5'
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

- [ ] **Step 3: dashboard/profile/page.tsx — heading + Profili Önizle butonu**

`src/app/dashboard/profile/page.tsx` içeriğini tamamen şununla değiştir:

```tsx
'use client'

import Link from 'next/link'
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
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-heading text-3xl text-foreground mb-1">
            Pano{profile?.businessName ? ` — ${profile.businessName}` : ''}
          </h1>
          <p className="text-foreground/60 text-sm">
            {profile
              ? 'İşletme bilgilerinizi güncelleyin.'
              : 'Ürün ekleyebilmek için önce işletme profilinizi doldurun.'}
          </p>
        </div>
        {profile && (
          <Link
            href={`/businesses/${profile.id}`}
            className="text-sm border border-accent text-accent px-4 py-2 hover:bg-accent hover:text-white transition-colors shrink-0"
          >
            Profili Önizle →
          </Link>
        )}
      </div>
      <ProfileForm profile={profile} />
    </div>
  )
}
```

Not: `profile?.businessName` optional chaining ile yazıldı — eğer `BusinessProfile` tipinde `businessName` alanı yoksa TS hatası verir. Hata çıkarsa `profile.businessName` yerine `profile.name` gibi tipin gerçek alan adını kullan (backend entity'ye bak).

- [ ] **Step 4: dashboard/products/page.tsx — heading ekle**

`src/app/dashboard/products/page.tsx` içeriğini tamamen şununla değiştir:

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
      <h1 className="font-heading text-3xl text-foreground mb-8">Ürünlerim</h1>
      <ProductTable businessId={profile.id} />
    </div>
  )
}
```

- [ ] **Step 5: TypeScript kontrolü**

```bash
npx tsc --noEmit
```

Beklenen çıktı: hata yok. `profile.businessName` TS hatası verirse `src/types/` veya `src/context/BusinessContext.tsx`'te `BusinessProfile` tipini kontrol et, doğru alan adını kullan.

- [ ] **Step 6: Commit**

```bash
git add src/app/dashboard/layout.tsx src/components/dashboard/Sidebar.tsx src/app/dashboard/profile/page.tsx src/app/dashboard/products/page.tsx
git commit -m "feat: restyle dashboard with kraft bg, dark sidebar, Alfa Slab headings, profile preview link"
```

---

## Son Kontrol

- [ ] `npm run build` — production build hatasız tamamlanıyor mu?

```bash
npm run build
```

Beklenen: ✓ Compiled successfully, sıfır TS/lint hatası.

- [ ] Görsel kontrol: dev server'da her sayfayı aç ve şunları doğrula:
  - Ana sayfa hero'su, kraft bej arka plan, solid shadow kartlar
  - Header: iki fontlu logo (Bagel Fat One + Alfa Slab One)
  - Login/Register: sol koyu panel, sağ bej form
  - Esnaf profili: gradient hero banner
  - Dashboard: koyu sidebar, bej içerik alanı
