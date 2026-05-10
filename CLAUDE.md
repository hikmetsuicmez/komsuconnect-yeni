# KomsuConnect — Orchestrator

## Proje Nedir?
KomsuConnect, mahalle esnaflarını ve yerel kullanıcıları dijital ortamda buluşturan bir platform.
Esnaflar profil oluşturur, ürünlerini listeler. Kullanıcılar yakınlarındaki esnafları keşfeder.

## Mimari

```
komsuconnect/
├── CLAUDE.md              ← Sen buradasın (Orchestrator)
├── backend/
│   ├── CLAUDE.md          ← Backend Ajanı kuralları
│   └── (Spring Boot 3 / Java 21)
└── frontend/
    ├── CLAUDE.md          ← Frontend Ajanı kuralları
    └── (Next.js 14 / TypeScript)
```

## Ajanlar ve Sorumlulukları

### Backend Ajanı
- Spring Boot 3, Java 21, PostgreSQL (Supabase)
- REST API tasarımı ve implementasyonu
- Authentication / Authorization (JWT)
- Entity, Repository, Service, Controller katmanları
- `/backend/CLAUDE.md` kurallarına tabidir

### Frontend Ajanı
- Next.js 14, TypeScript, Tailwind CSS
- 21st.dev Magic MCP ile komponent seçimi
- Backend API entegrasyonu
- SSR/SSG ile SEO optimizasyonu
- `/frontend/CLAUDE.md` kurallarına tabidir

### Tester Ajanı (Sprint 3'ten itibaren aktif)
- Backend: JUnit 5 + Mockito
- Frontend: Playwright (E2E)
- Her sprint sonunda kritik akışları test eder

## Branch Stratejisi

- Her sprint için ayrı branch açılır: `sprint/N-kisa-aciklama`
- Sprint bitince `main`'e PR açılır ve merge edilir
- Örnek: `sprint/1-auth`, `sprint/2-business-panel`

**Mevcut aktif branch:** `sprint/5b-backend/features`

## Sprint Planı

### Sprint 1 — Temel & Auth ✅
- [x] Backend: User + Business entity, register/login endpoint, JWT
- [x] Frontend: Auth sayfaları (kayıt/giriş), layout, navigation

### Sprint 2 — Esnaf Paneli ✅
- [x] Backend: Business profil CRUD, Product CRUD
- [x] Frontend: Esnaf dashboard, ürün ekleme/düzenleme

### Sprint 3 — Kullanıcı Tarafı ✅
- [x] Backend: Keşif endpoint'leri, konum bazlı filtreleme
- [x] Frontend: Ana sayfa, esnaf listesi, esnaf profil sayfası, ürün görüntüleme

### Sprint 4 — Cila & Deploy ✅
- [x] Testler (JUnit + Playwright)
- [x] Supabase production setup
- [x] Frontend → Vercel deploy
- [x] Backend → Railway/Render deploy

### Sprint 5a — Tasarım Revizyonu ✅
- [x] Frontend: Dashboard kraft arka plan, koyu sidebar, Alfa Slab başlıklar
- [x] Frontend: Auth sayfaları split-screen layout
- [x] Frontend: Ana sayfa hero section, BusinessCard solid shadow
- [x] Frontend: Business profil gradient hero banner, ProductCard yeniden tasarım
- [x] Frontend: Profil önizleme linki

### Sprint 5b — Backend Özellikleri (aktif — sprint/5b-backend/features)
- [ ] Backend: `category` enum alanı (MARKET, RESTORAN, KAFE, vb.)
- [ ] Backend: `neighborhood` (mahalle) alanı
- [ ] Backend: `workingHours` (çalışma saatleri) alanı
- [ ] Backend: V3 migration — yeni alanlar için veritabanı migrasyonu
- [ ] Backend: Kategori bazlı filtreleme endpoint'i
- [ ] Frontend: Kategori ikonları ana sayfaya eklenmesi
- [ ] Frontend: Mahalle alanı esnaf profil formuna eklenmesi
- [ ] Frontend: Çalışma saatleri gösterimi
- [ ] Frontend: Çift "Ürünlerim" başlığı bug'ı düzeltilmesi

#### Teknik Borçlar
- [ ] **Auth güvenliği:** Token şu an Zustand persist ile localStorage'da tutuluyor.
  - Backend: `POST /api/v1/auth/me` endpoint'i eklenir — sayfa yenilemede token sunucu tarafında doğrulanır.
  - Frontend: localStorage yerine httpOnly cookie'ye geçilir.
- [ ] **Ürün görseli:** `imageUrl` alanı backend'de mevcut fakat Sprint 2'de frontend'e dahil edilmedi.
  - Frontend: Ürün ekleme/düzenleme modalına görsel yükleme özelliği eklenecek.
- [ ] **Kategori ikonları:** Ana sayfa wireframe'inde mevcut, Sprint 5b'de eklenecek.
- [ ] **Çift "Ürünlerim" başlığı:** Dashboard'da tekrarlanan başlık bug'ı, Sprint 5b'de düzeltilecek.

## Genel Kurallar

- Bir ajan diğerinin dizinine müdahale etmez
- API contract değişecekse önce backend ajanı yazar, frontend ajanı adapte olur
- Her sprint sonunda çalışan, demo edilebilir bir ürün olmalı
- Commit mesajları: `feat:`, `fix:`, `refactor:`, `test:` prefix'leri kullanılır
- Environment variable'lar asla commit edilmez, `.env.example` tutulur

## MCP Bağlantıları

- **21st.dev Magic MCP** → Frontend ajanı kullanır
- **Supabase MCP** → Backend ajanı kullanır
- **GitHub MCP** → Orchestrator yönetir

## Definition of Done

Bir task "bitti" sayılır eğer:
1. Kod yazılmış ve çalışıyor
2. Edge case'ler düşünülmüş
3. Commit atılmış
4. İlgili CLAUDE.md güncellenmiş (gerekiyorsa)
