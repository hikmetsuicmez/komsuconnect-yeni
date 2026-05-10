# Sprint 5b Backend Design — Category, Neighborhood, WorkingHours

## Overview

BusinessProfile entity'e üç yeni alan ekleniyor: `category` (enum), `neighborhood` (string) ve `workingHours` (string). GET /api/v1/businesses endpoint'i `category` query parametresiyle filtreleme destekliyor.

---

## 1. Veri Katmanı

### BusinessCategory Enum

`com.hikmetsuicmez.komsuconnect_backend.entity.BusinessCategory` olarak eklenir.

```java
public enum BusinessCategory {
    BAKERY, BUTCHER, GROCERY, MARKET, CAFE, FLORIST, HABERDASHER, REPAIR, OTHER
}
```

`@Enumerated(EnumType.STRING)` ile saklanır — sıra numarası değil, isim string olarak veritabanında tutulur.

### BusinessProfile Entity Değişiklikleri

Mevcut alanlara ek olarak:

| Alan | Tip | Kısıtlar |
|---|---|---|
| `category` | `BusinessCategory` | nullable, `@Enumerated(STRING)` |
| `neighborhood` | `String` | nullable, `@Column(length = 100)` |
| `workingHours` | `String` | nullable, `@Column(length = 100)` |

`category` DB'de `NULL` olarak saklanabilir; service create sırasında null gelirse `OTHER` atanır.

### V3 Flyway Migration

Dosya: `src/main/resources/db/migration/V3__add_business_fields.sql`

```sql
ALTER TABLE business_profiles
  ADD COLUMN category      VARCHAR(50),
  ADD COLUMN neighborhood  VARCHAR(100),
  ADD COLUMN working_hours VARCHAR(100);
```

Mevcut kayıtlar `NULL` olarak kalır — geriye dönük uyumlu.

### BusinessProfileRepository Değişiklikleri

Kaldırılanlar:
- `findAllWithUser()`
- `findAllByCity(String city)`

Eklenen:
```java
@Query("""
    SELECT bp FROM BusinessProfile bp
    JOIN FETCH bp.user
    WHERE (:city IS NULL OR LOWER(bp.city) = LOWER(:city))
      AND (:category IS NULL OR bp.category = :category)
    """)
List<BusinessProfile> findAllFiltered(
    @Param("city") String city,
    @Param("category") BusinessCategory category);
```

---

## 2. DTO ve API Katmanı

### Request DTO'ları

`CreateBusinessProfileRequest` ve `UpdateBusinessProfileRequest`'e eklenenler:

```java
private BusinessCategory category;   // nullable — null gelirse service OTHER atar

@Size(max = 100)
private String neighborhood;

@Size(max = 100)
private String workingHours;
```

### Response DTO'ları

`BusinessProfileResponse` ve `BusinessProfileDetailResponse`'a eklenenler:

```java
private BusinessCategory category;
private String neighborhood;
private String workingHours;
```

`BusinessProfileMapper` (MapStruct) yeni alanları otomatik map eder; alan adları eşleştiği için ek `@Mapping` gerekmez. `getBusinessById` metodundaki manuel builder çağrısına 3 alan eklenir.

### Controller — GET /api/v1/businesses

```java
@GetMapping
public ResponseEntity<List<BusinessProfileResponse>> getAllBusinesses(
    @RequestParam(required = false) String city,
    @RequestParam(required = false) BusinessCategory category)
```

Örnek çağrılar:
- `GET /api/v1/businesses` → tüm kayıtlar
- `GET /api/v1/businesses?city=istanbul` → şehir filtresi
- `GET /api/v1/businesses?category=BAKERY` → kategori filtresi
- `GET /api/v1/businesses?city=istanbul&category=CAFE` → her ikisi

Geçersiz category string'i (`?category=INVALID`) → Spring `400 Bad Request` döner (otomatik enum binding).

### Service — getAllBusinesses İmzası

```java
public List<BusinessProfileResponse> getAllBusinesses(String city, BusinessCategory category)
```

İç implementasyon:
```java
List<BusinessProfile> profiles = businessProfileRepository.findAllFiltered(city, category);
```

`createBusinessProfile` içinde:
```java
.category(request.getCategory() != null ? request.getCategory() : BusinessCategory.OTHER)
.neighborhood(request.getNeighborhood())
.workingHours(request.getWorkingHours())
```

---

## 3. Test Stratejisi

### Güncellenen Testler

| Eski mock | Yeni mock |
|---|---|
| `findAllWithUser()` | `findAllFiltered(null, null)` |
| `findAllByCity("Istanbul")` | `findAllFiltered("Istanbul", null)` |

### Yeni Test Vakaları

| Test adı | Senaryo |
|---|---|
| `getAllBusinesses_withCategory_returnsFilteredByCategory` | city=null, category=BAKERY |
| `getAllBusinesses_withCityAndCategory_returnsFiltered` | city=Istanbul, category=CAFE |
| `createBusinessProfile_withNullCategory_defaultsToOther` | category null → OTHER atanır |
| `createBusinessProfile_withExplicitCategory_setsCategory` | category=BAKERY → BAKERY saklanır |
| `updateBusinessProfile_updatesAllNewFields` | neighborhood ve workingHours güncellenir |

Tüm testler JUnit 5 + Mockito ile service katmanında unit test olarak yazılır.

---

## Değişmeyen Şeyler

- `findByUserId`, `existsByUserId`, `findDistinctCities`, `findByIdWithUser` repository metodları olduğu gibi kalır.
- Auth, Product, User katmanlarına dokunulmaz.
- Public endpoint listesi değişmez.
- API base path `/api/v1/` değişmez.
