# Sprint 5a — Tasarım Revizyonu Spec

## Özet

Mevcut koyu lacivert ("dark navy") tema, wireframe'lerden türetilen sıcak kraft/kağıt temasıyla değiştiriliyor. Yaklaşım: mevcut semantik Tailwind token adları korunur, yalnızca hex değerleri güncellenir (Token Remap). Sayfa layout'ları wireframe kompozisyonlarına uyarlanır; mevcut işlevsellik (auth, form validation, API entegrasyonu) bozulmadan korunur.

---

## 1. Token Sistemi & Fontlar

### globals.css

```css
@theme inline {
  --color-primary:    #26201A;   /* header, sidebar, koyu zemin */
  --color-accent:     #C2492C;   /* terracotta — CTA butonlar, vurgu */
  --color-surface:    #FFFBEF;   /* kart arka planları */
  --color-muted:      #D4A340;   /* altın — border, ikincil vurgu */
  --color-foreground: #26201A;   /* ana metin */

  --font-heading: var(--font-alfa-slab);
  --font-logo:    var(--font-bagel);
  --font-body:    var(--font-inter);
}

body {
  background-color: #F5EAD4;  /* kraft bej arka plan */
  color: #26201A;
}
```

### layout.tsx font & body sınıfı değişiklikleri

- `Playfair_Display` kaldırılır
- `Alfa_Slab_One` eklenir → `--font-alfa-slab` CSS değişkeni
- `Bagel_Fat_One` eklenir → `--font-bagel` CSS değişkeni
- `Inter` kalır → `--font-inter` CSS değişkeni
- Body className'den `bg-primary` kaldırılır — sayfa arka planı (`#F5EAD4`) globals.css `body` kuralından gelir; `bg-primary` header/sidebar için ayrıca kullanılmaya devam eder
- `--color-foreground` ve `--color-primary` ikisi de `#26201A`'dır — bu kasıtlı: "ink" rengi hem metin hem zemin olarak kullanılıyor

---

## 2. Header

**Dosya**: `src/components/shared/Header.tsx`

- Arka plan: `bg-primary` (`#26201A`)
- Logo: `<span className="font-logo">Komşu</span><span className="font-heading text-accent">Connect</span>` — iki ayrı span, iki farklı font
- Nav linkleri: `text-foreground/70` hover `text-foreground` (krem/bej tonlar)
- Giriş Yap: sade text link
- Kayıt Ol / Esnaf Paneli: `bg-accent` terracotta buton
- Mevcut auth dallanma mantığı değişmez

---

## 3. Ana Sayfa (`/`)

**Dosya**: `src/app/page.tsx`, `src/components/businesses/BusinessCard.tsx`, `src/components/businesses/CityFilter.tsx`

### Hero Section
- Tam genişlik bej alan (`bg-[#F5EAD4]`)
- Başlık: Alfa Slab One, büyük — *"Mahallenin esnafı, bir tıkla."*
- Alt metin: Inter, `text-foreground/60`
- Kategori ikonları yok

### Şehir Filtresi
- Mevcut `CityFilter` korunur
- Seçili şehir: `bg-accent text-white`
- Seçilmemiş: `border-muted text-foreground/70`

### BusinessCard
- `bg-surface` (`#FFFBEF`)
- Border: `border border-muted`
- Shadow: `shadow-[3px_3px_0_#26201A]` — solid kraft efekti
- Esnaf adı: Alfa Slab One (`font-heading`)
- Şehir + ürün sayısı: `text-foreground/60` Inter
- "İncele" butonu: `bg-accent text-white`

---

## 4. Login & Register Sayfaları

**Dosyalar**: `src/app/(auth)/login/page.tsx`, `src/app/(auth)/register/page.tsx`

### Layout
- **İki sütunlu split-screen** (tam ekran yüksekliği)
- Sol panel: `bg-primary` (`#26201A`), `hidden md:flex`
  - Büyük Alfa Slab One başlık: *"HOŞ GELDİN. MAHALLENE"*
  - Açıklama metni Inter krem
  - Logo tekrarı
- Sağ panel: `bg-[#F5EAD4]`
  - Mevcut form Card wrapper'sız, panel içinde ortalanmış
  - Input, Label, Button token rengine uyarlanmış
  - Hata mesajları `text-accent`

### Kapsam dışı
- Mahalle alanı eklenmez

### Değişmeyen
- `react-hook-form` + `zod` validation
- `useAuth` hook, router redirect mantığı
- Tüm Türkçe hata mesajları

---

## 5. Esnaf Profil Sayfası (`/businesses/[id]`)

**Dosyalar**: `src/app/businesses/[id]/page.tsx`, `src/components/businesses/ProductCard.tsx`

### Full-bleed Hero Banner
- `w-full h-48` gradient banner
- Gradyan: `from-[#D4A340] via-[#C2492C]/80 to-[#26201A]` (sol→sağ diagonal)
- Üzerinde esnaf adı: Alfa Slab One, `text-white`, overlay olarak
- Gerçek kapak görseli yok — placeholder gradient kullanılır

### Geri Link
- Hero'nun hemen üstünde: `← Ana sayfa` — `text-foreground/60`, hover `text-foreground`

### Esnaf Detayları
- Hero altında `bg-surface` (`#FFFBEF`) kart
- Şehir, adres, telefon — mevcut emoji ikonlar korunur
- Açıklama metni Inter

### Ürünler
- Başlık: Alfa Slab One, `text-muted` (altın)
- ProductCard: `bg-surface`, `shadow-[3px_3px_0_#26201A]`, BusinessCard ile tutarlı

### Kapsam dışı
- Çalışma saatleri eklenmez

---

## 6. Esnaf Paneli (`/dashboard`)

**Dosyalar**: `src/components/dashboard/Sidebar.tsx`, `src/app/dashboard/layout.tsx`, `src/app/dashboard/profile/page.tsx`, `src/app/dashboard/products/page.tsx`

### Genel Arka Plan
- `bg-[#F5EAD4]` kraft bej (dashboard layout ve sayfalar)

### Sidebar
- `bg-primary` (`#26201A`) koyu kahve
- Metin: `text-[#FFFBEF]`
- Aktif link: terracotta sol border + `bg-accent/10`
- "Panel" etiket: `text-muted` (altın)
- Mevcut Profil + Ürünlerim nav yapısı korunur

### Sayfa Başlıkları
- Profil sayfası: `Pano — {businessName}` — Alfa Slab One
- Ürünler sayfası: `Ürünlerim` — Alfa Slab One

### "Profili Önizle" Butonu
- Profil sayfasına eklenir
- `/businesses/{id}` sayfasına yönlendirir
- Outline terracotta buton

### İçerik Kartları
- ProfileForm, ProductTable wrapper: `bg-surface`, `shadow-[3px_3px_0_#26201A]`

### Kapsam dışı
- Yapılacaklar listesi, mesajlar, sokak şirvali, veresiye, yeni mesaj eklenmez

### Değişmeyen
- Auth guard (`sessionChecked`, `isAuthenticated`, rol kontrolü)
- ProfileForm, ProductTable, ProductModal işlevselliği

---

## 7. UI Komponentleri

**Dosyalar**: `src/components/ui/button.tsx`, `src/components/ui/card.tsx`, `src/components/ui/input.tsx`

### Button
- `default`: `bg-accent text-white` — token değeri değişince otomatik güncellenir
- `outline`: `border-muted text-foreground hover:bg-surface` — altın border
- `ghost`: `hover:bg-surface text-foreground`
- Sınıf adlarına dokunulmaz, token remap yeterli

### Card
- `border-muted` → altın border (`#D4A340`)
- `bg-surface` → `#FFFBEF`
- `shadow-sm` → `shadow-[3px_3px_0_#26201A]`

### Input
- `border-muted` altın border
- `bg-surface` krem arka plan
- `text-foreground` koyu kahve metin
- `focus:ring-accent` terracotta focus ring
- `placeholder:text-foreground/40`

---

## Dosya Değişiklik Listesi

| Dosya | Değişiklik türü |
|---|---|
| `src/app/globals.css` | Token remap + font değişkeni |
| `src/app/layout.tsx` | Font import (Alfa Slab One, Bagel Fat One) |
| `src/components/shared/Header.tsx` | Logo, renkler |
| `src/app/page.tsx` | Hero section ekleme |
| `src/components/businesses/BusinessCard.tsx` | Solid shadow, font |
| `src/components/businesses/CityFilter.tsx` | Renk uyarlama |
| `src/components/businesses/ProductCard.tsx` | Solid shadow |
| `src/app/(auth)/login/page.tsx` | Split-screen layout |
| `src/app/(auth)/register/page.tsx` | Split-screen layout |
| `src/app/businesses/[id]/page.tsx` | Hero banner, geri link |
| `src/components/dashboard/Sidebar.tsx` | Renkler |
| `src/app/dashboard/layout.tsx` | Arka plan rengi |
| `src/app/dashboard/profile/page.tsx` | Başlık, Profili Önizle butonu |
| `src/app/dashboard/products/page.tsx` | Başlık |
| `src/components/ui/card.tsx` | Shadow, border |
| `src/components/ui/input.tsx` | Border, bg, focus |

---

## Definition of Done

- Tüm sayfalar yeni renk paletini kullanıyor
- Alfa Slab One başlıklarda, Bagel Fat One logo'da aktif
- Mevcut tüm işlevsellik çalışıyor (auth, form submit, API calls)
- TypeScript hata yok
- Responsive davranış korunuyor (md: breakpoint)
