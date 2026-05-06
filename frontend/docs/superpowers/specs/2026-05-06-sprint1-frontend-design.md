# Sprint 1 Frontend — Design Spec

**Tarih:** 2026-05-06  
**Proje:** KomsuConnect Frontend  
**Sprint:** 1 — Temel Auth & Layout

---

## Amaç

KomsuConnect'in ilk çalışan frontend'ini oluşturmak:
- Auth sayfaları (login, register)
- Ana layout ve navigasyon
- Zustand tabanlı auth state yönetimi
- Axios API entegrasyonu
- Backend `/api/v1/auth` endpoint'lerine bağlantı

---

## Mimari Kararlar

### Auth Koruma Stratejisi: Layout-level Client Guard
Token yalnızca Zustand store'da (in-memory) tutulduğu için Next.js Middleware kullanılamaz — middleware server-side çalışır ve client-side Zustand store'u okuyamaz. Bunun yerine `/dashboard/layout.tsx` bir Client Component olarak auth guard görevi görür.

### Token Saklama
- Zustand store'da in-memory (persist middleware YOK)
- localStorage veya httpOnly cookie kullanılmaz
- Sayfa yenilenince oturum sıfırlanır (in-memory tercihinin doğal sonucu)

### Role-based Redirect
Login sonrası:
- `BUSINESS` → `/dashboard`
- `USER` → `/` (ana sayfa)

---

## Dizin Yapısı

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx          ← public, auth varsa → / yönlendir
│   │   └── register/page.tsx       ← public, auth varsa → / yönlendir
│   ├── dashboard/
│   │   ├── layout.tsx              ← "use client" auth guard, token yoksa → /login
│   │   └── page.tsx                ← Sprint 2 placeholder
│   ├── layout.tsx                  ← root layout: fontlar, Header
│   ├── page.tsx                    ← ana sayfa placeholder
│   └── globals.css                 ← renk paleti CSS variables + fontlar
├── components/
│   ├── ui/
│   │   ├── button.tsx              ← 21st.dev / Radix primitif
│   │   ├── input.tsx               ← 21st.dev / Radix primitif
│   │   ├── label.tsx               ← 21st.dev / Radix primitif
│   │   └── card.tsx                ← 21st.dev / Radix primitif
│   └── shared/
│       └── Header.tsx              ← custom navigasyon
├── lib/
│   ├── api.ts                      ← Axios instance + interceptor'lar
│   └── utils.ts                    ← cn() yardımcı fonksiyonu
├── store/
│   └── authStore.ts                ← Zustand store
├── types/
│   └── auth.ts                     ← TypeScript tip tanımları
└── hooks/
    └── useAuth.ts                  ← Zustand'dan convenience hook
```

---

## Veri Modeli

```typescript
// src/types/auth.ts

interface LoginRequest {
  email: string
  password: string
}

interface RegisterRequest {
  firstName: string
  lastName: string
  email: string
  password: string
  accountType: 'USER' | 'BUSINESS'
}

interface AuthResponse {
  token: string
  accountType: 'USER' | 'BUSINESS'
}

interface User {
  email: string
  accountType: 'USER' | 'BUSINESS'
}
```

---

## Zustand Store

```typescript
// src/store/authStore.ts
interface AuthState {
  token: string | null
  user: User | null
  isAuthenticated: boolean
  login: (token: string, user: User) => void
  logout: () => void
}
```

- `persist` middleware kullanılmaz
- `login()`: token + user set eder, `isAuthenticated: true`
- `logout()`: tüm state'i sıfırlar

---

## Axios Instance

```typescript
// src/lib/api.ts
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: false,
})
```

**Request interceptor:** Zustand store'dan token alır, `Authorization: Bearer <token>` header ekler.  
**Response interceptor:** 401 gelirse `logout()` çağırır ve `/login`'e yönlendirir.

---

## API Endpoint'leri

| Method | Path | Request Body | Response |
|--------|------|-------------|----------|
| POST | `/api/v1/auth/login` | `LoginRequest` | `AuthResponse` |
| POST | `/api/v1/auth/register` | `RegisterRequest` | `AuthResponse` |

---

## Sayfa Davranışları

### `/login`
- Email + şifre formu (React Hook Form + Zod)
- Zod schema: email format, şifre min 6 karakter — Türkçe hata mesajları
- Submit → POST `/api/v1/auth/login`
  - 200: store'a kaydet → BUSINESS→`/dashboard`, USER→`/`
  - Hata: form altında inline Türkçe mesaj
- Zaten auth ise: `/` yönlendir

### `/register`
- Ad, Soyad, Email, Şifre alanları
- Hesap tipi: 2 büyük toggle card ("Bireysel" / "Esnaf")
- Zod schema: ad/soyad min 2 karakter, email format, şifre min 6 karakter — Türkçe
- Submit → POST `/api/v1/auth/register`
  - 200: store'a kaydet → BUSINESS→`/dashboard`, USER→`/`
  - Hata: inline Türkçe mesaj
- Zaten auth ise: `/` yönlendir

### `/dashboard`
- `layout.tsx`: token yoksa `/login`'e yönlendir
- `page.tsx`: Sprint 2 placeholder içeriği

---

## Tasarım Sistemi

### Renk Paleti (Tailwind v4 CSS variables — globals.css)
```css
@theme inline {
  --color-primary:    #1a1a2e;
  --color-accent:     #e94560;
  --color-surface:    #16213e;
  --color-muted:      #0f3460;
  --color-foreground: #eaeaea;
}
```

### Fontlar
- Heading: `Playfair Display` — `--font-heading`
- Body: `Inter` — `--font-body`
- `next/font/google` ile import edilir (CDN yok)

### Komponentler (21st.dev'den)
- `Button`, `Input`, `Label`, `Card` — Radix primitifleri, shadcn/ui uyumlu
- Login card tasarım deseni: dark backdrop, fade-up animasyonu, icon'lu input'lar
- `Header`: custom, marka renklerine uygun

---

## npm Paketleri (Kurulacak)

```
axios
zustand
react-hook-form
zod
@hookform/resolvers
lucide-react
class-variance-authority
@radix-ui/react-slot
@radix-ui/react-label
clsx
tailwind-merge
```

---

## Kapsam Dışı (Sprint 2+)

- Dashboard içeriği (esnaf paneli)
- httpOnly cookie auth
- Token refresh mekanizması
- Şifremi unuttum
- OAuth (GitHub, Google)
- Ana sayfa (esnaf keşif) içeriği
