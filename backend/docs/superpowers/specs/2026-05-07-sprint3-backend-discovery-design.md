# Sprint 3 — Backend Discovery Endpoints & Tests Design

**Date:** 2026-05-07  
**Branch:** sprint/3-user-discovery  
**Scope:** Keşif endpoint'leri, BusinessProfileDetailResponse, cities endpoint, JUnit testleri

---

## 1. Genel Bakış

Sprint 3 backend görevi: kullanıcı tarafının ihtiyaç duyduğu keşif endpoint'lerini eklemek ve Sprint 3'te başlayan test borcunu kapatmak. Mevcut `BusinessController` ve `BusinessProfileService` genişletilir; yeni DTO ve repository sorguları eklenir.

---

## 2. Response DTO Değişiklikleri

### `BusinessProfileResponse` (mevcut — değişiklik)
`productCount: long` alanı eklenir. Liste endpoint'lerinde kullanılmaya devam eder.

### `BusinessProfileDetailResponse` (yeni DTO)
Detay endpoint'i (`GET /api/v1/businesses/{id}`) için ayrı DTO:

```
id:            UUID
userId:        UUID
businessName:  String
description:   String
address:       String
city:          String
phone:         String
createdAt:     LocalDateTime
updatedAt:     LocalDateTime
productCount:  long
products:      List<ProductResponse>
```

Mapper computed field limitation nedeniyle `productCount` ve `products` alanları service katmanında manuel set edilir (MapStruct `@AfterMapping` kullanılmaz).

---

## 3. Repository Katmanı

### `BusinessProfileRepository` — yeni sorgular

```java
// Şehre göre filtreli liste (case-insensitive)
@Query("SELECT bp FROM BusinessProfile bp JOIN FETCH bp.user " +
       "WHERE LOWER(bp.city) = LOWER(:city)")
List<BusinessProfile> findAllByCity(@Param("city") String city);

// Unique şehirler (null ve boş değerler hariç, alfabetik)
@Query("SELECT DISTINCT bp.city FROM BusinessProfile bp " +
       "WHERE bp.city IS NOT NULL AND bp.city <> '' ORDER BY bp.city")
List<String> findDistinctCities();
```

`findAllWithUser()` mevcut halde kalır (city filtresi yokken kullanılır). Detay endpoint'i için ayrı `findByIdWithUser` eklenmez — `BusinessProfileDetailResponse` user bilgisi taşımadığından mevcut `findById` yeterlidir.

### `ProductRepository` — yeni sorgu

```java
// Batch count — tüm business'lar için tek sorguda
@Query("SELECT p.businessProfile.id, COUNT(p) FROM Product p GROUP BY p.businessProfile.id")
List<Object[]> findProductCountsByBusinessProfile();
```

`findByBusinessProfileId()` mevcut halde kalır.

---

## 4. Service Katmanı

### `BusinessProfileService` değişiklikleri

**`getAllBusinesses(String city)`**  
- `city` null ise `findAllWithUser()`, dolu ise `findAllByCity(city)` çağrılır.  
- `findProductCountsByBusinessProfile()` sonucu `Map<UUID, Long>` olarak dönüştürülür.  
- Her response'a `map.getOrDefault(id, 0L)` ile `productCount` set edilir.

**`getBusinessById(UUID id)` → `BusinessProfileDetailResponse`**  
- `findById(id)` (mevcut `findProfileOrThrow`) ile business çekilir.  
- `productRepository.findByBusinessProfileId(id)` ile ürünler çekilir.  
- `productCount`, ürün listesinin `size()` değerinden set edilir.  
- `BusinessProfileDetailResponse` build edilip döner.

**`getCities()` (yeni)**  
- `businessProfileRepository.findDistinctCities()` çağrılır.  
- `List<String>` döner.

---

## 5. Controller Katmanı

### `BusinessController` değişiklikleri

```
GET /api/v1/businesses?city={city}   → getAllBusinesses(@RequestParam(required=false) String city)
GET /api/v1/businesses/{id}          → getBusinessById(UUID id)  [dönüş tipi BusinessProfileDetailResponse]
GET /api/v1/businesses/cities        → getCities()
```

**Sıralama notu:** `/cities` ve `/me` exact match olduğu için `/{id}` (UUID) ile çakışmaz. Spring MVC exact path'leri template'lerden önce eşleştirir.

### `SecurityConfig` değişikliği

```java
.requestMatchers(HttpMethod.GET,
    "/api/v1/businesses",
    "/api/v1/businesses/{id}",
    "/api/v1/businesses/{id}/products",
    "/api/v1/businesses/cities")     // ← eklenir
.permitAll()
```

---

## 6. JUnit Testleri

Test framework: JUnit 5 + Mockito (`@ExtendWith(MockitoExtension.class)`).  
Naming: `methodName_StateUnderTest_ExpectedBehavior`.

### `AuthServiceTest`
- `register_withValidRequest_returnsAuthResponse`
- `register_withExistingEmail_throwsEmailAlreadyExistsException`
- `login_withValidCredentials_returnsAuthResponse`
- `login_withInvalidCredentials_throwsException`

### `BusinessProfileServiceTest`
- `getAllBusinesses_withNoCity_returnsAllWithProductCount`
- `getAllBusinesses_withCity_returnsFilteredBusinesses`
- `getBusinessById_withExistingId_returnsDetailResponse`
- `getBusinessById_withNonExistingId_throwsNotFoundException`
- `createBusinessProfile_withValidRequest_returnsCreatedProfile`
- `createBusinessProfile_withDuplicateProfile_throwsAlreadyExistsException`
- `updateBusinessProfile_withWrongOwner_throwsForbiddenException`
- `getCities_returnsDistinctCities`

### `ProductServiceTest`
- `getProducts_withValidBusinessId_returnsProducts`
- `getProducts_withNonExistingBusiness_throwsNotFoundException`
- `addProduct_withValidRequest_returnsProduct`
- `addProduct_withWrongOwner_throwsForbiddenException`
- `deleteProduct_withProductNotBelongingToBusiness_throwsNotFoundException`

---

## 7. Dosya Değişiklik Özeti

| Dosya | İşlem |
|---|---|
| `dto/response/BusinessProfileResponse.java` | `productCount` alanı eklenir |
| `dto/response/BusinessProfileDetailResponse.java` | Yeni oluşturulur |
| `repository/BusinessProfileRepository.java` | 2 yeni query metodu |
| `repository/ProductRepository.java` | 1 yeni batch count query |
| `service/BusinessProfileService.java` | `getAllBusinesses`, `getBusinessById`, `getCities` güncellenir |
| `controller/BusinessController.java` | `city` param, dönüş tipi, `getCities` eklenir |
| `config/SecurityConfig.java` | `/cities` public eklenir |
| `test/.../AuthServiceTest.java` | Yeni — 4 test |
| `test/.../BusinessProfileServiceTest.java` | Yeni — 8 test |
| `test/.../ProductServiceTest.java` | Yeni — 5 test |

**Toplam: 10 dosya değişikliği/ekleme, ~17 test metodu.**

---

## 8. Definition of Done

- [ ] `GET /api/v1/businesses` city parametresi ile ve parametresiz çalışıyor
- [ ] `GET /api/v1/businesses/{id}` ürün listesi ve productCount içeriyor
- [ ] `GET /api/v1/businesses/cities` unique şehir listesi dönüyor
- [ ] `BusinessProfileResponse` productCount içeriyor
- [ ] Tüm 17 test geçiyor
- [ ] Authentication gerektiren endpoint'ler korunuyor
