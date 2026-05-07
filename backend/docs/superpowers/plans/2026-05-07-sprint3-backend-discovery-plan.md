# Sprint 3 Backend — Discovery Endpoints & Tests Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Kullanıcı tarafı keşif endpoint'lerini ekle (`city` filtresi, esnaf detayında ürünler, şehir listesi) ve 3 servis için JUnit unit testleri yaz.

**Architecture:** Mevcut `BusinessController` / `BusinessProfileService` genişletilir; yeni `BusinessProfileDetailResponse` DTO'su oluşturulur; repository'lere iki yeni query eklenir; `ProductRepository` + `ProductMapper` `BusinessProfileService`'e inject edilir; tüm servisler için Mockito tabanlı unit test dosyaları oluşturulur.

**Tech Stack:** Java 21, Spring Boot 3.5, Spring Data JPA, MapStruct 1.5.5, Lombok, JUnit 5, Mockito

---

## Dosya Değişiklik Haritası

| Dosya | İşlem |
|---|---|
| `dto/response/BusinessProfileDetailResponse.java` | Yeni oluştur |
| `dto/response/BusinessProfileResponse.java` | `productCount: long` alanı ekle |
| `repository/BusinessProfileRepository.java` | `findAllByCity`, `findDistinctCities` ekle |
| `repository/ProductRepository.java` | `findProductCountsByBusinessProfile` ekle |
| `service/BusinessProfileService.java` | `ProductRepository`/`ProductMapper` inject et; `getAllBusinesses(String)`, `getBusinessById(UUID)`, `getCities()` güncelle/ekle |
| `controller/BusinessController.java` | `city` param, dönüş tipi, `getCities` endpoint ekle |
| `config/SecurityConfig.java` | `/businesses/cities` public ekle |
| `test/.../service/AuthServiceTest.java` | Yeni oluştur — 4 test |
| `test/.../service/BusinessProfileServiceTest.java` | Yeni oluştur — 8 test |
| `test/.../service/ProductServiceTest.java` | Yeni oluştur — 5 test |

---

## Task 1: BusinessProfileDetailResponse DTO Oluştur

**Files:**
- Create: `src/main/java/com/hikmetsuicmez/komsuconnect_backend/dto/response/BusinessProfileDetailResponse.java`

- [ ] **Step 1: Dosyayı oluştur**

```java
package com.hikmetsuicmez.komsuconnect_backend.dto.response;

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
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private long productCount;
    private List<ProductResponse> products;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/main/java/com/hikmetsuicmez/komsuconnect_backend/dto/response/BusinessProfileDetailResponse.java
git commit -m "feat: add BusinessProfileDetailResponse DTO for discovery detail endpoint"
```

---

## Task 2: BusinessProfileResponse'a productCount Ekle

**Files:**
- Modify: `src/main/java/com/hikmetsuicmez/komsuconnect_backend/dto/response/BusinessProfileResponse.java`

- [ ] **Step 1: `productCount` alanını ekle**

Mevcut dosyada `private LocalDateTime updatedAt;` satırının altına ekle:

```java
private long productCount;
```

Sonuç (tüm dosya):
```java
package com.hikmetsuicmez.komsuconnect_backend.dto.response;

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
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private long productCount;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/main/java/com/hikmetsuicmez/komsuconnect_backend/dto/response/BusinessProfileResponse.java
git commit -m "feat: add productCount field to BusinessProfileResponse"
```

---

## Task 3: Repository Query'leri Ekle

**Files:**
- Modify: `src/main/java/com/hikmetsuicmez/komsuconnect_backend/repository/BusinessProfileRepository.java`
- Modify: `src/main/java/com/hikmetsuicmez/komsuconnect_backend/repository/ProductRepository.java`

- [ ] **Step 1: BusinessProfileRepository'e iki query ekle**

Mevcut interface'e `findAllWithUser()` altına ekle:

```java
package com.hikmetsuicmez.komsuconnect_backend.repository;

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

    @Query("SELECT bp FROM BusinessProfile bp JOIN FETCH bp.user")
    List<BusinessProfile> findAllWithUser();

    @Query("SELECT bp FROM BusinessProfile bp JOIN FETCH bp.user " +
           "WHERE LOWER(bp.city) = LOWER(:city)")
    List<BusinessProfile> findAllByCity(@Param("city") String city);

    @Query("SELECT DISTINCT bp.city FROM BusinessProfile bp " +
           "WHERE bp.city IS NOT NULL AND bp.city <> '' ORDER BY bp.city")
    List<String> findDistinctCities();
}
```

- [ ] **Step 2: ProductRepository'e batch count query ekle**

```java
package com.hikmetsuicmez.komsuconnect_backend.repository;

import com.hikmetsuicmez.komsuconnect_backend.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface ProductRepository extends JpaRepository<Product, UUID> {
    @Query("SELECT p FROM Product p JOIN FETCH p.businessProfile WHERE p.businessProfile.id = :businessProfileId")
    List<Product> findByBusinessProfileId(@Param("businessProfileId") UUID businessProfileId);

    @Query("SELECT p.businessProfile.id, COUNT(p) FROM Product p GROUP BY p.businessProfile.id")
    List<Object[]> findProductCountsByBusinessProfile();
}
```

- [ ] **Step 3: Commit**

```bash
git add src/main/java/com/hikmetsuicmez/komsuconnect_backend/repository/BusinessProfileRepository.java \
        src/main/java/com/hikmetsuicmez/komsuconnect_backend/repository/ProductRepository.java
git commit -m "feat: add city filter, distinct cities, and batch product count queries"
```

---

## Task 4: BusinessProfileService Güncelle

**Files:**
- Modify: `src/main/java/com/hikmetsuicmez/komsuconnect_backend/service/BusinessProfileService.java`

- [ ] **Step 1: Servisi güncelle**

Aşağıdaki değişiklikler yapılır:
1. `ProductRepository` ve `ProductMapper` field olarak eklenir (Lombok `@RequiredArgsConstructor` otomatik inject eder)
2. `getAllBusinesses()` → `getAllBusinesses(String city)` — city filtresi ve productCount
3. `getBusinessById(UUID id)` → artık `BusinessProfileDetailResponse` döner
4. `getCities()` yeni metod eklenir
5. `buildProductCountMap()` private yardımcı metod eklenir

Tam dosya:

```java
package com.hikmetsuicmez.komsuconnect_backend.service;

import com.hikmetsuicmez.komsuconnect_backend.dto.request.CreateBusinessProfileRequest;
import com.hikmetsuicmez.komsuconnect_backend.dto.request.UpdateBusinessProfileRequest;
import com.hikmetsuicmez.komsuconnect_backend.dto.response.BusinessProfileDetailResponse;
import com.hikmetsuicmez.komsuconnect_backend.dto.response.BusinessProfileResponse;
import com.hikmetsuicmez.komsuconnect_backend.dto.response.ProductResponse;
import com.hikmetsuicmez.komsuconnect_backend.entity.BusinessProfile;
import com.hikmetsuicmez.komsuconnect_backend.entity.User;
import com.hikmetsuicmez.komsuconnect_backend.exception.BusinessProfileAlreadyExistsException;
import com.hikmetsuicmez.komsuconnect_backend.exception.BusinessProfileNotFoundException;
import com.hikmetsuicmez.komsuconnect_backend.exception.ForbiddenException;
import com.hikmetsuicmez.komsuconnect_backend.exception.UserNotFoundException;
import com.hikmetsuicmez.komsuconnect_backend.mapper.BusinessProfileMapper;
import com.hikmetsuicmez.komsuconnect_backend.mapper.ProductMapper;
import com.hikmetsuicmez.komsuconnect_backend.repository.BusinessProfileRepository;
import com.hikmetsuicmez.komsuconnect_backend.repository.ProductRepository;
import com.hikmetsuicmez.komsuconnect_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class BusinessProfileService {

    private final BusinessProfileRepository businessProfileRepository;
    private final UserRepository userRepository;
    private final BusinessProfileMapper businessProfileMapper;
    private final ProductRepository productRepository;
    private final ProductMapper productMapper;

    @Transactional(readOnly = true)
    public List<BusinessProfileResponse> getAllBusinesses(String city) {
        List<BusinessProfile> profiles = (city != null && !city.isBlank())
                ? businessProfileRepository.findAllByCity(city)
                : businessProfileRepository.findAllWithUser();

        Map<UUID, Long> countMap = buildProductCountMap();

        return profiles.stream()
                .map(bp -> {
                    BusinessProfileResponse response = businessProfileMapper.toResponse(bp);
                    response.setProductCount(countMap.getOrDefault(bp.getId(), 0L));
                    return response;
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public BusinessProfileDetailResponse getBusinessById(UUID id) {
        BusinessProfile profile = findProfileOrThrow(id);
        List<ProductResponse> products = productMapper.toResponseList(
                productRepository.findByBusinessProfileId(id));

        return BusinessProfileDetailResponse.builder()
                .id(profile.getId())
                .userId(profile.getUser().getId())
                .businessName(profile.getBusinessName())
                .description(profile.getDescription())
                .address(profile.getAddress())
                .city(profile.getCity())
                .phone(profile.getPhone())
                .createdAt(profile.getCreatedAt())
                .updatedAt(profile.getUpdatedAt())
                .productCount(products.size())
                .products(products)
                .build();
    }

    @Transactional(readOnly = true)
    public List<String> getCities() {
        return businessProfileRepository.findDistinctCities();
    }

    @Transactional
    public BusinessProfileResponse createBusinessProfile(CreateBusinessProfileRequest request, String email) {
        User user = findUserOrThrow(email);

        if (businessProfileRepository.existsByUserId(user.getId())) {
            throw new BusinessProfileAlreadyExistsException("A business profile already exists for this account");
        }

        BusinessProfile profile = BusinessProfile.builder()
                .user(user)
                .businessName(request.getBusinessName())
                .description(request.getDescription())
                .address(request.getAddress())
                .city(request.getCity())
                .phone(request.getPhone())
                .build();

        businessProfileRepository.save(profile);
        log.info("Business profile created for user: {}", email);
        return businessProfileMapper.toResponse(profile);
    }

    @Transactional
    public BusinessProfileResponse updateBusinessProfile(UUID id, UpdateBusinessProfileRequest request, String email) {
        BusinessProfile profile = findProfileOrThrow(id);
        verifyOwner(profile, email);

        profile.setBusinessName(request.getBusinessName());
        profile.setDescription(request.getDescription());
        profile.setAddress(request.getAddress());
        profile.setCity(request.getCity());
        profile.setPhone(request.getPhone());

        return businessProfileMapper.toResponse(profile);
    }

    @Transactional(readOnly = true)
    public BusinessProfileResponse getMyBusinessProfile(String email) {
        User user = findUserOrThrow(email);
        BusinessProfile profile = businessProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new BusinessProfileNotFoundException("No business profile found for this account"));
        return businessProfileMapper.toResponse(profile);
    }

    private Map<UUID, Long> buildProductCountMap() {
        return productRepository.findProductCountsByBusinessProfile().stream()
                .collect(Collectors.toMap(
                        row -> (UUID) row[0],
                        row -> (Long) row[1]
                ));
    }

    private BusinessProfile findProfileOrThrow(UUID id) {
        return businessProfileRepository.findById(id)
                .orElseThrow(() -> new BusinessProfileNotFoundException("Business profile not found"));
    }

    private User findUserOrThrow(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("User not found"));
    }

    private void verifyOwner(BusinessProfile profile, String email) {
        if (!profile.getUser().getEmail().equals(email)) {
            throw new ForbiddenException("You do not own this business profile");
        }
    }
}
```

- [ ] **Step 2: Derle (test olmadan)**

```bash
.\mvnw.cmd compile
```

Beklenen: `BUILD SUCCESS`. Hata varsa import veya tip uyuşmazlığını düzelt.

- [ ] **Step 3: Commit**

```bash
git add src/main/java/com/hikmetsuicmez/komsuconnect_backend/service/BusinessProfileService.java
git commit -m "feat: add city filter, cities endpoint, and detail response to BusinessProfileService"
```

---

## Task 5: BusinessController ve SecurityConfig Güncelle

**Files:**
- Modify: `src/main/java/com/hikmetsuicmez/komsuconnect_backend/controller/BusinessController.java`
- Modify: `src/main/java/com/hikmetsuicmez/komsuconnect_backend/config/SecurityConfig.java`

- [ ] **Step 1: BusinessController'ı güncelle**

```java
package com.hikmetsuicmez.komsuconnect_backend.controller;

import com.hikmetsuicmez.komsuconnect_backend.dto.request.CreateBusinessProfileRequest;
import com.hikmetsuicmez.komsuconnect_backend.dto.request.UpdateBusinessProfileRequest;
import com.hikmetsuicmez.komsuconnect_backend.dto.response.BusinessProfileDetailResponse;
import com.hikmetsuicmez.komsuconnect_backend.dto.response.BusinessProfileResponse;
import com.hikmetsuicmez.komsuconnect_backend.service.BusinessProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/businesses")
@RequiredArgsConstructor
public class BusinessController {

    private final BusinessProfileService businessProfileService;

    @GetMapping
    public ResponseEntity<List<BusinessProfileResponse>> getAllBusinesses(
            @RequestParam(required = false) String city) {
        return ResponseEntity.ok(businessProfileService.getAllBusinesses(city));
    }

    @GetMapping("/cities")
    public ResponseEntity<List<String>> getCities() {
        return ResponseEntity.ok(businessProfileService.getCities());
    }

    @GetMapping("/me")
    public ResponseEntity<BusinessProfileResponse> getMyBusinessProfile(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(businessProfileService.getMyBusinessProfile(userDetails.getUsername()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<BusinessProfileDetailResponse> getBusinessById(@PathVariable UUID id) {
        return ResponseEntity.ok(businessProfileService.getBusinessById(id));
    }

    @PostMapping
    public ResponseEntity<BusinessProfileResponse> createBusinessProfile(
            @Valid @RequestBody CreateBusinessProfileRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(businessProfileService.createBusinessProfile(request, userDetails.getUsername()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<BusinessProfileResponse> updateBusinessProfile(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateBusinessProfileRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(
                businessProfileService.updateBusinessProfile(id, request, userDetails.getUsername()));
    }
}
```

- [ ] **Step 2: SecurityConfig'e `/businesses/cities` public ekle**

`SecurityConfig.java` içindeki `authorizeHttpRequests` bloğunu güncelle — sadece `permitAll()` satırını değiştir:

```java
.requestMatchers(HttpMethod.GET,
        "/api/v1/businesses",
        "/api/v1/businesses/{id}",
        "/api/v1/businesses/{id}/products",
        "/api/v1/businesses/cities").permitAll()
```

- [ ] **Step 3: Derle**

```bash
.\mvnw.cmd compile
```

Beklenen: `BUILD SUCCESS`.

- [ ] **Step 4: Commit**

```bash
git add src/main/java/com/hikmetsuicmez/komsuconnect_backend/controller/BusinessController.java \
        src/main/java/com/hikmetsuicmez/komsuconnect_backend/config/SecurityConfig.java
git commit -m "feat: update BusinessController with city filter, cities endpoint, and detail response"
```

---

## Task 6: AuthServiceTest Yaz

**Files:**
- Create: `src/test/java/com/hikmetsuicmez/komsuconnect_backend/service/AuthServiceTest.java`

- [ ] **Step 1: Test dosyasını oluştur**

```java
package com.hikmetsuicmez.komsuconnect_backend.service;

import com.hikmetsuicmez.komsuconnect_backend.dto.request.LoginRequest;
import com.hikmetsuicmez.komsuconnect_backend.dto.request.RegisterRequest;
import com.hikmetsuicmez.komsuconnect_backend.dto.response.AuthResponse;
import com.hikmetsuicmez.komsuconnect_backend.entity.Role;
import com.hikmetsuicmez.komsuconnect_backend.entity.User;
import com.hikmetsuicmez.komsuconnect_backend.exception.EmailAlreadyExistsException;
import com.hikmetsuicmez.komsuconnect_backend.repository.UserRepository;
import com.hikmetsuicmez.komsuconnect_backend.security.JwtUtil;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtUtil jwtUtil;
    @Mock private AuthenticationManager authenticationManager;

    @InjectMocks private AuthService authService;

    @Test
    void register_withValidRequest_returnsAuthResponse() {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("test@example.com");
        request.setPassword("password123");
        request.setFullName("Test User");
        request.setRole("USER");

        when(userRepository.existsByEmail("test@example.com")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("encoded-password");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        when(jwtUtil.generateToken("test@example.com")).thenReturn("jwt-token");

        AuthResponse response = authService.register(request);

        assertThat(response.getToken()).isEqualTo("jwt-token");
        assertThat(response.getEmail()).isEqualTo("test@example.com");
        assertThat(response.getFullName()).isEqualTo("Test User");
        assertThat(response.getRole()).isEqualTo("USER");
        verify(userRepository).save(any(User.class));
    }

    @Test
    void register_withExistingEmail_throwsEmailAlreadyExistsException() {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("existing@example.com");
        request.setPassword("password123");
        request.setFullName("Test User");
        request.setRole("USER");

        when(userRepository.existsByEmail("existing@example.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(EmailAlreadyExistsException.class)
                .hasMessageContaining("existing@example.com");

        verify(userRepository, never()).save(any());
    }

    @Test
    void login_withValidCredentials_returnsAuthResponse() {
        LoginRequest request = new LoginRequest();
        request.setEmail("test@example.com");
        request.setPassword("password123");

        User user = User.builder()
                .email("test@example.com")
                .password("encoded-password")
                .fullName("Test User")
                .role(Role.USER)
                .build();

        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
        when(jwtUtil.generateToken("test@example.com")).thenReturn("jwt-token");

        AuthResponse response = authService.login(request);

        assertThat(response.getToken()).isEqualTo("jwt-token");
        assertThat(response.getEmail()).isEqualTo("test@example.com");
        assertThat(response.getRole()).isEqualTo("USER");
        verify(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));
    }

    @Test
    void login_withInvalidCredentials_throwsException() {
        LoginRequest request = new LoginRequest();
        request.setEmail("test@example.com");
        request.setPassword("wrong-password");

        doThrow(new BadCredentialsException("Bad credentials"))
                .when(authenticationManager).authenticate(any());

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(BadCredentialsException.class);

        verify(userRepository, never()).findByEmail(any());
    }
}
```

- [ ] **Step 2: Testleri çalıştır**

```bash
.\mvnw.cmd test -Dtest=AuthServiceTest
```

Beklenen çıktı:
```
Tests run: 4, Failures: 0, Errors: 0, Skipped: 0
BUILD SUCCESS
```

- [ ] **Step 3: Commit**

```bash
git add src/test/java/com/hikmetsuicmez/komsuconnect_backend/service/AuthServiceTest.java
git commit -m "test: add AuthService unit tests"
```

---

## Task 7: BusinessProfileServiceTest Yaz

**Files:**
- Create: `src/test/java/com/hikmetsuicmez/komsuconnect_backend/service/BusinessProfileServiceTest.java`

- [ ] **Step 1: Test dosyasını oluştur**

```java
package com.hikmetsuicmez.komsuconnect_backend.service;

import com.hikmetsuicmez.komsuconnect_backend.dto.request.CreateBusinessProfileRequest;
import com.hikmetsuicmez.komsuconnect_backend.dto.request.UpdateBusinessProfileRequest;
import com.hikmetsuicmez.komsuconnect_backend.dto.response.BusinessProfileDetailResponse;
import com.hikmetsuicmez.komsuconnect_backend.dto.response.BusinessProfileResponse;
import com.hikmetsuicmez.komsuconnect_backend.dto.response.ProductResponse;
import com.hikmetsuicmez.komsuconnect_backend.entity.BusinessProfile;
import com.hikmetsuicmez.komsuconnect_backend.entity.Role;
import com.hikmetsuicmez.komsuconnect_backend.entity.User;
import com.hikmetsuicmez.komsuconnect_backend.exception.BusinessProfileAlreadyExistsException;
import com.hikmetsuicmez.komsuconnect_backend.exception.BusinessProfileNotFoundException;
import com.hikmetsuicmez.komsuconnect_backend.exception.ForbiddenException;
import com.hikmetsuicmez.komsuconnect_backend.mapper.BusinessProfileMapper;
import com.hikmetsuicmez.komsuconnect_backend.mapper.ProductMapper;
import com.hikmetsuicmez.komsuconnect_backend.repository.BusinessProfileRepository;
import com.hikmetsuicmez.komsuconnect_backend.repository.ProductRepository;
import com.hikmetsuicmez.komsuconnect_backend.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BusinessProfileServiceTest {

    @Mock private BusinessProfileRepository businessProfileRepository;
    @Mock private UserRepository userRepository;
    @Mock private BusinessProfileMapper businessProfileMapper;
    @Mock private ProductRepository productRepository;
    @Mock private ProductMapper productMapper;

    @InjectMocks private BusinessProfileService businessProfileService;

    private User buildUser(String email) {
        return User.builder()
                .email(email)
                .password("encoded")
                .fullName("Test User")
                .role(Role.BUSINESS)
                .build();
    }

    private BusinessProfile buildProfile(UUID id, User user) {
        return BusinessProfile.builder()
                .id(id)
                .user(user)
                .businessName("Test Business")
                .city("Istanbul")
                .build();
    }

    @Test
    void getAllBusinesses_withNoCity_returnsAllWithProductCount() {
        UUID profileId = UUID.randomUUID();
        User user = buildUser("owner@example.com");
        BusinessProfile profile = buildProfile(profileId, user);
        BusinessProfileResponse response = new BusinessProfileResponse();
        response.setId(profileId);

        when(businessProfileRepository.findAllWithUser()).thenReturn(List.of(profile));
        when(businessProfileMapper.toResponse(profile)).thenReturn(response);
        when(productRepository.findProductCountsByBusinessProfile())
                .thenReturn(List.of(new Object[]{profileId, 3L}));

        List<BusinessProfileResponse> result = businessProfileService.getAllBusinesses(null);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getProductCount()).isEqualTo(3L);
        verify(businessProfileRepository).findAllWithUser();
        verify(businessProfileRepository, never()).findAllByCity(any());
    }

    @Test
    void getAllBusinesses_withCity_returnsFilteredBusinesses() {
        UUID profileId = UUID.randomUUID();
        User user = buildUser("owner@example.com");
        BusinessProfile profile = buildProfile(profileId, user);
        BusinessProfileResponse response = new BusinessProfileResponse();
        response.setId(profileId);

        when(businessProfileRepository.findAllByCity("Istanbul")).thenReturn(List.of(profile));
        when(businessProfileMapper.toResponse(profile)).thenReturn(response);
        when(productRepository.findProductCountsByBusinessProfile()).thenReturn(List.of());

        List<BusinessProfileResponse> result = businessProfileService.getAllBusinesses("Istanbul");

        assertThat(result).hasSize(1);
        verify(businessProfileRepository).findAllByCity("Istanbul");
        verify(businessProfileRepository, never()).findAllWithUser();
    }

    @Test
    void getBusinessById_withExistingId_returnsDetailResponse() {
        UUID profileId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        User user = User.builder()
                .id(userId)
                .email("owner@example.com")
                .password("encoded")
                .fullName("Owner")
                .role(Role.BUSINESS)
                .build();
        BusinessProfile profile = buildProfile(profileId, user);

        ProductResponse productResponse = ProductResponse.builder()
                .id(UUID.randomUUID())
                .name("Test Product")
                .price(BigDecimal.valueOf(10.0))
                .build();

        when(businessProfileRepository.findById(profileId)).thenReturn(Optional.of(profile));
        when(productRepository.findByBusinessProfileId(profileId))
                .thenReturn(List.of());
        when(productMapper.toResponseList(List.of())).thenReturn(List.of(productResponse));

        BusinessProfileDetailResponse result = businessProfileService.getBusinessById(profileId);

        assertThat(result.getId()).isEqualTo(profileId);
        assertThat(result.getUserId()).isEqualTo(userId);
        assertThat(result.getBusinessName()).isEqualTo("Test Business");
        assertThat(result.getProducts()).hasSize(1);
        assertThat(result.getProductCount()).isEqualTo(1L);
    }

    @Test
    void getBusinessById_withNonExistingId_throwsNotFoundException() {
        UUID id = UUID.randomUUID();
        when(businessProfileRepository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> businessProfileService.getBusinessById(id))
                .isInstanceOf(BusinessProfileNotFoundException.class);
    }

    @Test
    void createBusinessProfile_withValidRequest_returnsCreatedProfile() {
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
        request.setCity("Ankara");
        request.setPhone("0500000000");

        BusinessProfileResponse expected = new BusinessProfileResponse();
        expected.setBusinessName("My Shop");

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));
        when(businessProfileRepository.existsByUserId(user.getId())).thenReturn(false);
        when(businessProfileRepository.save(any(BusinessProfile.class))).thenAnswer(inv -> inv.getArgument(0));
        when(businessProfileMapper.toResponse(any(BusinessProfile.class))).thenReturn(expected);

        BusinessProfileResponse result = businessProfileService.createBusinessProfile(request, email);

        assertThat(result.getBusinessName()).isEqualTo("My Shop");
        verify(businessProfileRepository).save(any(BusinessProfile.class));
    }

    @Test
    void createBusinessProfile_withDuplicateProfile_throwsAlreadyExistsException() {
        String email = "owner@example.com";
        User user = User.builder()
                .id(UUID.randomUUID())
                .email(email)
                .password("encoded")
                .fullName("Owner")
                .role(Role.BUSINESS)
                .build();

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));
        when(businessProfileRepository.existsByUserId(user.getId())).thenReturn(true);

        CreateBusinessProfileRequest request = new CreateBusinessProfileRequest();
        request.setBusinessName("My Shop");

        assertThatThrownBy(() -> businessProfileService.createBusinessProfile(request, email))
                .isInstanceOf(BusinessProfileAlreadyExistsException.class);

        verify(businessProfileRepository, never()).save(any());
    }

    @Test
    void updateBusinessProfile_withWrongOwner_throwsForbiddenException() {
        UUID profileId = UUID.randomUUID();
        User owner = buildUser("owner@example.com");
        BusinessProfile profile = buildProfile(profileId, owner);

        when(businessProfileRepository.findById(profileId)).thenReturn(Optional.of(profile));

        UpdateBusinessProfileRequest request = new UpdateBusinessProfileRequest();
        request.setBusinessName("Updated");

        assertThatThrownBy(() -> businessProfileService.updateBusinessProfile(profileId, request, "other@example.com"))
                .isInstanceOf(ForbiddenException.class);
    }

    @Test
    void getCities_returnsDistinctCities() {
        when(businessProfileRepository.findDistinctCities())
                .thenReturn(List.of("Ankara", "Istanbul", "Izmir"));

        List<String> cities = businessProfileService.getCities();

        assertThat(cities).containsExactly("Ankara", "Istanbul", "Izmir");
    }
}
```

- [ ] **Step 2: Testleri çalıştır**

```bash
.\mvnw.cmd test -Dtest=BusinessProfileServiceTest
```

Beklenen çıktı:
```
Tests run: 8, Failures: 0, Errors: 0, Skipped: 0
BUILD SUCCESS
```

- [ ] **Step 3: Commit**

```bash
git add src/test/java/com/hikmetsuicmez/komsuconnect_backend/service/BusinessProfileServiceTest.java
git commit -m "test: add BusinessProfileService unit tests"
```

---

## Task 8: ProductServiceTest Yaz

**Files:**
- Create: `src/test/java/com/hikmetsuicmez/komsuconnect_backend/service/ProductServiceTest.java`

- [ ] **Step 1: Test dosyasını oluştur**

```java
package com.hikmetsuicmez.komsuconnect_backend.service;

import com.hikmetsuicmez.komsuconnect_backend.dto.request.CreateProductRequest;
import com.hikmetsuicmez.komsuconnect_backend.dto.response.ProductResponse;
import com.hikmetsuicmez.komsuconnect_backend.entity.BusinessProfile;
import com.hikmetsuicmez.komsuconnect_backend.entity.Product;
import com.hikmetsuicmez.komsuconnect_backend.entity.Role;
import com.hikmetsuicmez.komsuconnect_backend.entity.User;
import com.hikmetsuicmez.komsuconnect_backend.exception.BusinessProfileNotFoundException;
import com.hikmetsuicmez.komsuconnect_backend.exception.ForbiddenException;
import com.hikmetsuicmez.komsuconnect_backend.exception.ProductNotFoundException;
import com.hikmetsuicmez.komsuconnect_backend.mapper.ProductMapper;
import com.hikmetsuicmez.komsuconnect_backend.repository.BusinessProfileRepository;
import com.hikmetsuicmez.komsuconnect_backend.repository.ProductRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @Mock private ProductRepository productRepository;
    @Mock private BusinessProfileRepository businessProfileRepository;
    @Mock private ProductMapper productMapper;

    @InjectMocks private ProductService productService;

    private User buildUser(String email) {
        return User.builder()
                .email(email)
                .password("encoded")
                .fullName("Owner")
                .role(Role.BUSINESS)
                .build();
    }

    private BusinessProfile buildProfile(UUID id, User user) {
        return BusinessProfile.builder()
                .id(id)
                .user(user)
                .businessName("Test Business")
                .build();
    }

    @Test
    void getProducts_withValidBusinessId_returnsProducts() {
        UUID businessId = UUID.randomUUID();
        BusinessProfile profile = buildProfile(businessId, buildUser("owner@example.com"));
        Product product = Product.builder()
                .id(UUID.randomUUID())
                .businessProfile(profile)
                .name("Ekmek")
                .price(BigDecimal.valueOf(5.0))
                .build();
        ProductResponse productResponse = ProductResponse.builder()
                .id(product.getId())
                .name("Ekmek")
                .price(BigDecimal.valueOf(5.0))
                .build();

        when(businessProfileRepository.findById(businessId)).thenReturn(Optional.of(profile));
        when(productRepository.findByBusinessProfileId(businessId)).thenReturn(List.of(product));
        when(productMapper.toResponseList(List.of(product))).thenReturn(List.of(productResponse));

        List<ProductResponse> result = productService.getProducts(businessId);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getName()).isEqualTo("Ekmek");
    }

    @Test
    void getProducts_withNonExistingBusiness_throwsNotFoundException() {
        UUID businessId = UUID.randomUUID();
        when(businessProfileRepository.findById(businessId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> productService.getProducts(businessId))
                .isInstanceOf(BusinessProfileNotFoundException.class);
    }

    @Test
    void addProduct_withValidRequest_returnsProduct() {
        UUID businessId = UUID.randomUUID();
        String ownerEmail = "owner@example.com";
        User user = buildUser(ownerEmail);
        BusinessProfile profile = buildProfile(businessId, user);

        CreateProductRequest request = new CreateProductRequest();
        request.setName("Süt");
        request.setPrice(BigDecimal.valueOf(15.0));
        request.setAvailable(true);

        ProductResponse expected = ProductResponse.builder()
                .name("Süt")
                .price(BigDecimal.valueOf(15.0))
                .build();

        when(businessProfileRepository.findById(businessId)).thenReturn(Optional.of(profile));
        when(productRepository.save(any(Product.class))).thenAnswer(inv -> inv.getArgument(0));
        when(productMapper.toResponse(any(Product.class))).thenReturn(expected);

        ProductResponse result = productService.addProduct(businessId, request, ownerEmail);

        assertThat(result.getName()).isEqualTo("Süt");
        verify(productRepository).save(any(Product.class));
    }

    @Test
    void addProduct_withWrongOwner_throwsForbiddenException() {
        UUID businessId = UUID.randomUUID();
        User owner = buildUser("owner@example.com");
        BusinessProfile profile = buildProfile(businessId, owner);

        CreateProductRequest request = new CreateProductRequest();
        request.setName("Süt");
        request.setPrice(BigDecimal.valueOf(15.0));

        when(businessProfileRepository.findById(businessId)).thenReturn(Optional.of(profile));

        assertThatThrownBy(() -> productService.addProduct(businessId, request, "other@example.com"))
                .isInstanceOf(ForbiddenException.class);

        verify(productRepository, never()).save(any());
    }

    @Test
    void deleteProduct_withProductNotBelongingToBusiness_throwsNotFoundException() {
        UUID businessId = UUID.randomUUID();
        UUID otherBusinessId = UUID.randomUUID();
        UUID productId = UUID.randomUUID();
        String ownerEmail = "owner@example.com";

        User user = buildUser(ownerEmail);
        BusinessProfile targetBusiness = buildProfile(businessId, user);
        BusinessProfile otherBusiness = buildProfile(otherBusinessId, buildUser("other@example.com"));

        Product product = Product.builder()
                .id(productId)
                .businessProfile(otherBusiness)
                .name("Yabancı Ürün")
                .price(BigDecimal.valueOf(10.0))
                .build();

        when(businessProfileRepository.findById(businessId)).thenReturn(Optional.of(targetBusiness));
        when(productRepository.findById(productId)).thenReturn(Optional.of(product));

        assertThatThrownBy(() -> productService.deleteProduct(businessId, productId, ownerEmail))
                .isInstanceOf(ProductNotFoundException.class);

        verify(productRepository, never()).delete(any());
    }
}
```

- [ ] **Step 2: Testleri çalıştır**

```bash
.\mvnw.cmd test -Dtest=ProductServiceTest
```

Beklenen çıktı:
```
Tests run: 5, Failures: 0, Errors: 0, Skipped: 0
BUILD SUCCESS
```

- [ ] **Step 3: Tüm testleri çalıştır (final doğrulama)**

```bash
.\mvnw.cmd test
```

Beklenen çıktı:
```
Tests run: 17, Failures: 0, Errors: 0, Skipped: 0
BUILD SUCCESS
```

- [ ] **Step 4: Commit**

```bash
git add src/test/java/com/hikmetsuicmez/komsuconnect_backend/service/ProductServiceTest.java
git commit -m "test: add ProductService unit tests"
```

---

## Definition of Done Kontrol Listesi

- [ ] `GET /api/v1/businesses` city parametresi ile ve parametresiz çalışıyor
- [ ] `GET /api/v1/businesses?city=Istanbul` sadece o şehrin esnaflarını döndürüyor
- [ ] `GET /api/v1/businesses/{id}` ürün listesi ve productCount içeren `BusinessProfileDetailResponse` döndürüyor
- [ ] `GET /api/v1/businesses/cities` unique şehir listesi (alfabetik) döndürüyor
- [ ] `BusinessProfileResponse` productCount içeriyor (liste endpoint'inde dolu)
- [ ] Tüm 17 test geçiyor (`AuthServiceTest`: 4, `BusinessProfileServiceTest`: 8, `ProductServiceTest`: 5)
- [ ] `/businesses/cities` endpoint'i token gerektirmiyor (public)
- [ ] `.\mvnw.cmd compile` hatasız geçiyor
