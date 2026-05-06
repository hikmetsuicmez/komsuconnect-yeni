# Sprint 2 — Business Panel Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement BusinessProfile CRUD and Product CRUD endpoints with ownership-based authorization for KomsuConnect's business panel.

**Architecture:** Services receive the current user's email (extracted from `@AuthenticationPrincipal` in controllers) and enforce ownership in the service layer. Public endpoints (GET list, GET detail, GET products) require no token. Write/mutation endpoints require auth and ownership; creating a business requires `ROLE_BUSINESS`.

**Tech Stack:** Spring Boot 3.5.x, Java 21, Spring Security + JWT, Spring Data JPA, MapStruct 1.5.5, Flyway, Lombok

---

## File Map

### New files
| File | Purpose |
|------|---------|
| `src/main/java/.../entity/Product.java` | Product JPA entity |
| `src/main/resources/db/migration/V2__add_products.sql` | Flyway migration |
| `src/main/java/.../dto/request/CreateBusinessProfileRequest.java` | Validate incoming create-business payload |
| `src/main/java/.../dto/request/UpdateBusinessProfileRequest.java` | Validate incoming update-business payload |
| `src/main/java/.../dto/request/CreateProductRequest.java` | Validate incoming create-product payload |
| `src/main/java/.../dto/request/UpdateProductRequest.java` | Validate incoming update-product payload |
| `src/main/java/.../dto/response/BusinessProfileResponse.java` | Outbound business profile DTO |
| `src/main/java/.../dto/response/ProductResponse.java` | Outbound product DTO |
| `src/main/java/.../exception/BusinessProfileNotFoundException.java` | 404 for missing profiles |
| `src/main/java/.../exception/BusinessProfileAlreadyExistsException.java` | 409 for duplicate profiles |
| `src/main/java/.../exception/ProductNotFoundException.java` | 404 for missing products |
| `src/main/java/.../exception/ForbiddenException.java` | 403 for ownership violations |
| `src/main/java/.../mapper/BusinessProfileMapper.java` | MapStruct: BusinessProfile → DTO |
| `src/main/java/.../mapper/ProductMapper.java` | MapStruct: Product → DTO |
| `src/main/java/.../repository/ProductRepository.java` | JPA repository for products |
| `src/main/java/.../service/BusinessProfileService.java` | Business profile CRUD logic |
| `src/main/java/.../service/ProductService.java` | Product CRUD logic |
| `src/main/java/.../controller/BusinessController.java` | REST endpoints for /businesses |
| `src/main/java/.../controller/ProductController.java` | REST endpoints for /businesses/{id}/products |

### Modified files
| File | Change |
|------|--------|
| `src/main/java/.../repository/BusinessProfileRepository.java` | Add `existsByUserId` |
| `src/main/java/.../exception/GlobalExceptionHandler.java` | Handle new exception types |
| `src/main/java/.../config/SecurityConfig.java` | Add role/path rules for new endpoints |

---

> **Note on tests:** Per CLAUDE.md, unit tests are Sprint 3+. Steps below skip TDD phases.

---

## Task 1: Product Entity + V2 Migration

**Files:**
- Create: `src/main/java/com/hikmetsuicmez/komsuconnect_backend/entity/Product.java`
- Create: `src/main/resources/db/migration/V2__add_products.sql`

- [ ] **Step 1: Create `V2__add_products.sql`**

```sql
CREATE TABLE IF NOT EXISTS products (
    id                  UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    business_profile_id UUID           NOT NULL,
    name                VARCHAR(255)   NOT NULL,
    description         TEXT,
    price               NUMERIC(10, 2) NOT NULL,
    image_url           VARCHAR(500),
    available           BOOLEAN        NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMP      NOT NULL,
    updated_at          TIMESTAMP      NOT NULL,
    CONSTRAINT fk_product_business FOREIGN KEY (business_profile_id)
        REFERENCES business_profiles (id)
);
```

- [ ] **Step 2: Create `Product.java`**

```java
package com.hikmetsuicmez.komsuconnect_backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "products")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "business_profile_id", nullable = false)
    private BusinessProfile businessProfile;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Column(length = 500)
    private String imageUrl;

    @Column(nullable = false)
    @Builder.Default
    private boolean available = true;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(nullable = false)
    private LocalDateTime updatedAt;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/main/java/com/hikmetsuicmez/komsuconnect_backend/entity/Product.java
git add src/main/resources/db/migration/V2__add_products.sql
git commit -m "feat: add Product entity and V2 Flyway migration"
```

---

## Task 2: Request and Response DTOs

**Files:**
- Create: `src/main/java/.../dto/request/CreateBusinessProfileRequest.java`
- Create: `src/main/java/.../dto/request/UpdateBusinessProfileRequest.java`
- Create: `src/main/java/.../dto/request/CreateProductRequest.java`
- Create: `src/main/java/.../dto/request/UpdateProductRequest.java`
- Create: `src/main/java/.../dto/response/BusinessProfileResponse.java`
- Create: `src/main/java/.../dto/response/ProductResponse.java`

- [ ] **Step 1: Create `CreateBusinessProfileRequest.java`**

```java
package com.hikmetsuicmez.komsuconnect_backend.dto.request;

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

    @Size(max = 20)
    private String phone;
}
```

- [ ] **Step 2: Create `UpdateBusinessProfileRequest.java`**

```java
package com.hikmetsuicmez.komsuconnect_backend.dto.request;

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

    @Size(max = 20)
    private String phone;
}
```

- [ ] **Step 3: Create `CreateProductRequest.java`**

```java
package com.hikmetsuicmez.komsuconnect_backend.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class CreateProductRequest {

    @NotBlank
    private String name;

    private String description;

    @NotNull
    @DecimalMin(value = "0.01", message = "Price must be greater than 0")
    private BigDecimal price;

    private String imageUrl;

    private boolean available = true;
}
```

- [ ] **Step 4: Create `UpdateProductRequest.java`**

```java
package com.hikmetsuicmez.komsuconnect_backend.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class UpdateProductRequest {

    @NotBlank
    private String name;

    private String description;

    @NotNull
    @DecimalMin(value = "0.01", message = "Price must be greater than 0")
    private BigDecimal price;

    private String imageUrl;

    private boolean available;
}
```

- [ ] **Step 5: Create `BusinessProfileResponse.java`**

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
}
```

- [ ] **Step 6: Create `ProductResponse.java`**

```java
package com.hikmetsuicmez.komsuconnect_backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ProductResponse {
    private UUID id;
    private UUID businessProfileId;
    private String name;
    private String description;
    private BigDecimal price;
    private String imageUrl;
    private boolean available;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
```

- [ ] **Step 7: Commit**

```bash
git add src/main/java/com/hikmetsuicmez/komsuconnect_backend/dto/
git commit -m "feat: add request/response DTOs for business profiles and products"
```

---

## Task 3: Custom Exceptions + GlobalExceptionHandler Update

**Files:**
- Create: `src/main/java/.../exception/BusinessProfileNotFoundException.java`
- Create: `src/main/java/.../exception/BusinessProfileAlreadyExistsException.java`
- Create: `src/main/java/.../exception/ProductNotFoundException.java`
- Create: `src/main/java/.../exception/ForbiddenException.java`
- Modify: `src/main/java/.../exception/GlobalExceptionHandler.java`

- [ ] **Step 1: Create `BusinessProfileNotFoundException.java`**

```java
package com.hikmetsuicmez.komsuconnect_backend.exception;

public class BusinessProfileNotFoundException extends RuntimeException {
    public BusinessProfileNotFoundException(String message) {
        super(message);
    }
}
```

- [ ] **Step 2: Create `BusinessProfileAlreadyExistsException.java`**

```java
package com.hikmetsuicmez.komsuconnect_backend.exception;

public class BusinessProfileAlreadyExistsException extends RuntimeException {
    public BusinessProfileAlreadyExistsException(String message) {
        super(message);
    }
}
```

- [ ] **Step 3: Create `ProductNotFoundException.java`**

```java
package com.hikmetsuicmez.komsuconnect_backend.exception;

public class ProductNotFoundException extends RuntimeException {
    public ProductNotFoundException(String message) {
        super(message);
    }
}
```

- [ ] **Step 4: Create `ForbiddenException.java`**

```java
package com.hikmetsuicmez.komsuconnect_backend.exception;

public class ForbiddenException extends RuntimeException {
    public ForbiddenException(String message) {
        super(message);
    }
}
```

- [ ] **Step 5: Update `GlobalExceptionHandler.java` — add handlers for new exceptions**

Add these three handler methods inside the existing `GlobalExceptionHandler` class (after the `handleBadCredentials` method):

```java
@ExceptionHandler({BusinessProfileNotFoundException.class, ProductNotFoundException.class})
public ResponseEntity<Map<String, Object>> handleNotFound(RuntimeException ex) {
    return buildResponse(HttpStatus.NOT_FOUND, ex.getMessage());
}

@ExceptionHandler(ForbiddenException.class)
public ResponseEntity<Map<String, Object>> handleForbidden(ForbiddenException ex) {
    return buildResponse(HttpStatus.FORBIDDEN, ex.getMessage());
}

@ExceptionHandler(BusinessProfileAlreadyExistsException.class)
public ResponseEntity<Map<String, Object>> handleAlreadyExists(BusinessProfileAlreadyExistsException ex) {
    return buildResponse(HttpStatus.CONFLICT, ex.getMessage());
}
```

- [ ] **Step 6: Commit**

```bash
git add src/main/java/com/hikmetsuicmez/komsuconnect_backend/exception/
git commit -m "feat: add domain exceptions for business profiles and products"
```

---

## Task 4: Repository Layer

**Files:**
- Create: `src/main/java/.../repository/ProductRepository.java`
- Modify: `src/main/java/.../repository/BusinessProfileRepository.java`

- [ ] **Step 1: Create `ProductRepository.java`**

```java
package com.hikmetsuicmez.komsuconnect_backend.repository;

import com.hikmetsuicmez.komsuconnect_backend.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ProductRepository extends JpaRepository<Product, UUID> {
    List<Product> findByBusinessProfileId(UUID businessProfileId);
}
```

- [ ] **Step 2: Add `existsByUserId` to `BusinessProfileRepository.java`**

Replace the existing content of `BusinessProfileRepository.java` with:

```java
package com.hikmetsuicmez.komsuconnect_backend.repository;

import com.hikmetsuicmez.komsuconnect_backend.entity.BusinessProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface BusinessProfileRepository extends JpaRepository<BusinessProfile, UUID> {
    Optional<BusinessProfile> findByUserId(UUID userId);
    boolean existsByUserId(UUID userId);
}
```

- [ ] **Step 3: Commit**

```bash
git add src/main/java/com/hikmetsuicmez/komsuconnect_backend/repository/
git commit -m "feat: add ProductRepository and existsByUserId to BusinessProfileRepository"
```

---

## Task 5: MapStruct Mappers

**Files:**
- Create: `src/main/java/.../mapper/BusinessProfileMapper.java`
- Create: `src/main/java/.../mapper/ProductMapper.java`

- [ ] **Step 1: Create `BusinessProfileMapper.java`**

```java
package com.hikmetsuicmez.komsuconnect_backend.mapper;

import com.hikmetsuicmez.komsuconnect_backend.dto.response.BusinessProfileResponse;
import com.hikmetsuicmez.komsuconnect_backend.entity.BusinessProfile;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface BusinessProfileMapper {

    @Mapping(source = "user.id", target = "userId")
    BusinessProfileResponse toResponse(BusinessProfile businessProfile);

    List<BusinessProfileResponse> toResponseList(List<BusinessProfile> businessProfiles);
}
```

- [ ] **Step 2: Create `ProductMapper.java`**

```java
package com.hikmetsuicmez.komsuconnect_backend.mapper;

import com.hikmetsuicmez.komsuconnect_backend.dto.response.ProductResponse;
import com.hikmetsuicmez.komsuconnect_backend.entity.Product;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface ProductMapper {

    @Mapping(source = "businessProfile.id", target = "businessProfileId")
    ProductResponse toResponse(Product product);

    List<ProductResponse> toResponseList(List<Product> products);
}
```

- [ ] **Step 3: Commit**

```bash
git add src/main/java/com/hikmetsuicmez/komsuconnect_backend/mapper/
git commit -m "feat: add MapStruct mappers for BusinessProfile and Product"
```

---

## Task 6: BusinessProfileService

**Files:**
- Create: `src/main/java/.../service/BusinessProfileService.java`

- [ ] **Step 1: Create `BusinessProfileService.java`**

```java
package com.hikmetsuicmez.komsuconnect_backend.service;

import com.hikmetsuicmez.komsuconnect_backend.dto.request.CreateBusinessProfileRequest;
import com.hikmetsuicmez.komsuconnect_backend.dto.request.UpdateBusinessProfileRequest;
import com.hikmetsuicmez.komsuconnect_backend.dto.response.BusinessProfileResponse;
import com.hikmetsuicmez.komsuconnect_backend.entity.BusinessProfile;
import com.hikmetsuicmez.komsuconnect_backend.entity.User;
import com.hikmetsuicmez.komsuconnect_backend.exception.BusinessProfileAlreadyExistsException;
import com.hikmetsuicmez.komsuconnect_backend.exception.BusinessProfileNotFoundException;
import com.hikmetsuicmez.komsuconnect_backend.exception.ForbiddenException;
import com.hikmetsuicmez.komsuconnect_backend.mapper.BusinessProfileMapper;
import com.hikmetsuicmez.komsuconnect_backend.repository.BusinessProfileRepository;
import com.hikmetsuicmez.komsuconnect_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class BusinessProfileService {

    private final BusinessProfileRepository businessProfileRepository;
    private final UserRepository userRepository;
    private final BusinessProfileMapper businessProfileMapper;

    public List<BusinessProfileResponse> getAllBusinesses() {
        return businessProfileMapper.toResponseList(businessProfileRepository.findAll());
    }

    public BusinessProfileResponse getBusinessById(UUID id) {
        return businessProfileMapper.toResponse(findProfileOrThrow(id));
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

    public BusinessProfileResponse getMyBusinessProfile(String email) {
        User user = findUserOrThrow(email);
        BusinessProfile profile = businessProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new BusinessProfileNotFoundException("No business profile found for this account"));
        return businessProfileMapper.toResponse(profile);
    }

    private BusinessProfile findProfileOrThrow(UUID id) {
        return businessProfileRepository.findById(id)
                .orElseThrow(() -> new BusinessProfileNotFoundException("Business not found: " + id));
    }

    private User findUserOrThrow(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));
    }

    private void verifyOwner(BusinessProfile profile, String email) {
        if (!profile.getUser().getEmail().equals(email)) {
            throw new ForbiddenException("You do not own this business profile");
        }
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/main/java/com/hikmetsuicmez/komsuconnect_backend/service/BusinessProfileService.java
git commit -m "feat: add BusinessProfileService with CRUD and ownership check"
```

---

## Task 7: ProductService

**Files:**
- Create: `src/main/java/.../service/ProductService.java`

- [ ] **Step 1: Create `ProductService.java`**

```java
package com.hikmetsuicmez.komsuconnect_backend.service;

import com.hikmetsuicmez.komsuconnect_backend.dto.request.CreateProductRequest;
import com.hikmetsuicmez.komsuconnect_backend.dto.request.UpdateProductRequest;
import com.hikmetsuicmez.komsuconnect_backend.dto.response.ProductResponse;
import com.hikmetsuicmez.komsuconnect_backend.entity.BusinessProfile;
import com.hikmetsuicmez.komsuconnect_backend.entity.Product;
import com.hikmetsuicmez.komsuconnect_backend.exception.BusinessProfileNotFoundException;
import com.hikmetsuicmez.komsuconnect_backend.exception.ForbiddenException;
import com.hikmetsuicmez.komsuconnect_backend.exception.ProductNotFoundException;
import com.hikmetsuicmez.komsuconnect_backend.mapper.ProductMapper;
import com.hikmetsuicmez.komsuconnect_backend.repository.BusinessProfileRepository;
import com.hikmetsuicmez.komsuconnect_backend.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductService {

    private final ProductRepository productRepository;
    private final BusinessProfileRepository businessProfileRepository;
    private final ProductMapper productMapper;

    public List<ProductResponse> getProducts(UUID businessId) {
        if (!businessProfileRepository.existsById(businessId)) {
            throw new BusinessProfileNotFoundException("Business not found: " + businessId);
        }
        return productMapper.toResponseList(productRepository.findByBusinessProfileId(businessId));
    }

    @Transactional
    public ProductResponse addProduct(UUID businessId, CreateProductRequest request, String email) {
        BusinessProfile profile = getProfileAndVerifyOwner(businessId, email);

        Product product = Product.builder()
                .businessProfile(profile)
                .name(request.getName())
                .description(request.getDescription())
                .price(request.getPrice())
                .imageUrl(request.getImageUrl())
                .available(request.isAvailable())
                .build();

        productRepository.save(product);
        log.info("Product '{}' added to business {}", request.getName(), businessId);
        return productMapper.toResponse(product);
    }

    @Transactional
    public ProductResponse updateProduct(UUID businessId, UUID productId, UpdateProductRequest request, String email) {
        getProfileAndVerifyOwner(businessId, email);

        Product product = findProductOrThrow(productId);
        verifyProductBelongsToBusiness(product, businessId);

        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setPrice(request.getPrice());
        product.setImageUrl(request.getImageUrl());
        product.setAvailable(request.isAvailable());

        return productMapper.toResponse(product);
    }

    @Transactional
    public void deleteProduct(UUID businessId, UUID productId, String email) {
        getProfileAndVerifyOwner(businessId, email);

        Product product = findProductOrThrow(productId);
        verifyProductBelongsToBusiness(product, businessId);

        productRepository.delete(product);
        log.info("Product {} deleted from business {}", productId, businessId);
    }

    private BusinessProfile getProfileAndVerifyOwner(UUID businessId, String email) {
        BusinessProfile profile = businessProfileRepository.findById(businessId)
                .orElseThrow(() -> new BusinessProfileNotFoundException("Business not found: " + businessId));
        if (!profile.getUser().getEmail().equals(email)) {
            throw new ForbiddenException("You do not own this business profile");
        }
        return profile;
    }

    private Product findProductOrThrow(UUID productId) {
        return productRepository.findById(productId)
                .orElseThrow(() -> new ProductNotFoundException("Product not found: " + productId));
    }

    private void verifyProductBelongsToBusiness(Product product, UUID businessId) {
        if (!product.getBusinessProfile().getId().equals(businessId)) {
            throw new ForbiddenException("Product does not belong to this business");
        }
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/main/java/com/hikmetsuicmez/komsuconnect_backend/service/ProductService.java
git commit -m "feat: add ProductService with CRUD and ownership check"
```

---

## Task 8: BusinessController

**Files:**
- Create: `src/main/java/.../controller/BusinessController.java`

- [ ] **Step 1: Create `BusinessController.java`**

```java
package com.hikmetsuicmez.komsuconnect_backend.controller;

import com.hikmetsuicmez.komsuconnect_backend.dto.request.CreateBusinessProfileRequest;
import com.hikmetsuicmez.komsuconnect_backend.dto.request.UpdateBusinessProfileRequest;
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
    public ResponseEntity<List<BusinessProfileResponse>> getAllBusinesses() {
        return ResponseEntity.ok(businessProfileService.getAllBusinesses());
    }

    @GetMapping("/me")
    public ResponseEntity<BusinessProfileResponse> getMyBusinessProfile(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(businessProfileService.getMyBusinessProfile(userDetails.getUsername()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<BusinessProfileResponse> getBusinessById(@PathVariable UUID id) {
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

> **Important:** `/me` is declared **before** `/{id}` in the class so Spring MVC routes it to the exact match, not the variable capture.

- [ ] **Step 2: Commit**

```bash
git add src/main/java/com/hikmetsuicmez/komsuconnect_backend/controller/BusinessController.java
git commit -m "feat: add BusinessController with profile CRUD endpoints"
```

---

## Task 9: ProductController

**Files:**
- Create: `src/main/java/.../controller/ProductController.java`

- [ ] **Step 1: Create `ProductController.java`**

```java
package com.hikmetsuicmez.komsuconnect_backend.controller;

import com.hikmetsuicmez.komsuconnect_backend.dto.request.CreateProductRequest;
import com.hikmetsuicmez.komsuconnect_backend.dto.request.UpdateProductRequest;
import com.hikmetsuicmez.komsuconnect_backend.dto.response.ProductResponse;
import com.hikmetsuicmez.komsuconnect_backend.service.ProductService;
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
@RequestMapping("/api/v1/businesses/{businessId}/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @GetMapping
    public ResponseEntity<List<ProductResponse>> getProducts(@PathVariable UUID businessId) {
        return ResponseEntity.ok(productService.getProducts(businessId));
    }

    @PostMapping
    public ResponseEntity<ProductResponse> addProduct(
            @PathVariable UUID businessId,
            @Valid @RequestBody CreateProductRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(productService.addProduct(businessId, request, userDetails.getUsername()));
    }

    @PutMapping("/{productId}")
    public ResponseEntity<ProductResponse> updateProduct(
            @PathVariable UUID businessId,
            @PathVariable UUID productId,
            @Valid @RequestBody UpdateProductRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(
                productService.updateProduct(businessId, productId, request, userDetails.getUsername()));
    }

    @DeleteMapping("/{productId}")
    public ResponseEntity<Void> deleteProduct(
            @PathVariable UUID businessId,
            @PathVariable UUID productId,
            @AuthenticationPrincipal UserDetails userDetails) {
        productService.deleteProduct(businessId, productId, userDetails.getUsername());
        return ResponseEntity.noContent().build();
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/main/java/com/hikmetsuicmez/komsuconnect_backend/controller/ProductController.java
git commit -m "feat: add ProductController with product CRUD endpoints"
```

---

## Task 10: SecurityConfig Update

**Files:**
- Modify: `src/main/java/.../config/SecurityConfig.java`

- [ ] **Step 1: Replace the `authorizeHttpRequests` block in `SecurityConfig.java`**

Replace only the `authorizeHttpRequests` lambda (inside `securityFilterChain`). The current block is:

```java
.authorizeHttpRequests(auth -> auth
        .requestMatchers("/api/v1/auth/**").permitAll()
        .requestMatchers(HttpMethod.GET, "/api/v1/businesses", "/api/v1/businesses/{id}").permitAll()
        .anyRequest().authenticated()
)
```

Replace it with:

```java
.authorizeHttpRequests(auth -> auth
        .requestMatchers("/api/v1/auth/**").permitAll()
        // /me must be listed before /{id} so Spring Security matches it as exact, not variable
        .requestMatchers(HttpMethod.GET, "/api/v1/businesses/me").authenticated()
        .requestMatchers(HttpMethod.GET, "/api/v1/businesses", "/api/v1/businesses/{id}").permitAll()
        .requestMatchers(HttpMethod.GET, "/api/v1/businesses/{businessId}/products").permitAll()
        .requestMatchers(HttpMethod.POST, "/api/v1/businesses").hasRole("BUSINESS")
        .anyRequest().authenticated()
)
```

- [ ] **Step 2: Commit**

```bash
git add src/main/java/com/hikmetsuicmez/komsuconnect_backend/config/SecurityConfig.java
git commit -m "feat: update SecurityConfig for business/product endpoint authorization"
```

---

## Task 11: Build Verification

- [ ] **Step 1: Compile and run the application**

```bash
./mvnw clean package -DskipTests
```

Expected: `BUILD SUCCESS`

- [ ] **Step 2: Start the application and verify startup**

```bash
./mvnw spring-boot:run
```

Expected output includes:
- `Started KomsuconnectBackendApplication`
- Flyway output: `Successfully applied 1 migration to schema "public"` (V2)
- No `HibernateException` or schema errors

- [ ] **Step 3: Smoke test endpoints with curl**

```bash
# Public: list businesses (empty array is OK)
curl -s http://localhost:8080/api/v1/businesses | jq .

# Register a BUSINESS user
curl -s -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"esnaf@test.com","password":"password123","fullName":"Ali Esnaf","role":"BUSINESS"}' | jq .

# Login and capture token
TOKEN=$(curl -s -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"esnaf@test.com","password":"password123"}' | jq -r .token)

# Create business profile
curl -s -X POST http://localhost:8080/api/v1/businesses \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"businessName":"Ali Bakkal","description":"Köşe bakkalı","city":"Istanbul"}' | jq .

# Get my business
curl -s http://localhost:8080/api/v1/businesses/me \
  -H "Authorization: Bearer $TOKEN" | jq .

# Verify 403 when no auth on protected endpoint
curl -s -o /dev/null -w "%{http_code}" \
  -X POST http://localhost:8080/api/v1/businesses \
  -H "Content-Type: application/json" \
  -d '{"businessName":"Test"}'
# Expected: 403
```

- [ ] **Step 4: Final commit if any fixups were needed**

```bash
git add -p
git commit -m "fix: post-build adjustments"
```

---

## Spec Coverage Self-Check

| Requirement | Task |
|-------------|------|
| GET /api/v1/businesses (public) | Task 8 + Task 10 |
| GET /api/v1/businesses/{id} (public) | Task 8 + Task 10 |
| POST /api/v1/businesses (BUSINESS role) | Task 8 + Task 10 |
| PUT /api/v1/businesses/{id} (owner only) | Task 8 + Task 6 (verifyOwner) |
| GET /api/v1/businesses/me | Task 8 |
| GET /api/v1/businesses/{businessId}/products (public) | Task 9 + Task 10 |
| POST /api/v1/businesses/{businessId}/products (owner) | Task 9 + Task 7 |
| PUT /api/v1/businesses/{businessId}/products/{productId} | Task 9 + Task 7 |
| DELETE /api/v1/businesses/{businessId}/products/{productId} | Task 9 + Task 7 |
| Product entity (id, businessProfile, name, desc, price, imageUrl, available, timestamps) | Task 1 |
| V2 Flyway migration | Task 1 |
| 403 for ownership violations | Task 3 (ForbiddenException) + Task 6/7 |
| Response DTOs: BusinessProfileResponse, ProductResponse | Task 2 |
| Request DTOs: CreateProductRequest, UpdateProductRequest | Task 2 |
