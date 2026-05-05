# KomsuConnect — Backend Ajanı

## Stack
- **Java 21**
- **Spring Boot 3.x**
- **PostgreSQL** (Supabase üzerinde)
- **Spring Security + JWT**
- **Spring Data JPA / Hibernate**
- **Lombok**
- **MapStruct** (DTO dönüşümleri için)
- **Maven**

## Mimari: Katmanlı Yapı

```
controller/     ← HTTP isteklerini karşılar, DTO alır/döner
service/        ← İş mantığı buradadır
repository/     ← JPA repository'leri
entity/         ← Veritabanı entity'leri
dto/
  request/      ← Gelen DTO'lar
  response/     ← Giden DTO'lar
security/       ← JWT filter, config
exception/      ← Global exception handler
config/         ← Bean tanımları, CORS, vb.
```

## Naming Conventions

- Entity: `User`, `BusinessProfile`, `Product`
- Repository: `UserRepository`, `BusinessProfileRepository`
- Service: `UserService`, `BusinessProfileService`
- Controller: `AuthController`, `BusinessController`, `ProductController`
- Request DTO: `RegisterRequest`, `CreateProductRequest`
- Response DTO: `UserResponse`, `BusinessProfileResponse`

## Entity Kuralları

- Her entity'de `@CreatedDate` ve `@LastModifiedDate` olur (Spring Data Auditing)
- Primary key: `UUID` tipinde, `@GeneratedValue(strategy = GenerationType.UUID)`
- Soft delete gerekirse: `deletedAt` alanı eklenir, fiziksel silme yapılmaz
- İlişkiler LAZY fetch ile tanımlanır (N+1 probleminden kaçınmak için)

## API Tasarım Kuralları

- Base path: `/api/v1/`
- Auth endpoint'leri: `/api/v1/auth/register`, `/api/v1/auth/login`
- Business endpoint'leri: `/api/v1/businesses`
- Product endpoint'leri: `/api/v1/businesses/{businessId}/products`
- HTTP metodları doğru kullanılır: GET (okuma), POST (oluşturma), PUT (güncelleme), DELETE (silme)
- Response her zaman `ResponseEntity<>` döner
- Hata durumları için global `@RestControllerAdvice` kullanılır

## Güvenlik Kuralları

- JWT token süresi: 24 saat (access), 7 gün (refresh)
- Şifre: `BCryptPasswordEncoder` ile hash'lenir, düz metin asla saklanmaz
- Public endpoint'ler açıkça tanımlanır, geri kalan her şey authenticated
- Public endpoint'ler: `/api/v1/auth/**`, `/api/v1/businesses` (GET), `/api/v1/businesses/{id}` (GET)
- CORS: Frontend URL'i için açık, diğerleri kapalı

## DTO Kuralları

- Entity asla controller'dan dışarı çıkmaz, her zaman DTO döner
- MapStruct mapper'ları `@Mapper(componentModel = "spring")` ile tanımlanır
- Request DTO'larında `@Valid` anotasyonu ile validasyon yapılır
- `@NotBlank`, `@Email`, `@Size` gibi constraint'ler Request DTO'larında olur

## Supabase / Database Kuralları

- Schema yönetimi: Flyway migration ile (`db/migration/V1__init.sql`)
- Connection pool: HikariCP (Spring Boot default)
- Supabase bağlantısı `.env` üzerinden, asla hardcode edilmez

## Yapılmayacaklar

- ❌ Entity'yi doğrudan response olarak döndürme
- ❌ İş mantığını Controller'a yazma
- ❌ `System.out.println` kullanma, her zaman `@Slf4j` + log
- ❌ Şifreyi düz metin saklama veya loglama
- ❌ `@Transactional` anotasyonunu gereksiz yere her yere ekleme
- ❌ Hardcoded URL, port, şifre

## Test Kuralları (Sprint 3'ten itibaren)

- Service katmanı unit test: JUnit 5 + Mockito
- Test naming: `methodName_StateUnderTest_ExpectedBehavior`
- Her kritik business logic için en az 1 happy path + 1 edge case testi
