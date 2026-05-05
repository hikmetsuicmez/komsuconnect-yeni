# KomsuConnect — Frontend Ajanı

## Stack
- **Next.js 14** (App Router)
- **TypeScript** (strict mode)
- **Tailwind CSS**
- **21st.dev Magic MCP** (komponent seçimi)
- **Axios** (API istekleri)
- **React Hook Form + Zod** (form validasyonu)
- **Zustand** (global state yönetimi)
- **next/font** (font optimizasyonu)

## Dizin Yapısı

```
src/
├── app/                    ← Next.js App Router sayfaları
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   ├── (main)/
│   │   ├── page.tsx        ← Ana sayfa (esnaf keşif)
│   │   ├── businesses/
│   │   │   └── [id]/       ← Esnaf profil sayfası
│   ├── dashboard/          ← Esnaf paneli (protected)
│   └── layout.tsx
├── components/
│   ├── ui/                 ← 21st.dev'den gelen komponentler
│   └── shared/             ← Projeye özel paylaşılan komponentler
├── lib/
│   ├── api.ts              ← Axios instance
│   └── utils.ts
├── store/                  ← Zustand store'ları
├── types/                  ← TypeScript tip tanımları
└── hooks/                  ← Custom hook'lar
```

## 21st.dev Magic MCP Kullanım Kuralları

- UI komponent ihtiyacı doğduğunda **her zaman** önce 21st.dev'de ara
- Sıfırdan komponent yazmadan önce Magic MCP'ye sor
- Komponentler `src/components/ui/` altına yerleştirilir
- Seçilen komponent projenin renk paletine ve tipografisine uyarlanır
- Generic, "AI slop" görünümlü tasarımlardan kaçın — bold tipografi, özgün renkler

## Tasarım Sistemi

### Renk Paleti
```
Primary:    #1a1a2e  (koyu lacivert — güven, mahalle hissi)
Accent:     #e94560  (canlı kırmızı — CTA'lar, vurgu)
Surface:    #16213e  (card arka planları)
Muted:      #0f3460  (ikincil elementler)
Text:       #eaeaea  (ana metin)
```

### Tipografi
- Heading: `Playfair Display` (otantik, mahalle gazetesi hissi)
- Body: `Inter` (okunabilirlik)
- next/font ile import edilir, Google Fonts CDN kullanılmaz

### Tasarım İlkeleri
- Mobile-first responsive tasarım
- Esnaf kartları: fotoğraf ağırlıklı, büyük tipografi
- Gereksiz animasyon yok — işlevsellik önce gelir
- Dark mode first (renk paletine uygun)

## API Entegrasyonu

- Base URL `.env.local` üzerinden: `NEXT_PUBLIC_API_URL`
- Axios instance `src/lib/api.ts` içinde tanımlanır
- JWT token: `localStorage` değil, `httpOnly cookie` (güvenlik)
- Her istek interceptor ile token ekler
- Hata yönetimi merkezi interceptor'da yapılır

```typescript
// src/lib/api.ts örneği
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
})
```

## Sayfa ve Veri Fetching Kuralları

- Statik sayfa (esnaf listesi, profil): `generateStaticParams` + revalidate
- Dinamik, kullanıcıya özel sayfalar: Client Component + SWR/useEffect
- `"use client"` direktifi sadece gerçekten interaktif olan component'lerde kullanılır
- Server Component'ler mümkün olduğunca korunur (SEO için kritik)

## Form Kuralları

- Form yönetimi: `React Hook Form`
- Schema validasyonu: `Zod`
- Her input'un hata mesajı Türkçe olur
- Submit sırasında loading state gösterilir

## TypeScript Kuralları

- `strict: true` — `any` tipi kullanılmaz
- API response tipleri `src/types/` altında tanımlanır
- Backend DTO'ları ile birebir eşleşen interface'ler yazılır

## State Yönetimi

- Global state (auth, user info): Zustand store
- Server state (API data): React Query veya native fetch + revalidate
- Local UI state: useState yeterli ise Zustand'a taşınmaz

## Yapılmayacaklar

- ❌ `any` tipi kullanma
- ❌ JWT'yi localStorage'da saklama
- ❌ Komponent sıfırdan yazılmadan önce 21st.dev'e bakılmadan geçme
- ❌ `pages/` router kullanma — sadece `app/` router
- ❌ Generic mavi-beyaz tasarım — marka renklerine sadık kal
- ❌ Tüm sayfayı `"use client"` yapma
- ❌ Environment variable'ı hardcode etme

## SEO Kuralları

- Her sayfa için `generateMetadata` fonksiyonu yazılır
- Esnaf profil sayfaları statik generate edilir
- `next/image` kullanılır, düz `<img>` tag'i kullanılmaz
- `alt` attribute'u her zaman dolu olur
