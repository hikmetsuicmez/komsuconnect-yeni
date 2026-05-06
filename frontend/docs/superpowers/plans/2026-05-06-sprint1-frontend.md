# Sprint 1 Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** KomsuConnect'in temel frontend'ini oluştur: auth sayfaları (login/register), layout, Axios API katmanı ve Zustand auth store.

**Architecture:** Layout-level Client Guard — token Zustand store'da in-memory tutulur (persist yok), `/dashboard/layout.tsx` auth yoksa `/login`'e yönlendirir. Auth sayfaları zaten giriş yapmış kullanıcıyı ana sayfaya yönlendirir.

**Tech Stack:** Next.js 16 (App Router), TypeScript strict, Tailwind CSS v4, Zustand, Axios, React Hook Form + Zod, Radix UI primitives, lucide-react

> **Not:** Formal testler Sprint 3'te Playwright ile başlayacak. Bu planda doğrulama adımları `npm run dev` + tarayıcıdan yapılır.

---

## Dosya Haritası

| Dosya | İşlem | Sorumluluk |
|-------|-------|-----------|
| `src/app/globals.css` | Modify | Tailwind v4 design tokens, font CSS variables |
| `src/app/layout.tsx` | Modify | Root layout: Playfair Display + Inter fontları, Header |
| `src/app/page.tsx` | Modify | Ana sayfa placeholder |
| `src/app/(auth)/login/page.tsx` | Create | Login formu, Zod validasyon, API bağlantısı |
| `src/app/(auth)/register/page.tsx` | Create | Register formu, hesap tipi seçimi, API bağlantısı |
| `src/app/dashboard/layout.tsx` | Create | Auth guard — token yoksa /login'e redirect |
| `src/app/dashboard/page.tsx` | Create | Sprint 2 placeholder |
| `src/components/ui/button.tsx` | Create | Radix Slot, cva, marka renkli Button |
| `src/components/ui/input.tsx` | Create | Dark themed Input primitive |
| `src/components/ui/label.tsx` | Create | Radix Label primitive |
| `src/components/ui/card.tsx` | Create | Surface renkli Card + alt bileşenleri |
| `src/components/shared/Header.tsx` | Create | Sticky nav: logo, auth linkleri / çıkış |
| `src/lib/api.ts` | Create | Axios instance + request/response interceptor |
| `src/lib/utils.ts` | Create | cn() yardımcı fonksiyonu |
| `src/store/authStore.ts` | Create | Zustand store: token, user, login, logout |
| `src/types/auth.ts` | Create | LoginRequest, RegisterRequest, AuthResponse, User |
| `src/hooks/useAuth.ts` | Create | Zustand store'dan convenience hook |
| `.env.local` | Create | NEXT_PUBLIC_API_URL |

---

## Task 1: npm Bağımlılıklarını Kur

**Files:**
- Modify: `package.json` (dolaylı, npm tarafından güncellenir)

- [ ] **Step 1: Paketleri kur**

```bash
cd frontend
npm install axios zustand react-hook-form zod @hookform/resolvers lucide-react class-variance-authority @radix-ui/react-slot @radix-ui/react-label clsx tailwind-merge
```

Beklenen çıktı: `added N packages` — hata yok.

- [ ] **Step 2: Kurulumu doğrula**

```bash
npm ls axios zustand react-hook-form zod @hookform/resolvers lucide-react class-variance-authority @radix-ui/react-slot @radix-ui/react-label clsx tailwind-merge
```

Beklenen: Her paket `deduped` veya version numarasıyla listelenir, `UNMET` yok.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install Sprint 1 frontend dependencies"
```

---

## Task 2: Design System — globals.css

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: globals.css'i marka renkleri ve font değişkenleriyle güncelle**

`src/app/globals.css` içeriğini tamamen şununla değiştir:

```css
@import "tailwindcss";

@theme inline {
  /* Marka renkleri */
  --color-primary:    #1a1a2e;
  --color-accent:     #e94560;
  --color-surface:    #16213e;
  --color-muted:      #0f3460;
  --color-foreground: #eaeaea;

  /* Fontlar — next/font HTML elementine CSS değişkeni olarak yazar */
  --font-heading: var(--font-playfair);
  --font-body:    var(--font-inter);
}

body {
  background-color: #1a1a2e;
  color: #eaeaea;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/globals.css
git commit -m "feat: add brand design tokens to globals.css"
```

---

## Task 3: lib/utils.ts

**Files:**
- Create: `src/lib/utils.ts`

- [ ] **Step 1: `src/lib/utils.ts` oluştur**

```typescript
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/utils.ts
git commit -m "feat: add cn utility function"
```

---

## Task 4: UI Primitifleri (21st.dev'den adapte)

**Files:**
- Create: `src/components/ui/button.tsx`
- Create: `src/components/ui/input.tsx`
- Create: `src/components/ui/label.tsx`
- Create: `src/components/ui/card.tsx`

- [ ] **Step 1: `src/components/ui/button.tsx` oluştur**

```typescript
import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-accent text-white hover:bg-accent/90',
        outline: 'border border-muted bg-transparent text-foreground hover:bg-surface',
        ghost:   'hover:bg-surface text-foreground',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm:      'h-9 px-3',
        lg:      'h-12 px-8 text-base',
        icon:    'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size:    'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
```

- [ ] **Step 2: `src/components/ui/input.tsx` oluştur**

```typescript
import * as React from 'react'
import { cn } from '@/lib/utils'

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-lg border border-muted bg-surface px-3 py-2 text-sm text-foreground',
          'placeholder:text-foreground/40',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

export { Input }
```

- [ ] **Step 3: `src/components/ui/label.tsx` oluştur**

```typescript
'use client'

import * as React from 'react'
import * as LabelPrimitive from '@radix-ui/react-label'
import { cn } from '@/lib/utils'

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(
      'text-sm font-medium text-foreground/80 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
      className
    )}
    {...props}
  />
))
Label.displayName = LabelPrimitive.Root.displayName

export { Label }
```

- [ ] **Step 4: `src/components/ui/card.tsx` oluştur**

```typescript
import * as React from 'react'
import { cn } from '@/lib/utils'

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('rounded-xl border border-muted bg-surface shadow-sm', className)}
      {...props}
    />
  )
)
Card.displayName = 'Card'

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
  )
)
CardHeader.displayName = 'CardHeader'

const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-2xl font-heading font-semibold leading-none tracking-tight text-foreground', className)}
      {...props}
    />
  )
)
CardTitle.displayName = 'CardTitle'

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-sm text-foreground/60', className)} {...props} />
  )
)
CardDescription.displayName = 'CardDescription'

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  )
)
CardContent.displayName = 'CardContent'

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center p-6 pt-0', className)} {...props} />
  )
)
CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter }
```

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/
git commit -m "feat: add UI primitives (Button, Input, Label, Card)"
```

---

## Task 5: TypeScript Tipleri

**Files:**
- Create: `src/types/auth.ts`

- [ ] **Step 1: `src/types/auth.ts` oluştur**

```typescript
export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  firstName: string
  lastName: string
  email: string
  password: string
  accountType: 'USER' | 'BUSINESS'
}

export interface AuthResponse {
  token: string
  accountType: 'USER' | 'BUSINESS'
}

export interface User {
  email: string
  accountType: 'USER' | 'BUSINESS'
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types/auth.ts
git commit -m "feat: add auth TypeScript types"
```

---

## Task 6: Zustand Auth Store

**Files:**
- Create: `src/store/authStore.ts`

- [ ] **Step 1: `src/store/authStore.ts` oluştur**

```typescript
import { create } from 'zustand'
import type { User } from '@/types/auth'

interface AuthState {
  token: string | null
  user: User | null
  isAuthenticated: boolean
  login: (token: string, user: User) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  login: (token, user) => set({ token, user, isAuthenticated: true }),
  logout: () => set({ token: null, user: null, isAuthenticated: false }),
}))
```

- [ ] **Step 2: Commit**

```bash
git add src/store/authStore.ts
git commit -m "feat: add Zustand auth store"
```

---

## Task 7: Axios Instance

**Files:**
- Create: `src/lib/api.ts`

- [ ] **Step 1: `src/lib/api.ts` oluştur**

```typescript
import axios from 'axios'
import { useAuthStore } from '@/store/authStore'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
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
    if (error.response?.status === 401) {
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

- [ ] **Step 2: `.env.local` oluştur**

Proje kökünde (`frontend/`) `.env.local` dosyası oluştur:

```
NEXT_PUBLIC_API_URL=http://localhost:8080
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/api.ts
git commit -m "feat: add Axios instance with auth interceptors"
```

`.env.local` commit edilmez — `.gitignore`'da zaten var.

---

## Task 8: useAuth Hook

**Files:**
- Create: `src/hooks/useAuth.ts`

- [ ] **Step 1: `src/hooks/useAuth.ts` oluştur**

```typescript
import { useAuthStore } from '@/store/authStore'

export function useAuth() {
  const token = useAuthStore((state) => state.token)
  const user = useAuthStore((state) => state.user)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const login = useAuthStore((state) => state.login)
  const logout = useAuthStore((state) => state.logout)

  return { token, user, isAuthenticated, login, logout }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useAuth.ts
git commit -m "feat: add useAuth convenience hook"
```

---

## Task 9: Header Bileşeni

**Files:**
- Create: `src/components/shared/Header.tsx`

- [ ] **Step 1: `src/components/shared/Header.tsx` oluştur**

```typescript
'use client'

import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'

export default function Header() {
  const { isAuthenticated, logout } = useAuth()

  return (
    <header className="sticky top-0 z-50 bg-primary border-b border-muted">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="font-heading text-xl font-bold text-accent">
          KomsuConnect
        </Link>
        <nav className="flex items-center gap-4">
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

- [ ] **Step 2: Commit**

```bash
git add src/components/shared/Header.tsx
git commit -m "feat: add Header navigation component"
```

---

## Task 10: Root Layout Güncelle

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: `src/app/layout.tsx`'i güncelle**

`src/app/layout.tsx` içeriğini tamamen şununla değiştir:

```typescript
import type { Metadata } from 'next'
import { Playfair_Display, Inter } from 'next/font/google'
import './globals.css'
import Header from '@/components/shared/Header'

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
        <Header />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  )
}
```

- [ ] **Step 2: Ana sayfa placeholder'ını güncelle**

`src/app/page.tsx` içeriğini tamamen şununla değiştir:

```typescript
export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <h1 className="font-heading text-4xl font-bold text-foreground mb-4">
        Mahallenin Esnafı Bir Tık Uzağında
      </h1>
      <p className="text-foreground/60 text-lg">
        Yakın çevrendeki esnafları keşfet — çok yakında.
      </p>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/layout.tsx src/app/page.tsx
git commit -m "feat: update root layout with brand fonts and Header"
```

---

## Task 11: Login Sayfası

**Files:**
- Create: `src/app/(auth)/login/page.tsx`

- [ ] **Step 1: `src/app/(auth)/login/page.tsx` oluştur**

```typescript
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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'
import api from '@/lib/api'
import type { AuthResponse } from '@/types/auth'

const loginSchema = z.object({
  email: z.string().email({ message: 'Geçerli bir e-posta adresi girin' }),
  password: z.string().min(6, { message: 'Şifre en az 6 karakter olmalıdır' }),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const { isAuthenticated, login } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/')
    }
  }, [isAuthenticated, router])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null)
    try {
      const response = await api.post<AuthResponse>('/api/v1/auth/login', data)
      const { token, accountType } = response.data
      login(token, { email: data.email, accountType })
      if (accountType === 'BUSINESS') {
        router.push('/dashboard')
      } else {
        router.push('/')
      }
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as { response?: { status?: number } }).response?.status === 'number'
      ) {
        const status = (error as { response: { status: number } }).response.status
        if (status === 401 || status === 400) {
          setServerError('E-posta veya şifre hatalı.')
        } else {
          setServerError('Bir hata oluştu. Lütfen tekrar deneyin.')
        }
      } else {
        setServerError('Sunucuya bağlanılamadı. Lütfen tekrar deneyin.')
      }
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="font-heading text-2xl">Tekrar hoş geldin</CardTitle>
          <CardDescription>Hesabına giriş yap</CardDescription>
        </CardHeader>

        <CardContent>
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
              {errors.email && (
                <p className="text-xs text-accent">{errors.email.message}</p>
              )}
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
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-accent">{errors.password.message}</p>
              )}
            </div>

            {serverError && (
              <p className="text-sm text-accent text-center">{serverError}</p>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Giriş yapılıyor…' : 'Giriş Yap'}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex justify-center text-sm text-foreground/60">
          Hesabın yok mu?&nbsp;
          <Link href="/register" className="text-accent hover:underline">
            Kayıt ol
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/\(auth\)/
git commit -m "feat: add login page with React Hook Form + Zod validation"
```

---

## Task 12: Register Sayfası

**Files:**
- Create: `src/app/(auth)/register/page.tsx`

- [ ] **Step 1: `src/app/(auth)/register/page.tsx` oluştur**

```typescript
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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import api from '@/lib/api'
import type { AuthResponse } from '@/types/auth'

const registerSchema = z.object({
  firstName: z.string().min(2, { message: 'Ad en az 2 karakter olmalıdır' }),
  lastName:  z.string().min(2, { message: 'Soyad en az 2 karakter olmalıdır' }),
  email:     z.string().email({ message: 'Geçerli bir e-posta adresi girin' }),
  password:  z.string().min(6, { message: 'Şifre en az 6 karakter olmalıdır' }),
  accountType: z.enum(['USER', 'BUSINESS']),
})

type RegisterFormData = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const router = useRouter()
  const { isAuthenticated, login } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/')
    }
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
      const response = await api.post<AuthResponse>('/api/v1/auth/register', data)
      const { token, accountType: type } = response.data
      login(token, { email: data.email, accountType: type })
      if (type === 'BUSINESS') {
        router.push('/dashboard')
      } else {
        router.push('/')
      }
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
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
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="font-heading text-2xl">Hesap oluştur</CardTitle>
          <CardDescription>Mahalle esnafına katıl</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Hesap Tipi Seçimi */}
            <div className="space-y-2">
              <Label>Hesap Tipi</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setValue('accountType', 'USER')}
                  className={cn(
                    'flex flex-col items-center gap-2 rounded-lg border p-4 text-sm transition-colors',
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
                    'flex flex-col items-center gap-2 rounded-lg border p-4 text-sm transition-colors',
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
                <Input
                  id="firstName"
                  placeholder="Ahmet"
                  {...register('firstName')}
                />
                {errors.firstName && (
                  <p className="text-xs text-accent">{errors.firstName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Soyad</Label>
                <Input
                  id="lastName"
                  placeholder="Yılmaz"
                  {...register('lastName')}
                />
                {errors.lastName && (
                  <p className="text-xs text-accent">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            {/* E-posta */}
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
              {errors.email && (
                <p className="text-xs text-accent">{errors.email.message}</p>
              )}
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
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-accent">{errors.password.message}</p>
              )}
            </div>

            {serverError && (
              <p className="text-sm text-accent text-center">{serverError}</p>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Kaydediliyor…' : 'Kayıt Ol'}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex justify-center text-sm text-foreground/60">
          Zaten hesabın var mı?&nbsp;
          <Link href="/login" className="text-accent hover:underline">
            Giriş yap
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/\(auth\)/
git commit -m "feat: add register page with account type selector"
```

---

## Task 13: Dashboard Auth Guard + Placeholder

**Files:**
- Create: `src/app/dashboard/layout.tsx`
- Create: `src/app/dashboard/page.tsx`

- [ ] **Step 1: `src/app/dashboard/layout.tsx` oluştur**

```typescript
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login')
    }
  }, [isAuthenticated, router])

  if (!isAuthenticated) return null

  return <>{children}</>
}
```

- [ ] **Step 2: `src/app/dashboard/page.tsx` oluştur**

```typescript
export default function DashboardPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <h1 className="font-heading text-4xl font-bold text-foreground mb-4">
        Esnaf Paneli
      </h1>
      <p className="text-foreground/60 text-lg">
        Sprint 2'de doldurulacak.
      </p>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/
git commit -m "feat: add dashboard auth guard layout and placeholder page"
```

---

## Task 14: Uçtan Uca Doğrulama

**Files:** Değişiklik yok — tarayıcı doğrulaması.

- [ ] **Step 1: Dev sunucusunu başlat**

```bash
npm run dev
```

Beklenen: `▲ Next.js ... Ready in ...ms` — hata yok.

- [ ] **Step 2: Tasarım sistemini doğrula**

Tarayıcıda `http://localhost:3000` aç.

Kontrol et:
- [ ] Header görünüyor: sol "KomsuConnect" (Playfair Display, kırmızı), sağda "Giriş Yap" ve "Kayıt Ol"
- [ ] Arka plan koyu lacivert (`#1a1a2e`)
- [ ] Ana sayfa metni görünüyor

- [ ] **Step 3: Login sayfasını doğrula**

`http://localhost:3000/login` aç.

Kontrol et:
- [ ] Kart görünüyor, koyu yüzey rengi
- [ ] Email ve şifre alanları var, ikonlar görünüyor
- [ ] Şifre göster/gizle butonu çalışıyor
- [ ] Boş submit → Türkçe hata mesajları görünüyor
- [ ] "5" karakterli şifre → "en az 6 karakter" uyarısı
- [ ] "Kayıt ol" linki `/register`'a gidiyor

- [ ] **Step 4: Register sayfasını doğrula**

`http://localhost:3000/register` aç.

Kontrol et:
- [ ] Hesap tipi kartları var: "Bireysel" ve "Esnaf"
- [ ] Birini seçince aksan rengiyle (`#e94560`) vurgulanıyor
- [ ] Ad/Soyad yan yana, email, şifre alanları var
- [ ] Boş submit → Türkçe hata mesajları

- [ ] **Step 5: Auth guard'ı doğrula**

Tarayıcıda `http://localhost:3000/dashboard` aç.

Beklenen: `/login` sayfasına yönlendiriliyorsun.

- [ ] **Step 6: TypeScript kontrolü**

```bash
npx tsc --noEmit
```

Beklenen: Hata yok.

- [ ] **Step 7: Final commit**

```bash
git add .
git commit -m "feat: complete Sprint 1 frontend — auth pages, layout, API layer"
```

---

## Spec Kapsamı Kontrol Listesi

| Gereksinim | Task |
|-----------|------|
| 21st.dev Magic MCP komponentleri | Task 4 |
| Renk paleti + fontlar tailwind'e eklendi | Task 2, 10 |
| Ana layout: header, navigation | Task 9, 10 |
| /login sayfası (React Hook Form + Zod) | Task 11 |
| /register sayfası (hesap tipi seçimi) | Task 12 |
| Axios instance `src/lib/api.ts` | Task 7 |
| Auth Zustand store | Task 6 |
| Login/register → backend endpoint bağlantısı | Task 11, 12 |
| Başarılı girişte role-based redirect | Task 11, 12 |
| Hata durumunda Türkçe mesaj | Task 11, 12 |
| Auth varsa /login → ana sayfaya redirect | Task 11, 12 |
| /dashboard auth guard | Task 13 |
