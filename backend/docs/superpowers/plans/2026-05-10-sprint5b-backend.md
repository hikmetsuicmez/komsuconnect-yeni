# Sprint 5b Backend — Category, Neighborhood, WorkingHours Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `category`, `neighborhood`, and `workingHours` fields to `BusinessProfile` and expose `?category=` query filter on `GET /api/v1/businesses`.

**Architecture:** Bottom-up — enum and entity first (compilation foundation), then Flyway migration, DTOs, repository, service (TDD), controller. Existing `findAllWithUser()` and `findAllByCity()` replaced by a single `findAllFiltered(city, category)` JPQL query that handles all null/non-null combinations.

**Tech Stack:** Java 21, Spring Boot 3.5.x, Spring Data JPA, MapStruct 1.5.5.Final, Flyway, JUnit 5 + Mockito, Maven

---

## File Map

| File | Action |
|---|---|
| `entity/BusinessCategory.java` | CREATE — new enum |
| `entity/BusinessProfile.java` | MODIFY — add 3 fields after `phone` |
| `resources/db/migration/V3__add_business_fields.sql` | CREATE — 3 nullable columns |
| `dto/request/CreateBusinessProfileRequest.java` | MODIFY — add 3 fields |
| `dto/request/UpdateBusinessProfileRequest.java` | MODIFY — add 3 fields |
| `dto/response/BusinessProfileResponse.java` | MODIFY — add 3 fields |
| `dto/response/BusinessProfileDetailResponse.java` | MODIFY — add 3 fields |
| `repository/BusinessProfileRepository.java` | MODIFY — remove 2 methods, add findAllFiltered |
| `service/BusinessProfileService.java` | MODIFY — getAllBusinesses, createBusinessProfile, updateBusinessProfile, getBusinessById |
| `controller/BusinessController.java` | MODIFY — add category @RequestParam |
| `test/.../service/BusinessProfileServiceTest.java` | MODIFY — update 2 tests, add 5 tests |

All Java paths are relative to `src/main/java/com/hikmetsuicmez/komsuconnect_backend/`.
SQL path is relative to `src/main/resources/`.
All commands run from the `backend/` directory.

---

### Task 1: Create BusinessCategory enum

**Files:**
- Create: `src/main/java/com/hikmetsuicmez/komsuconnect_backend/entity/BusinessCategory.java`

- [ ] **Step 1: Create the enum file**

```java
package com.hikmetsuicmez.komsuconnect_backend.entity;

public enum BusinessCategory {
    BAKERY, BUTCHER, GROCERY, MARKET, CAFE, FLORIST, HABERDASHER, REPAIR, OTHER
}
```

- [ ] **Step 2: Verify compilation**

```bash
mvn compile -q
```
Expected: no output (BUILD SUCCESS)

- [ ] **Step 3: Commit**

```bash
git add src/main/java/com/hikmetsuicmez/komsuconnect_backend/entity/BusinessCategory.java
git commit -m "feat: add BusinessCategory enum"
```

---

### Task 2: Add fields to BusinessProfile entity

**Files:**
- Modify: `src/main/java/com/hikmetsuicmez/komsuconnect_backend/entity/BusinessProfile.java`

- [ ] **Step 1: Add 3 new fields after the `phone` field**

The current `phone` field ends at line 43. Add immediately after it:

```java
    @Enumerated(EnumType.STRING)
    @Column(length = 50)
    private BusinessCategory category;

    @Column(length = 100)
    private String neighborhood;

    @Column(length = 100)
    private String workingHours;
```

The entity file already imports `jakarta.persistence.*` so `EnumType` is available.

- [ ] **Step 2: Verify compilation**

```bash
mvn compile -q
```
Expected: no output (BUILD SUCCESS)

- [ ] **Step 3: Commit**

```bash
git add src/main/java/com/hikmetsuicmez/komsuconnect_backend/entity/BusinessProfile.java
git commit -m "feat: add category, neighborhood, workingHours fields to BusinessProfile"
```

---

### Task 3: Create V3 Flyway migration

**Files:**
- Create: `src/main/resources/db/migration/V3__add_business_fields.sql`

- [ ] **Step 1: Create migration file**

```sql
ALTER TABLE business_profiles
    ADD COLUMN category      VARCHAR(50),
    ADD COLUMN neighborhood  VARCHAR(100),
    ADD COLUMN working_hours VARCHAR(100);
```

Note: Hibernate maps `workingHours` (Java camelCase) → `working_hours` (DB snake_case) automatically via Spring Boot's default naming strategy. All three columns are nullable — existing rows get `NULL`, which is correct.

- [ ] **Step 2: Verify the file sits alongside V1 and V2**

```bash
ls src/main/resources/db/migration/
```
Expected output includes: `V1__init.sql  V2__add_products.sql  V3__add_business_fields.sql`

- [ ] **Step 3: Commit**

```bash
git add src/main/resources/db/migration/V3__add_business_fields.sql
git commit -m "feat: V3 migration — add category, neighborhood, working_hours columns"
```

---

### Task 4: Update DTO classes

**Files:**
- Modify: `src/main/java/com/hikmetsuicmez/komsuconnect_backend/dto/request/CreateBusinessProfileRequest.java`
- Modify: `src/main/java/com/hikmetsuicmez/komsuconnect_backend/dto/request/UpdateBusinessProfileRequest.java`
- Modify: `src/main/java/com/hikmetsuicmez/komsuconnect_backend/dto/response/BusinessProfileResponse.java`
- Modify: `src/main/java/com/hikmetsuicmez/komsuconnect_backend/dto/response/BusinessProfileDetailResponse.java`

- [ ] **Step 1: Replace CreateBusinessProfileRequest**

```java
package com.hikmetsuicmez.komsuconnect_backend.dto.request;

import com.hikmetsuicmez.komsuconnect_backend.entity.BusinessCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateBusinessProfileRequest {

    @NotBlank
    private String businessName;

    private String description;

    @Size(max = 255)
    private String address;

    @Size(max = 100)
    private String city;

    @Size(min = 7, max = 20)
    private String phone;

    private BusinessCategory category;

    @Size(max = 100)
    private String neighborhood;

    @Size(max = 100)
    private String workingHours;
}
```

- [ ] **Step 2: Replace UpdateBusinessProfileRequest**

```java
package com.hikmetsuicmez.komsuconnect_backend.dto.request;

import com.hikmetsuicmez.komsuconnect_backend.entity.BusinessCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateBusinessProfileRequest {

    @NotBlank
    private String businessName;

    private String description;

    @Size(max = 255)
    private String address;

    @Size(max = 100)
    private String city;

    @Size(min = 7, max = 20)
    private String phone;

    private BusinessCategory category;

    @Size(max = 100)
    private String neighborhood;

    @Size(max = 100)
    private String workingHours;
}
```

- [ ] **Step 3: Replace BusinessProfileResponse**

```java
package com.hikmetsuicmez.komsuconnect_backend.dto.response;

import com.hikmetsuicmez.komsuconnect_backend.entity.BusinessCategory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class BusinessProfileResponse {
    private UUID id;
    private UUID userId;
    private String businessName;
    private String description;
    private String address;
    private String city;
    private String phone;
    private BusinessCategory category;
    private String neighborhood;
    private String workingHours;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private long productCount;
}
```

- [ ] **Step 4: Replace BusinessProfileDetailResponse**

```java
package com.hikmetsuicmez.komsuconnect_backend.dto.response;

import com.hikmetsuicmez.komsuconnect_backend.entity.BusinessCategory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class BusinessProfileDetailResponse {
    private UUID id;
    private UUID userId;
    private String businessName;
    private String description;
    private String address;
    private String city;
    private String phone;
    private BusinessCategory category;
    private String neighborhood;
    private String workingHours;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private long productCount;
    private List<ProductResponse> products;
}
```

Note: MapStruct (`BusinessProfileMapper`) maps `category`, `neighborhood`, `workingHours` automatically since field names match entity — no new `@Mapping` needed.

- [ ] **Step 5: Verify compilation**

```bash
mvn compile -q
```
Expected: no output (BUILD SUCCESS)

- [ ] **Step 6: Commit**

```bash
git add src/main/java/com/hikmetsuicmez/komsuconnect_backend/dto/
git commit -m "feat: add category, neighborhood, workingHours to business profile DTOs"
```

---

### Task 5: Update BusinessProfileRepository

**Files:**
- Modify: `src/main/java/com/hikmetsuicmez/komsuconnect_backend/repository/BusinessProfileRepository.java`

- [ ] **Step 1: Replace the entire repository interface**

```java
package com.hikmetsuicmez.komsuconnect_backend.repository;

import com.hikmetsuicmez.komsuconnect_backend.entity.BusinessCategory;
import com.hikmetsuicmez.komsuconnect_backend.entity.BusinessProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BusinessProfileRepository extends JpaRepository<BusinessProfile, UUID> {

    Optional<BusinessProfile> findByUserId(UUID userId);

    boolean existsByUserId(UUID userId);

    @Query("""
            SELECT bp FROM BusinessProfile bp
            JOIN FETCH bp.user
            WHERE (:city IS NULL OR LOWER(bp.city) = LOWER(:city))
              AND (:category IS NULL OR bp.category = :category)
            """)
    List<BusinessProfile> findAllFiltered(
            @Param("city") String city,
            @Param("category") BusinessCategory category);

    @Query("SELECT DISTINCT bp.city FROM BusinessProfile bp " +
           "WHERE bp.city IS NOT NULL AND bp.city <> '' ORDER BY bp.city")
    List<String> findDistinctCities();

    @Query("SELECT bp FROM BusinessProfile bp JOIN FETCH bp.user WHERE bp.id = :id")
    Optional<BusinessProfile> findByIdWithUser(@Param("id") UUID id);
}
```

`findAllWithUser()` and `findAllByCity()` are intentionally removed. The service still references them → it will not compile until Task 6 Step 3.

- [ ] **Step 2: Attempt compilation — expect failure**

```bash
mvn compile -q
```
Expected: BUILD FAILURE — `cannot find symbol: method findAllWithUser()` and `findAllByCity(String)` in `BusinessProfileService`. This is the "red" phase — the repository is correct, the service needs updating.

- [ ] **Step 3: Commit the repository change**

```bash
git add src/main/java/com/hikmetsuicmez/komsuconnect_backend/repository/BusinessProfileRepository.java
git commit -m "refactor: replace findAllWithUser/findAllByCity with findAllFiltered in repository"
```

---

### Task 6: Update Service — getAllBusinesses (TDD)

**Files:**
- Modify: `src/test/java/com/hikmetsuicmez/komsuconnect_backend/service/BusinessProfileServiceTest.java`
- Modify: `src/main/java/com/hikmetsuicmez/komsuconnect_backend/service/BusinessProfileService.java`

- [ ] **Step 1: Update two existing tests in BusinessProfileServiceTest**

Add this import at the top of the test file (after existing imports):
```java
import com.hikmetsuicmez.komsuconnect_backend.entity.BusinessCategory;
```

Replace `getAllBusinesses_withNoCity_returnsAllWithProductCount` entirely:
```java
@Test
void getAllBusinesses_withNoCity_returnsAllWithProductCount() {
    UUID profileId = UUID.randomUUID();
    User user = buildUser("owner@example.com");
    BusinessProfile profile = buildProfile(profileId, user);
    BusinessProfileResponse response = new BusinessProfileResponse();
    response.setId(profileId);

    when(businessProfileRepository.findAllFiltered(null, null)).thenReturn(List.of(profile));
    when(businessProfileMapper.toResponse(profile)).thenReturn(response);
    List<Object[]> productCounts = new java.util.ArrayList<>();
    productCounts.add(new Object[]{profileId, 3L});
    when(productRepository.findProductCountsByBusinessProfile()).thenReturn(productCounts);

    List<BusinessProfileResponse> result = businessProfileService.getAllBusinesses(null, null);

    assertThat(result).hasSize(1);
    assertThat(result.get(0).getProductCount()).isEqualTo(3L);
    verify(businessProfileRepository).findAllFiltered(null, null);
}
```

Replace `getAllBusinesses_withCity_returnsFilteredBusinesses` entirely:
```java
@Test
void getAllBusinesses_withCity_returnsFilteredBusinesses() {
    UUID profileId = UUID.randomUUID();
    User user = buildUser("owner@example.com");
    BusinessProfile profile = buildProfile(profileId, user);
    BusinessProfileResponse response = new BusinessProfileResponse();
    response.setId(profileId);

    when(businessProfileRepository.findAllFiltered("Istanbul", null)).thenReturn(List.of(profile));
    when(businessProfileMapper.toResponse(profile)).thenReturn(response);
    when(productRepository.findProductCountsByBusinessProfile()).thenReturn(List.of());

    List<BusinessProfileResponse> result = businessProfileService.getAllBusinesses("Istanbul", null);

    assertThat(result).hasSize(1);
    verify(businessProfileRepository).findAllFiltered("Istanbul", null);
}
```

Add two new test methods after the city test:
```java
@Test
void getAllBusinesses_withCategory_returnsFilteredByCategory() {
    UUID profileId = UUID.randomUUID();
    User user = buildUser("owner@example.com");
    BusinessProfile profile = buildProfile(profileId, user);
    BusinessProfileResponse response = new BusinessProfileResponse();
    response.setId(profileId);

    when(businessProfileRepository.findAllFiltered(null, BusinessCategory.BAKERY)).thenReturn(List.of(profile));
    when(businessProfileMapper.toResponse(profile)).thenReturn(response);
    when(productRepository.findProductCountsByBusinessProfile()).thenReturn(List.of());

    List<BusinessProfileResponse> result = businessProfileService.getAllBusinesses(null, BusinessCategory.BAKERY);

    assertThat(result).hasSize(1);
    verify(businessProfileRepository).findAllFiltered(null, BusinessCategory.BAKERY);
}

@Test
void getAllBusinesses_withCityAndCategory_returnsFiltered() {
    UUID profileId = UUID.randomUUID();
    User user = buildUser("owner@example.com");
    BusinessProfile profile = buildProfile(profileId, user);
    BusinessProfileResponse response = new BusinessProfileResponse();
    response.setId(profileId);

    when(businessProfileRepository.findAllFiltered("Istanbul", BusinessCategory.CAFE)).thenReturn(List.of(profile));
    when(businessProfileMapper.toResponse(profile)).thenReturn(response);
    when(productRepository.findProductCountsByBusinessProfile()).thenReturn(List.of());

    List<BusinessProfileResponse> result = businessProfileService.getAllBusinesses("Istanbul", BusinessCategory.CAFE);

    assertThat(result).hasSize(1);
    verify(businessProfileRepository).findAllFiltered("Istanbul", BusinessCategory.CAFE);
}
```

- [ ] **Step 2: Run tests — expect compilation failure**

```bash
mvn test -Dtest=BusinessProfileServiceTest
```
Expected: BUILD FAILURE — `cannot find symbol: method getAllBusinesses(String, BusinessCategory)` (service method not updated yet)

- [ ] **Step 3: Update getAllBusinesses in BusinessProfileService**

Add this import to `BusinessProfileService.java`:
```java
import com.hikmetsuicmez.komsuconnect_backend.entity.BusinessCategory;
```

Replace the `getAllBusinesses` method:
```java
@Transactional(readOnly = true)
public List<BusinessProfileResponse> getAllBusinesses(String city, BusinessCategory category) {
    List<BusinessProfile> profiles = businessProfileRepository.findAllFiltered(city, category);
    Map<UUID, Long> countMap = buildProductCountMap();

    return profiles.stream()
            .map(bp -> {
                BusinessProfileResponse response = businessProfileMapper.toResponse(bp);
                response.setProductCount(countMap.getOrDefault(bp.getId(), 0L));
                return response;
            })
            .collect(Collectors.toList());
}
```

- [ ] **Step 4: Run tests — expect pass**

```bash
mvn test -Dtest=BusinessProfileServiceTest
```
Expected: BUILD SUCCESS — all tests pass (the 8 original + 2 new = 10 total at this point)

- [ ] **Step 5: Commit**

```bash
git add src/main/java/com/hikmetsuicmez/komsuconnect_backend/service/BusinessProfileService.java
git add src/test/java/com/hikmetsuicmez/komsuconnect_backend/service/BusinessProfileServiceTest.java
git commit -m "feat: update getAllBusinesses to accept category filter"
```

---

### Task 7: Update Service — createBusinessProfile (TDD)

**Files:**
- Modify: `src/test/java/com/hikmetsuicmez/komsuconnect_backend/service/BusinessProfileServiceTest.java`
- Modify: `src/main/java/com/hikmetsuicmez/komsuconnect_backend/service/BusinessProfileService.java`

- [ ] **Step 1: Add two failing tests**

Add this import to the test file if not already present:
```java
import static org.mockito.ArgumentMatchers.argThat;
```

Add these two test methods after `createBusinessProfile_withDuplicateProfile_throwsAlreadyExistsException`:
```java
@Test
void createBusinessProfile_withNullCategory_defaultsToOther() {
    String email = "owner@example.com";
    User user = User.builder()
            .id(UUID.randomUUID())
            .email(email)
            .password("encoded")
            .fullName("Owner")
            .role(Role.BUSINESS)
            .build();

    CreateBusinessProfileRequest request = new CreateBusinessProfileRequest();
    request.setBusinessName("My Shop");
    request.setPhone("0500000000");
    // category intentionally left null

    when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));
    when(businessProfileRepository.existsByUserId(user.getId())).thenReturn(false);
    when(businessProfileRepository.save(any(BusinessProfile.class))).thenAnswer(inv -> inv.getArgument(0));
    when(businessProfileMapper.toResponse(any(BusinessProfile.class))).thenReturn(new BusinessProfileResponse());

    businessProfileService.createBusinessProfile(request, email);

    verify(businessProfileRepository).save(argThat(p -> p.getCategory() == BusinessCategory.OTHER));
}

@Test
void createBusinessProfile_withExplicitCategory_setsCategory() {
    String email = "owner@example.com";
    User user = User.builder()
            .id(UUID.randomUUID())
            .email(email)
            .password("encoded")
            .fullName("Owner")
            .role(Role.BUSINESS)
            .build();

    CreateBusinessProfileRequest request = new CreateBusinessProfileRequest();
    request.setBusinessName("My Bakery");
    request.setPhone("0500000000");
    request.setCategory(BusinessCategory.BAKERY);

    when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));
    when(businessProfileRepository.existsByUserId(user.getId())).thenReturn(false);
    when(businessProfileRepository.save(any(BusinessProfile.class))).thenAnswer(inv -> inv.getArgument(0));
    when(businessProfileMapper.toResponse(any(BusinessProfile.class))).thenReturn(new BusinessProfileResponse());

    businessProfileService.createBusinessProfile(request, email);

    verify(businessProfileRepository).save(argThat(p -> p.getCategory() == BusinessCategory.BAKERY));
}
```

- [ ] **Step 2: Run tests — expect failure**

```bash
mvn test -Dtest="BusinessProfileServiceTest#createBusinessProfile_withNullCategory_defaultsToOther+createBusinessProfile_withExplicitCategory_setsCategory"
```
Expected: FAIL — category is never set in the profile builder (it remains null)

- [ ] **Step 3: Update createBusinessProfile in BusinessProfileService**

Replace the `BusinessProfile.builder()` block inside `createBusinessProfile`:
```java
BusinessProfile profile = BusinessProfile.builder()
        .user(user)
        .businessName(request.getBusinessName())
        .description(request.getDescription())
        .address(request.getAddress())
        .city(request.getCity())
        .phone(request.getPhone())
        .category(request.getCategory() != null ? request.getCategory() : BusinessCategory.OTHER)
        .neighborhood(request.getNeighborhood())
        .workingHours(request.getWorkingHours())
        .build();
```

- [ ] **Step 4: Run all service tests**

```bash
mvn test -Dtest=BusinessProfileServiceTest
```
Expected: BUILD SUCCESS — all 12 tests pass

- [ ] **Step 5: Commit**

```bash
git add src/main/java/com/hikmetsuicmez/komsuconnect_backend/service/BusinessProfileService.java
git add src/test/java/com/hikmetsuicmez/komsuconnect_backend/service/BusinessProfileServiceTest.java
git commit -m "feat: set category/neighborhood/workingHours on createBusinessProfile"
```

---

### Task 8: Update Service — updateBusinessProfile and getBusinessById (TDD)

**Files:**
- Modify: `src/test/java/com/hikmetsuicmez/komsuconnect_backend/service/BusinessProfileServiceTest.java`
- Modify: `src/main/java/com/hikmetsuicmez/komsuconnect_backend/service/BusinessProfileService.java`

- [ ] **Step 1: Add failing test for updateBusinessProfile**

Add after `updateBusinessProfile_withWrongOwner_throwsForbiddenException`:
```java
@Test
void updateBusinessProfile_updatesAllNewFields() {
    UUID profileId = UUID.randomUUID();
    User owner = buildUser("owner@example.com");
    BusinessProfile profile = buildProfile(profileId, owner);

    UpdateBusinessProfileRequest request = new UpdateBusinessProfileRequest();
    request.setBusinessName("Updated Shop");
    request.setCategory(BusinessCategory.FLORIST);
    request.setNeighborhood("Kadıköy");
    request.setWorkingHours("09:00-20:00");

    when(businessProfileRepository.findById(profileId)).thenReturn(Optional.of(profile));
    when(businessProfileMapper.toResponse(profile)).thenReturn(new BusinessProfileResponse());

    businessProfileService.updateBusinessProfile(profileId, request, "owner@example.com");

    assertThat(profile.getCategory()).isEqualTo(BusinessCategory.FLORIST);
    assertThat(profile.getNeighborhood()).isEqualTo("Kadıköy");
    assertThat(profile.getWorkingHours()).isEqualTo("09:00-20:00");
}
```

- [ ] **Step 2: Run test — expect failure**

```bash
mvn test -Dtest="BusinessProfileServiceTest#updateBusinessProfile_updatesAllNewFields"
```
Expected: FAIL — new fields are not set inside `updateBusinessProfile` yet

- [ ] **Step 3: Update updateBusinessProfile in BusinessProfileService**

Replace the full `updateBusinessProfile` method:
```java
@Transactional
public BusinessProfileResponse updateBusinessProfile(UUID id, UpdateBusinessProfileRequest request, String email) {
    BusinessProfile profile = findProfileOrThrow(id);
    verifyOwner(profile, email);

    profile.setBusinessName(request.getBusinessName());
    profile.setDescription(request.getDescription());
    profile.setAddress(request.getAddress());
    profile.setCity(request.getCity());
    profile.setPhone(request.getPhone());
    profile.setCategory(request.getCategory() != null ? request.getCategory() : BusinessCategory.OTHER);
    profile.setNeighborhood(request.getNeighborhood());
    profile.setWorkingHours(request.getWorkingHours());

    return businessProfileMapper.toResponse(profile);
}
```

- [ ] **Step 4: Update getBusinessById builder to include new fields**

In `getBusinessById`, replace the `BusinessProfileDetailResponse.builder()` block:
```java
return BusinessProfileDetailResponse.builder()
        .id(profile.getId())
        .userId(profile.getUser().getId())
        .businessName(profile.getBusinessName())
        .description(profile.getDescription())
        .address(profile.getAddress())
        .city(profile.getCity())
        .phone(profile.getPhone())
        .category(profile.getCategory())
        .neighborhood(profile.getNeighborhood())
        .workingHours(profile.getWorkingHours())
        .createdAt(profile.getCreatedAt())
        .updatedAt(profile.getUpdatedAt())
        .productCount(products.size())
        .products(products)
        .build();
```

- [ ] **Step 5: Run all service tests**

```bash
mvn test -Dtest=BusinessProfileServiceTest
```
Expected: BUILD SUCCESS — all 13 tests pass

- [ ] **Step 6: Commit**

```bash
git add src/main/java/com/hikmetsuicmez/komsuconnect_backend/service/BusinessProfileService.java
git add src/test/java/com/hikmetsuicmez/komsuconnect_backend/service/BusinessProfileServiceTest.java
git commit -m "feat: update updateBusinessProfile and getBusinessById with new fields"
```

---

### Task 9: Update BusinessController

**Files:**
- Modify: `src/main/java/com/hikmetsuicmez/komsuconnect_backend/controller/BusinessController.java`

- [ ] **Step 1: Add BusinessCategory import**

Add to the imports block of `BusinessController.java`:
```java
import com.hikmetsuicmez.komsuconnect_backend.entity.BusinessCategory;
```

- [ ] **Step 2: Replace the getAllBusinesses endpoint method**

Current (lines 26-30):
```java
@GetMapping
public ResponseEntity<List<BusinessProfileResponse>> getAllBusinesses(
        @RequestParam(required = false) String city) {
    return ResponseEntity.ok(businessProfileService.getAllBusinesses(city));
}
```

Replace with:
```java
@GetMapping
public ResponseEntity<List<BusinessProfileResponse>> getAllBusinesses(
        @RequestParam(required = false) String city,
        @RequestParam(required = false) BusinessCategory category) {
    return ResponseEntity.ok(businessProfileService.getAllBusinesses(city, category));
}
```

Spring automatically converts `?category=BAKERY` string to `BusinessCategory.BAKERY`. An invalid string like `?category=INVALID` returns `400 Bad Request` with no extra code.

- [ ] **Step 3: Run full test suite**

```bash
mvn test
```
Expected: BUILD SUCCESS — all tests pass (BusinessProfileServiceTest + AuthServiceTest + ProductServiceTest + others)

- [ ] **Step 4: Commit**

```bash
git add src/main/java/com/hikmetsuicmez/komsuconnect_backend/controller/BusinessController.java
git commit -m "feat: add category query param to GET /api/v1/businesses"
```

---

## Self-Review

- [x] **BusinessCategory enum:** 9 values — BAKERY, BUTCHER, GROCERY, MARKET, CAFE, FLORIST, HABERDASHER, REPAIR, OTHER ✓
- [x] **Entity:** category (`@Enumerated(STRING)`, length 50), neighborhood (length 100), workingHours (length 100) — all nullable ✓
- [x] **V3 migration:** ALTER TABLE adds 3 nullable columns; `working_hours` name matches Hibernate snake_case convention ✓
- [x] **Request DTOs:** Both Create and Update get category (no `@NotNull`), neighborhood (`@Size(max=100)`), workingHours (`@Size(max=100)`) ✓
- [x] **Response DTOs:** Both Response and DetailResponse get category, neighborhood, workingHours ✓
- [x] **MapStruct:** No new `@Mapping` needed — field names match ✓
- [x] **Repository:** `findAllWithUser` and `findAllByCity` removed; `findAllFiltered(city, category)` with nullable JPQL added ✓
- [x] **Service getAllBusinesses:** Signature `(String city, BusinessCategory category)`, delegates to `findAllFiltered` ✓
- [x] **Service createBusinessProfile:** null category → OTHER; neighborhood and workingHours set in builder ✓
- [x] **Service updateBusinessProfile:** category/neighborhood/workingHours set via setters; null category → OTHER ✓
- [x] **Service getBusinessById:** 3 new fields added to builder ✓
- [x] **Controller:** `@RequestParam(required = false) BusinessCategory category` added; service call updated ✓
- [x] **Tests updated:** getAllBusinesses_withNoCity and withCity mock `findAllFiltered` instead of old methods ✓
- [x] **Tests new (5):** withCategory, withCityAndCategory, nullCategory→OTHER, explicitCategory, updateAllNewFields ✓
- [x] **No placeholders or TBD:** All code is complete ✓
- [x] **Type consistency:** `BusinessCategory` used uniformly; `findAllFiltered(String, BusinessCategory)` matches across repository/service/tests ✓
