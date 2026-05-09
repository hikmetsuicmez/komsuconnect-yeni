# Sprint 4 Backend Design — KomsuConnect

**Date:** 2026-05-09
**Branch:** sprint/4-polish-deploy
**Scope:** Auth güvenliği (httpOnly cookie), imageUrl validasyonu, Render deploy hazırlığı, Playwright E2E test senaryoları

---

## 1. Auth Güvenliği — httpOnly Cookie (Hibrit)

### Strateji

Hibrit yaklaşım: token hem JSON response body'de korunur (mevcut frontend uyumluluğu) hem de httpOnly cookie olarak set edilir. Tüm endpointler önce `Authorization: Bearer` header'ına bakar, bulamazsa `jwt-token` cookie'sine döner.

### Değişecek Dosyalar

**`JwtAuthenticationFilter`**
- `extractToken()` genişler: önce `Authorization: Bearer` header, yoksa `jwt-token` cookie.

**`AuthController`**
- `login()` ve `register()` metodlarına `HttpServletResponse` parametresi eklenir.
- Service'ten dönen token, response body'de korunur ve ek olarak cookie set edilir.
- Cookie özellikleri:
  - `HttpOnly: true`
  - `Secure: true` (HTTPS zorunlu)
  - `SameSite: Lax`
  - `Path: /api`
  - `Max-Age: 86400` (token expiry ile eşleşir)

**Yeni: `POST /api/v1/auth/me`**
- Cookie veya header'dan token alır (filter otomatik handle eder).
- `SecurityContextHolder`'dan authenticated kullanıcıyı döner.
- Response: `{ email, fullName, role }` — token dönmez.
- Amaç: sayfa yenilemede frontend session restore.

**Yeni: `POST /api/v1/auth/logout`**
- `Max-Age: 0` ile cookie sıfırlar.
- `200 OK` döner.

**`SecurityConfig`**
- `/api/v1/auth/**` wildcard zaten `/me` ve `/logout`'u kapsar, ekstra rule gerekmez.
- `/me` çağrısı authenticated gerektirir; filter cookie/header'dan token alacağından bu otomatik çalışır.

---

## 2. imageUrl Desteği

### Durum: Backend Tamamlanmış

Aşağıdaki bileşenler zaten `imageUrl` içeriyor:
- `Product` entity: `@Column(length = 500) private String imageUrl`
- `CreateProductRequest`: `private String imageUrl`
- `UpdateProductRequest`: `private String imageUrl`
- `ProductResponse`: `private String imageUrl`

### Sprint 4'te Yapılacak

`CreateProductRequest` ve `UpdateProductRequest`'e URL format validasyonu eklenir:

```java
@Pattern(
    regexp = "^(https?://.*)?$",
    message = "imageUrl geçerli bir HTTP/HTTPS URL'i olmalı"
)
private String imageUrl;
```

Boş/null geçilebilir (ürünün görseli olmayabilir), dolu gelirse HTTP veya HTTPS ile başlamak zorunda.

Asıl iş **frontend tarafında**: ürün ekleme/düzenleme modalına `imageUrl` input alanı eklenmesi.

---

## 3. Render Deploy Hazırlığı

### Dockerfile (Çok Aşamalı)

- **Stage 1 (`builder`):** `maven:3.9-eclipse-temurin-21` — `mvn package -DskipTests`
- **Stage 2 (`runtime`):** `eclipse-temurin:21-jre-alpine` — jar kopyalanır, `EXPOSE 8080`, `ENTRYPOINT`
- Final image ~180 MB.

### render.yaml

```yaml
services:
  - type: web
    name: komsuconnect-backend
    env: docker
    plan: free
    healthCheckPath: /api/v1/health
    envVars:
      - key: DB_URL
        sync: false
      - key: DB_USERNAME
        sync: false
      - key: DB_PASSWORD
        sync: false
      - key: JWT_SECRET
        sync: false
      - key: CORS_ALLOWED_ORIGINS
        sync: false
```

### application-prod.yml

Spring profili `prod` olarak aktive edilir (`SPRING_PROFILES_ACTIVE=prod`).
- `server.port: ${PORT:8080}` — Render `PORT` env variable'ını override eder.
- `show-sql: false`
- `ddl-auto: validate`
- Logging level: `INFO` (root), `WARN` (hibernate)

### Health Endpoint

`GET /api/v1/health` → `200 OK { "status": "UP" }` — Actuator bağımlılığı gerekmez, minimal controller.

### .env.example Güncellemesi

```
DB_URL=jdbc:postgresql://db.xxxx.supabase.co:5432/postgres
DB_USERNAME=postgres
DB_PASSWORD=db_password
JWT_SECRET=your-secret-key-must-be-at-least-32-characters-long
CORS_ALLOWED_ORIGINS=https://komsuconnect.vercel.app
PORT=8080
SPRING_PROFILES_ACTIVE=prod
```

---

## 4. Playwright E2E Test Senaryoları

Tüm dosyalar `frontend/e2e/` dizininde.

### `e2e/auth/register.spec.ts`

| Senaryo | Adımlar | Beklenti |
|---------|---------|----------|
| Happy path | Geçerli bilgilerle form doldur → Submit | Dashboard'a yönlenme |
| Duplicate email | Kayıtlı email ile tekrar kayıt | Hata mesajı görünür |
| Kısa şifre | 5 karakter şifre | Form validasyon mesajı |

### `e2e/auth/login.spec.ts`

| Senaryo | Adımlar | Beklenti |
|---------|---------|----------|
| Happy path | Geçerli credentials → Submit | Dashboard'a yönlenme |
| Yanlış şifre | Doğru email, yanlış şifre | Hata mesajı görünür |
| Kayıtsız email | Olmayan email | Hata mesajı görünür |
| Session restore | Login → Sayfayı yenile | Oturum korunur (/me endpoint) |

### `e2e/business/profile.spec.ts`

| Senaryo | Adımlar | Beklenti |
|---------|---------|----------|
| Happy path | BUSINESS rolü ile giriş → Profil formu doldur → Kaydet | Profil sayfasında veriler görünür |
| Zorunlu alan boş | Profil formu eksik → Submit | Form submit olmaz |
| Role guard | USER rolü ile /dashboard | Erişim engellenir veya yönlenme |

### `e2e/business/product.spec.ts`

| Senaryo | Adımlar | Beklenti |
|---------|---------|----------|
| Ürün ekleme | Modal aç → Doldur → Kaydet | Ürün listede görünür |
| Ürün düzenleme | Listeden seç → Değiştir → Kaydet | Güncel bilgi listede |
| imageUrl ile ürün | URL gir → Kaydet | Görsel listede render edilir |
| Sıfır fiyat | Fiyat = 0 → Submit | Validasyon hatası |

Her test dosyası `beforeEach` içinde `page.request` ile direkt API üzerinden login yapar (fixture pattern).

---

## Uygulama Sırası

1. `JwtAuthenticationFilter` — cookie desteği
2. `AuthController` — cookie set + `/me` + `/logout`
3. `HealthController` — basit health endpoint
4. imageUrl URL validasyonu (DTO'lar)
5. `Dockerfile` + `render.yaml` + `application-prod.yml`
6. `.env.example` güncelle
7. Playwright test dosyaları (frontend dizininde)
