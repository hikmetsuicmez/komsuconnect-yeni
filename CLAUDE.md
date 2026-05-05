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

## Sprint Planı

### Sprint 1 — Temel & Auth
- [ ] Backend: User + Business entity, register/login endpoint, JWT
- [ ] Frontend: Auth sayfaları (kayıt/giriş), layout, navigation

### Sprint 2 — Esnaf Paneli
- [ ] Backend: Business profil CRUD, Product CRUD
- [ ] Frontend: Esnaf dashboard, ürün ekleme/düzenleme

### Sprint 3 — Kullanıcı Tarafı
- [ ] Backend: Keşif endpoint'leri, konum bazlı filtreleme
- [ ] Frontend: Ana sayfa, esnaf listesi, esnaf profil sayfası, ürün görüntüleme

### Sprint 4 — Cila & Deploy
- [ ] Testler (JUnit + Playwright)
- [ ] Supabase production setup
- [ ] Frontend → Vercel deploy
- [ ] Backend → Railway/Render deploy

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
