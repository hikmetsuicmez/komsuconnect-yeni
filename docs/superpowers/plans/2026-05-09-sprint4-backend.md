# Sprint 4 Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Auth güvenliğini httpOnly cookie + /me endpoint ile güçlendir, Render deploy hazırlığını tamamla, imageUrl validasyonu ekle ve Playwright E2E test senaryolarını yaz.

**Architecture:** Hibrit cookie yaklaşımı — login/register JSON body'de token döndürmeye devam eder ve aynı anda httpOnly cookie set eder. `JwtAuthenticationFilter` önce `Authorization` header'ına, yoksa `jwt-token` cookie'sine bakar. `/me` endpoint cookie/header ile kimlik doğrulayıp kullanıcı bilgisi döner. Deploy için multi-stage Dockerfile + render.yaml + production Spring profili.

**Tech Stack:** Java 21, Spring Boot 3.5.x, JUnit 5 + Mockito, TypeScript, Playwright 1.x, Docker, Render

---

## File Map

**Oluşturulacak (backend):**
- `backend/src/main/java/com/hikmetsuicmez/komsuconnect_backend/dto/response/MeResponse.java`
- `backend/src/main/java/com/hikmetsuicmez/komsuconnect_backend/controller/HealthController.java`
- `backend/src/test/java/com/hikmetsuicmez/komsuconnect_backend/security/JwtAuthenticationFilterTest.java`
- `backend/Dockerfile`
- `backend/render.yaml`
- `backend/src/main/resources/application-prod.yml`

**Değiştirilecek (backend):**
- `backend/src/main/java/com/hikmetsuicmez/komsuconnect_backend/security/JwtAuthenticationFilter.java`
- `backend/src/main/java/com/hikmetsuicmez/komsuconnect_backend/controller/AuthController.java`
- `backend/src/main/java/com/hikmetsuicmez/komsuconnect_backend/service/AuthService.java`
- `backend/src/main/java/com/hikmetsuicmez/komsuconnect_backend/config/SecurityConfig.java`
- `backend/src/main/java/com/hikmetsuicmez/komsuconnect_backend/dto/request/CreateProductRequest.java`
- `backend/src/main/java/com/hikmetsuicmez/komsuconnect_backend/dto/request/UpdateProductRequest.java`
- `backend/src/test/java/com/hikmetsuicmez/komsuconnect_backend/service/AuthServiceTest.java`
- `backend/.env.example`

**Oluşturulacak (frontend):**
- `frontend/playwright.config.ts`
- `frontend/e2e/auth/register.spec.ts`
- `frontend/e2e/auth/login.spec.ts`
- `frontend/e2e/business/profile.spec.ts`
- `frontend/e2e/business/product.spec.ts`

**Değiştirilecek (frontend):**
- `frontend/package.json`

---

### Task 1: JwtAuthenticationFilter — Cookie Fallback

**Files:**
- Create: `backend/src/test/java/com/hikmetsuicmez/komsuconnect_backend/security/JwtAuthenticationFilterTest.java`
- Modify: `backend/src/main/java/com/hikmetsuicmez/komsuconnect_backend/security/JwtAuthenticationFilter.java`

- [ ] **Step 1: Failing test dosyasını oluştur**

```java
package com.hikmetsuicmez.komsuconnect_backend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class JwtAuthenticationFilterTest {

    @Mock private JwtUtil jwtUtil;
    @Mock private UserDetailsService userDetailsService;
    @InjectMocks private JwtAuthenticationFilter filter;

    @AfterEach
    void clearContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void doFilter_withValidCookieAndNoHeader_setsAuthentication() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setCookies(new Cookie("jwt-token", "cookie-token"));
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        UserDetails userDetails = mock(UserDetails.class);
        when(userDetails.getAuthorities()).thenReturn(List.of());
        when(jwtUtil.extractEmail("cookie-token")).thenReturn("user@example.com");
        when(userDetailsService.loadUserByUsername("user@example.com")).thenReturn(userDetails);

        filter.doFilter(request, response, chain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNotNull();
        verify(chain).doFilter(request, response);
    }

    @Test
    void doFilter_prefersAuthorizationHeaderOverCookie() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer header-token");
        request.setCookies(new Cookie("jwt-token", "cookie-token"));
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        UserDetails userDetails = mock(UserDetails.class);
        when(userDetails.getAuthorities()).thenReturn(List.of());
        when(jwtUtil.extractEmail("header-token")).thenReturn("user@example.com");
        when(userDetailsService.loadUserByUsername("user@example.com")).thenReturn(userDetails);

        filter.doFilter(request, response, chain);

        verify(jwtUtil).extractEmail("header-token");
        verify(jwtUtil, never()).extractEmail("cookie-token");
    }

    @Test
    void doFilter_withNoCookieAndNoHeader_doesNotSetAuthentication() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(request, response, chain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(chain).doFilter(request, response);
        verifyNoInteractions(jwtUtil);
    }
}
```

- [ ] **Step 2: Testi çalıştır — FAIL bekleniyor**

```
cd backend && .\mvnw.cmd test -Dtest=JwtAuthenticationFilterTest
```

Beklenen: `doFilter_withValidCookieAndNoHeader_setsAuthentication` → FAIL (cookie okuma yok)

- [ ] **Step 3: `extractToken()` metodunu cookie desteği ile güncelle**

`backend/src/main/java/.../security/JwtAuthenticationFilter.java` içindeki `extractToken()` metodunu değiştir:

```java
private String extractToken(HttpServletRequest request) {
    String header = request.getHeader("Authorization");
    if (StringUtils.hasText(header) && header.startsWith("Bearer ")) {
        return header.substring(7);
    }
    jakarta.servlet.http.Cookie[] cookies = request.getCookies();
    if (cookies != null) {
        for (jakarta.servlet.http.Cookie cookie : cookies) {
            if ("jwt-token".equals(cookie.getName())) {
                String value = cookie.getValue();
                return StringUtils.hasText(value) ? value : null;
            }
        }
    }
    return null;
}
```

- [ ] **Step 4: Testleri çalıştır — PASS bekleniyor**

```
.\mvnw.cmd test -Dtest=JwtAuthenticationFilterTest
```

Beklenen: 3 test PASS

- [ ] **Step 5: Commit**

```
git add backend/src/main/java/com/hikmetsuicmez/komsuconnect_backend/security/JwtAuthenticationFilter.java backend/src/test/java/com/hikmetsuicmez/komsuconnect_backend/security/JwtAuthenticationFilterTest.java
git commit -m "feat: jwt filter reads token from cookie when auth header absent"
```

---

### Task 2: MeResponse DTO + AuthService.me() (TDD)

**Files:**
- Create: `backend/src/main/java/com/hikmetsuicmez/komsuconnect_backend/dto/response/MeResponse.java`
- Modify: `backend/src/test/java/com/hikmetsuicmez/komsuconnect_backend/service/AuthServiceTest.java`
- Modify: `backend/src/main/java/com/hikmetsuicmez/komsuconnect_backend/service/AuthService.java`

- [ ] **Step 1: MeResponse DTO oluştur**

```java
package com.hikmetsuicmez.komsuconnect_backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class MeResponse {
    private String email;
    private String fullName;
    private String role;
}
```

- [ ] **Step 2: AuthServiceTest'e me() testleri ekle**

Dosyanın sonuna, mevcut `import` bloğuna şunu ekle:

```java
import com.hikmetsuicmez.komsuconnect_backend.dto.response.MeResponse;
import com.hikmetsuicmez.komsuconnect_backend.exception.UserNotFoundException;
```

Ardından dosyanın sonuna (son `}` kapanış parantezinden önce) şunu ekle:

```java
    @Test
    void me_withValidEmail_returnsMeResponse() {
        User user = User.builder()
                .email("test@example.com")
                .fullName("Test User")
                .role(Role.USER)
                .build();
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));

        MeResponse response = authService.me("test@example.com");

        assertThat(response.getEmail()).isEqualTo("test@example.com");
        assertThat(response.getFullName()).isEqualTo("Test User");
        assertThat(response.getRole()).isEqualTo("USER");
    }

    @Test
    void me_withUnknownEmail_throwsUserNotFoundException() {
        when(userRepository.findByEmail("ghost@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.me("ghost@example.com"))
                .isInstanceOf(UserNotFoundException.class);
    }
```

- [ ] **Step 3: Testi çalıştır — derleme hatası / FAIL bekleniyor**

```
.\mvnw.cmd test -Dtest=AuthServiceTest
```

Beklenen: derleme hatası (`me(String)` method bulunamadı)

- [ ] **Step 4: AuthService'e me() metodunu ekle**

`AuthService.java` içine, mevcut `import` bloğuna ekle:

```java
import com.hikmetsuicmez.komsuconnect_backend.dto.response.MeResponse;
import com.hikmetsuicmez.komsuconnect_backend.exception.UserNotFoundException;
```

`login()` metodundan sonraya şunu ekle:

```java
public MeResponse me(String email) {
    User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new UserNotFoundException("User not found: " + email));
    return MeResponse.builder()
            .email(user.getEmail())
            .fullName(user.getFullName())
            .role(user.getRole().name())
            .build();
}
```

- [ ] **Step 5: Testleri çalıştır — PASS bekleniyor**

```
.\mvnw.cmd test -Dtest=AuthServiceTest
```

Beklenen: tüm 6 test PASS

- [ ] **Step 6: Commit**

```
git add backend/src/main/java/com/hikmetsuicmez/komsuconnect_backend/dto/response/MeResponse.java backend/src/main/java/com/hikmetsuicmez/komsuconnect_backend/service/AuthService.java backend/src/test/java/com/hikmetsuicmez/komsuconnect_backend/service/AuthServiceTest.java
git commit -m "feat: add MeResponse DTO and AuthService.me() method"
```

---

### Task 3: AuthController — Cookie Set + /me + /logout

**Files:**
- Modify: `backend/src/main/java/com/hikmetsuicmez/komsuconnect_backend/controller/AuthController.java`

- [ ] **Step 1: AuthController'ı tamamen değiştir**

```java
package com.hikmetsuicmez.komsuconnect_backend.controller;

import com.hikmetsuicmez.komsuconnect_backend.dto.request.LoginRequest;
import com.hikmetsuicmez.komsuconnect_backend.dto.request.RegisterRequest;
import com.hikmetsuicmez.komsuconnect_backend.dto.response.AuthResponse;
import com.hikmetsuicmez.komsuconnect_backend.dto.response.MeResponse;
import com.hikmetsuicmez.komsuconnect_backend.service.AuthService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(
            @Valid @RequestBody RegisterRequest request,
            HttpServletResponse response) {
        AuthResponse authResponse = authService.register(request);
        setJwtCookie(response, authResponse.getToken());
        return ResponseEntity.status(HttpStatus.CREATED).body(authResponse);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletResponse response) {
        AuthResponse authResponse = authService.login(request);
        setJwtCookie(response, authResponse.getToken());
        return ResponseEntity.ok(authResponse);
    }

    @PostMapping("/me")
    public ResponseEntity<MeResponse> me(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(authService.me(userDetails.getUsername()));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletResponse response) {
        clearJwtCookie(response);
        return ResponseEntity.ok().build();
    }

    private void setJwtCookie(HttpServletResponse response, String token) {
        response.addHeader("Set-Cookie",
                "jwt-token=" + token + "; Path=/api; HttpOnly; Secure; SameSite=Lax; Max-Age=86400");
    }

    private void clearJwtCookie(HttpServletResponse response) {
        response.addHeader("Set-Cookie",
                "jwt-token=; Path=/api; HttpOnly; Secure; SameSite=Lax; Max-Age=0");
    }
}
```

- [ ] **Step 2: Derleme doğrula**

```
.\mvnw.cmd compile
```

Beklenen: BUILD SUCCESS

- [ ] **Step 3: Tüm testleri çalıştır**

```
.\mvnw.cmd test
```

Beklenen: tüm mevcut testler PASS

- [ ] **Step 4: Commit**

```
git add backend/src/main/java/com/hikmetsuicmez/komsuconnect_backend/controller/AuthController.java
git commit -m "feat: set httpOnly cookie on login/register, add /me and /logout endpoints"
```

---

### Task 4: SecurityConfig + HealthController

**Files:**
- Create: `backend/src/main/java/com/hikmetsuicmez/komsuconnect_backend/controller/HealthController.java`
- Modify: `backend/src/main/java/com/hikmetsuicmez/komsuconnect_backend/config/SecurityConfig.java`

- [ ] **Step 1: HealthController oluştur**

```java
package com.hikmetsuicmez.komsuconnect_backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/health")
public class HealthController {

    @GetMapping
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("status", "UP"));
    }
}
```

- [ ] **Step 2: SecurityConfig'e /me authenticated ve /health permitAll kurallarını ekle**

`SecurityConfig.java` içinde, `.authorizeHttpRequests` bloğunun **başına** (mevcut `.requestMatchers("/api/v1/auth/**").permitAll()` satırından **önce**) şunu ekle:

```java
.requestMatchers(HttpMethod.POST, "/api/v1/auth/me").authenticated()
.requestMatchers(HttpMethod.GET, "/api/v1/health").permitAll()
```

Sonuç şu sırayla görünmeli:

```java
.authorizeHttpRequests(auth -> auth
    .requestMatchers(HttpMethod.POST, "/api/v1/auth/me").authenticated()
    .requestMatchers(HttpMethod.GET, "/api/v1/health").permitAll()
    .requestMatchers("/api/v1/auth/**").permitAll()
    .requestMatchers(HttpMethod.GET, "/api/v1/businesses/me").authenticated()
    // ... geri kalanlar
)
```

- [ ] **Step 3: Tüm testleri çalıştır**

```
.\mvnw.cmd test
```

Beklenen: BUILD SUCCESS, tüm testler PASS

- [ ] **Step 4: Commit**

```
git add backend/src/main/java/com/hikmetsuicmez/komsuconnect_backend/controller/HealthController.java backend/src/main/java/com/hikmetsuicmez/komsuconnect_backend/config/SecurityConfig.java
git commit -m "feat: add health endpoint and secure /auth/me route"
```

---

### Task 5: imageUrl @Pattern Validasyonu (TDD)

**Files:**
- Create: `backend/src/test/java/com/hikmetsuicmez/komsuconnect_backend/dto/request/CreateProductRequestValidationTest.java`
- Modify: `backend/src/main/java/com/hikmetsuicmez/komsuconnect_backend/dto/request/CreateProductRequest.java`
- Modify: `backend/src/main/java/com/hikmetsuicmez/komsuconnect_backend/dto/request/UpdateProductRequest.java`

- [ ] **Step 1: Validasyon testi oluştur**

```java
package com.hikmetsuicmez.komsuconnect_backend.dto.request;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class CreateProductRequestValidationTest {

    private Validator validator;

    @BeforeEach
    void setUp() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @Test
    void imageUrl_withInvalidFormat_failsValidation() {
        CreateProductRequest request = new CreateProductRequest();
        request.setName("Test Ürün");
        request.setPrice(BigDecimal.valueOf(10.0));
        request.setImageUrl("not-a-valid-url");

        Set<ConstraintViolation<CreateProductRequest>> violations = validator.validate(request);

        assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().equals("imageUrl"));
    }

    @Test
    void imageUrl_withValidHttpsUrl_passesValidation() {
        CreateProductRequest request = new CreateProductRequest();
        request.setName("Test Ürün");
        request.setPrice(BigDecimal.valueOf(10.0));
        request.setImageUrl("https://example.com/image.png");

        Set<ConstraintViolation<CreateProductRequest>> violations = validator.validate(request);

        assertThat(violations).noneMatch(v -> v.getPropertyPath().toString().equals("imageUrl"));
    }

    @Test
    void imageUrl_withNull_passesValidation() {
        CreateProductRequest request = new CreateProductRequest();
        request.setName("Test Ürün");
        request.setPrice(BigDecimal.valueOf(10.0));
        request.setImageUrl(null);

        Set<ConstraintViolation<CreateProductRequest>> violations = validator.validate(request);

        assertThat(violations).noneMatch(v -> v.getPropertyPath().toString().equals("imageUrl"));
    }
}
```

- [ ] **Step 2: Testi çalıştır — FAIL bekleniyor**

```
.\mvnw.cmd test -Dtest=CreateProductRequestValidationTest
```

Beklenen: `imageUrl_withInvalidFormat_failsValidation` → FAIL (validasyon yokken violation set boş gelir)

- [ ] **Step 3: CreateProductRequest'e @Pattern ekle**

`import` bloğuna ekle:
```java
import jakarta.validation.constraints.Pattern;
```

`imageUrl` alanını şöyle değiştir:
```java
@Pattern(
    regexp = "^(https?://.*)?$",
    message = "imageUrl geçerli bir HTTP veya HTTPS URL'i olmalı"
)
private String imageUrl;
```

- [ ] **Step 4: UpdateProductRequest'e de @Pattern ekle**

Aynı import ve aynı `@Pattern` anotasyonunu `UpdateProductRequest.java` içindeki `imageUrl` alanına ekle.

- [ ] **Step 5: Testleri çalıştır — PASS bekleniyor**

```
.\mvnw.cmd test -Dtest=CreateProductRequestValidationTest
```

Beklenen: 3 test PASS

- [ ] **Step 6: Tüm testlerin geçtiğini doğrula**

```
.\mvnw.cmd test
```

- [ ] **Step 7: Commit**

```
git add backend/src/main/java/com/hikmetsuicmez/komsuconnect_backend/dto/request/CreateProductRequest.java backend/src/main/java/com/hikmetsuicmez/komsuconnect_backend/dto/request/UpdateProductRequest.java backend/src/test/java/com/hikmetsuicmez/komsuconnect_backend/dto/request/CreateProductRequestValidationTest.java
git commit -m "feat: add URL pattern validation for imageUrl in product DTOs"
```

---

### Task 6: Dockerfile (Multi-Stage)

**Files:**
- Create: `backend/Dockerfile`

- [ ] **Step 1: Dockerfile oluştur**

```dockerfile
FROM maven:3.9-eclipse-temurin-21 AS builder
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn package -DskipTests -B

FROM eclipse-temurin:21-jre-alpine AS runtime
WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

- [ ] **Step 2: Commit**

```
git add backend/Dockerfile
git commit -m "feat: add multi-stage Dockerfile for Render deploy"
```

---

### Task 7: render.yaml + application-prod.yml + .env.example

**Files:**
- Create: `backend/render.yaml`
- Create: `backend/src/main/resources/application-prod.yml`
- Modify: `backend/.env.example`

- [ ] **Step 1: render.yaml oluştur**

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
      - key: SPRING_PROFILES_ACTIVE
        value: prod
```

- [ ] **Step 2: application-prod.yml oluştur**

```yaml
server:
  port: ${PORT:8080}

spring:
  jpa:
    show-sql: false
  flyway:
    enabled: true

logging:
  level:
    root: INFO
    org.hibernate: WARN
    com.hikmetsuicmez: INFO
```

- [ ] **Step 3: .env.example güncelle**

Dosyayı şu hale getir:

```
DB_URL=jdbc:postgresql://db.xxxx.supabase.co:5432/postgres
DB_USERNAME=postgres
DB_PASSWORD=db_password
JWT_SECRET=your-secret-key-must-be-at-least-32-characters-long
CORS_ALLOWED_ORIGINS=https://komsuconnect.vercel.app
PORT=8080
SPRING_PROFILES_ACTIVE=prod
```

- [ ] **Step 4: Commit**

```
git add backend/render.yaml backend/src/main/resources/application-prod.yml backend/.env.example
git commit -m "feat: add Render deploy config and production Spring profile"
```

---

### Task 8: Playwright Kurulumu

**Files:**
- Modify: `frontend/package.json`
- Create: `frontend/playwright.config.ts`

- [ ] **Step 1: Playwright'i frontend'e kur**

```
cd ..\frontend && npm install --save-dev @playwright/test
```

- [ ] **Step 2: Browser binary'lerini indir**

```
npx playwright install chromium
```

- [ ] **Step 3: playwright.config.ts oluştur**

`frontend/playwright.config.ts`:

```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
```

- [ ] **Step 4: package.json scripts bloğuna test:e2e ekle**

`"scripts"` bloğuna şunu ekle:

```json
"test:e2e": "playwright test"
```

- [ ] **Step 5: Commit**

```
git add frontend/package.json frontend/playwright.config.ts
git commit -m "feat: add Playwright E2E test setup"
```

---

### Task 9: E2E — Kayıt Akışı

**Files:**
- Create: `frontend/e2e/auth/register.spec.ts`

> **Ön koşul:** Backend `http://localhost:8080`'de ve frontend dev server `http://localhost:3000`'de çalışıyor olmalı.

- [ ] **Step 1: Test dosyasını oluştur**

```typescript
import { test, expect } from '@playwright/test'

const BACKEND = 'http://localhost:8080'

test.describe('Kayıt akışı', () => {
  test('geçerli bilgilerle BUSINESS kaydı → dashboard yönlenme', async ({ page, request }) => {
    const email = `reg-biz-${Date.now()}@example.com`

    await page.goto('/register')
    await page.getByRole('button', { name: 'Esnaf' }).click()
    await page.fill('#firstName', 'Ahmet')
    await page.fill('#lastName', 'Yılmaz')
    await page.fill('#email', email)
    await page.fill('#password', 'password123')
    await page.getByRole('button', { name: 'Kayıt Ol' }).click()

    await expect(page).toHaveURL('/dashboard', { timeout: 5000 })
  })

  test('zaten kayıtlı email → hata mesajı', async ({ page, request }) => {
    const email = `dup-${Date.now()}@example.com`
    await request.post(`${BACKEND}/api/v1/auth/register`, {
      data: { fullName: 'Mevcut Kullanıcı', email, password: 'password123', role: 'USER' },
    })

    await page.goto('/register')
    await page.fill('#firstName', 'Test')
    await page.fill('#lastName', 'User')
    await page.fill('#email', email)
    await page.fill('#password', 'password123')
    await page.getByRole('button', { name: 'Kayıt Ol' }).click()

    await expect(page.getByText('Bu e-posta adresi zaten kayıtlı.')).toBeVisible()
  })

  test('kısa şifre → form validasyon mesajı (submit olmaz)', async ({ page }) => {
    await page.goto('/register')
    await page.fill('#firstName', 'Test')
    await page.fill('#lastName', 'User')
    await page.fill('#email', 'valid@example.com')
    await page.fill('#password', 'abc')
    await page.getByRole('button', { name: 'Kayıt Ol' }).click()

    await expect(page.getByText('Şifre en az 6 karakter olmalıdır')).toBeVisible()
    await expect(page).toHaveURL('/register')
  })
})
```

- [ ] **Step 2: Testleri çalıştır**

```
npx playwright test e2e/auth/register.spec.ts --headed
```

Beklenen: 3 test PASS

- [ ] **Step 3: Commit**

```
git add frontend/e2e/auth/register.spec.ts
git commit -m "test: add Playwright E2E tests for register flow"
```

---

### Task 10: E2E — Giriş Akışı

**Files:**
- Create: `frontend/e2e/auth/login.spec.ts`

- [ ] **Step 1: Test dosyasını oluştur**

```typescript
import { test, expect } from '@playwright/test'

const BACKEND = 'http://localhost:8080'

test.describe('Giriş akışı', () => {
  let testEmail: string

  test.beforeAll(async ({ request }) => {
    testEmail = `login-${Date.now()}@example.com`
    await request.post(`${BACKEND}/api/v1/auth/register`, {
      data: {
        fullName: 'Login Test Kullanıcı',
        email: testEmail,
        password: 'password123',
        role: 'BUSINESS',
      },
    })
  })

  test('geçerli credentials → dashboard yönlenme', async ({ page }) => {
    await page.goto('/login')
    await page.fill('#email', testEmail)
    await page.fill('#password', 'password123')
    await page.getByRole('button', { name: 'Giriş Yap' }).click()

    await expect(page).toHaveURL('/dashboard', { timeout: 5000 })
  })

  test('yanlış şifre → hata mesajı', async ({ page }) => {
    await page.goto('/login')
    await page.fill('#email', testEmail)
    await page.fill('#password', 'yanlis-sifre')
    await page.getByRole('button', { name: 'Giriş Yap' }).click()

    await expect(page.getByText('E-posta veya şifre hatalı.')).toBeVisible()
  })

  test('kayıtsız email → hata mesajı', async ({ page }) => {
    await page.goto('/login')
    await page.fill('#email', 'olmayan@example.com')
    await page.fill('#password', 'password123')
    await page.getByRole('button', { name: 'Giriş Yap' }).click()

    await expect(page.getByText('E-posta veya şifre hatalı.')).toBeVisible()
  })

  test('sayfa yenilemede oturum korunur', async ({ page }) => {
    await page.goto('/login')
    await page.fill('#email', testEmail)
    await page.fill('#password', 'password123')
    await page.getByRole('button', { name: 'Giriş Yap' }).click()
    await expect(page).toHaveURL('/dashboard', { timeout: 5000 })

    await page.reload()
    await expect(page).toHaveURL('/dashboard')
  })
})
```

- [ ] **Step 2: Testleri çalıştır**

```
npx playwright test e2e/auth/login.spec.ts --headed
```

Beklenen: 4 test PASS

- [ ] **Step 3: Commit**

```
git add frontend/e2e/auth/login.spec.ts
git commit -m "test: add Playwright E2E tests for login flow"
```

---

### Task 11: E2E — Esnaf Profil Akışı

**Files:**
- Create: `frontend/e2e/business/profile.spec.ts`

- [ ] **Step 1: Test dosyasını oluştur**

```typescript
import { test, expect } from '@playwright/test'

const BACKEND = 'http://localhost:8080'

test.describe('Esnaf profil yönetimi', () => {
  let businessEmail: string
  let userEmail: string

  test.beforeAll(async ({ request }) => {
    businessEmail = `profile-biz-${Date.now()}@example.com`
    userEmail = `profile-user-${Date.now()}@example.com`

    await request.post(`${BACKEND}/api/v1/auth/register`, {
      data: { fullName: 'Profil Testi Esnaf', email: businessEmail, password: 'password123', role: 'BUSINESS' },
    })
    await request.post(`${BACKEND}/api/v1/auth/register`, {
      data: { fullName: 'Normal Kullanici', email: userEmail, password: 'password123', role: 'USER' },
    })
  })

  test('BUSINESS rolü → profil oluştur → başarı mesajı', async ({ page }) => {
    await page.goto('/login')
    await page.fill('#email', businessEmail)
    await page.fill('#password', 'password123')
    await page.getByRole('button', { name: 'Giriş Yap' }).click()
    await expect(page).toHaveURL('/dashboard', { timeout: 5000 })

    await page.goto('/dashboard/profile')
    await page.fill('#businessName', 'Test Fırını')
    await page.fill('#city', 'İstanbul')
    await page.getByRole('button', { name: /Profil Oluştur|Güncelle/ }).click()

    await expect(page.getByText('Profil başarıyla kaydedildi.')).toBeVisible()
  })

  test('zorunlu alan boş → validasyon mesajı gösterilir', async ({ page }) => {
    await page.goto('/login')
    await page.fill('#email', businessEmail)
    await page.fill('#password', 'password123')
    await page.getByRole('button', { name: 'Giriş Yap' }).click()
    await expect(page).toHaveURL('/dashboard', { timeout: 5000 })

    await page.goto('/dashboard/profile')
    await page.fill('#businessName', '')
    await page.getByRole('button', { name: /Profil Oluştur|Güncelle/ }).click()

    await expect(page.getByText('İşletme adı zorunludur')).toBeVisible()
  })

  test('USER rolü /dashboard → ana sayfaya yönlenme', async ({ page }) => {
    await page.goto('/login')
    await page.fill('#email', userEmail)
    await page.fill('#password', 'password123')
    await page.getByRole('button', { name: 'Giriş Yap' }).click()
    await expect(page).toHaveURL('/', { timeout: 5000 })

    await page.goto('/dashboard')
    await expect(page).toHaveURL('/')
  })
})
```

- [ ] **Step 2: Testleri çalıştır**

```
npx playwright test e2e/business/profile.spec.ts --headed
```

Beklenen: 3 test PASS

- [ ] **Step 3: Commit**

```
git add frontend/e2e/business/profile.spec.ts
git commit -m "test: add Playwright E2E tests for business profile flow"
```

---

### Task 12: E2E — Ürün Yönetimi Akışı

**Files:**
- Create: `frontend/e2e/business/product.spec.ts`

> **Not:** `imageUrl ile ürün ekleme` testi `test.fixme` olarak işaretlendi. ProductModal'a imageUrl alanı eklendiğinde (Sprint 4 frontend teknik borcu) `fixme` kaldırılabilir.

- [ ] **Step 1: Test dosyasını oluştur**

```typescript
import { test, expect } from '@playwright/test'

const BACKEND = 'http://localhost:8080'

test.describe('Ürün yönetimi', () => {
  let businessEmail: string
  let authToken: string

  test.beforeAll(async ({ request }) => {
    businessEmail = `product-biz-${Date.now()}@example.com`

    const registerRes = await request.post(`${BACKEND}/api/v1/auth/register`, {
      data: { fullName: 'Ürün Testi Esnaf', email: businessEmail, password: 'password123', role: 'BUSINESS' },
    })
    const data = await registerRes.json()
    authToken = data.token

    await request.post(`${BACKEND}/api/v1/businesses`, {
      data: { businessName: 'E2E Test Dükkanı', city: 'Ankara' },
      headers: { Authorization: `Bearer ${authToken}` },
    })
  })

  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('#email', businessEmail)
    await page.fill('#password', 'password123')
    await page.getByRole('button', { name: 'Giriş Yap' }).click()
    await expect(page).toHaveURL('/dashboard', { timeout: 5000 })
  })

  test('ürün ekleme → listede görünür', async ({ page }) => {
    await page.goto('/dashboard/products')

    const addButton = page.getByRole('button', { name: 'Yeni Ürün Ekle' })
      .or(page.getByRole('button', { name: 'İlk ürününü ekle' }))
    await addButton.first().click()

    await page.fill('#prod-name', 'Tam Buğday Ekmeği')
    await page.fill('#prod-price', '5.50')
    await page.getByRole('button', { name: 'Ekle' }).click()

    await expect(page.getByText('Tam Buğday Ekmeği')).toBeVisible({ timeout: 5000 })
  })

  test('ürün düzenleme → güncellendi', async ({ page }) => {
    await page.goto('/dashboard/products')

    const addButton = page.getByRole('button', { name: 'Yeni Ürün Ekle' })
      .or(page.getByRole('button', { name: 'İlk ürününü ekle' }))
    await addButton.first().click()
    await page.fill('#prod-name', 'Düzenleme Testi')
    await page.fill('#prod-price', '3.00')
    await page.getByRole('button', { name: 'Ekle' }).click()
    await expect(page.getByText('Düzenleme Testi')).toBeVisible({ timeout: 5000 })

    await page.getByRole('button', { name: 'Düzenle' }).first().click()
    await page.fill('#prod-name', 'Düzenlenmiş Ürün')
    await page.getByRole('button', { name: 'Güncelle' }).click()

    await expect(page.getByText('Düzenlenmiş Ürün')).toBeVisible({ timeout: 5000 })
  })

  test('fiyat 0 → validasyon hatası', async ({ page }) => {
    await page.goto('/dashboard/products')

    const addButton = page.getByRole('button', { name: 'Yeni Ürün Ekle' })
      .or(page.getByRole('button', { name: 'İlk ürününü ekle' }))
    await addButton.first().click()

    await page.fill('#prod-name', 'Geçersiz Fiyat')
    await page.fill('#prod-price', '0')
    await page.getByRole('button', { name: 'Ekle' }).click()

    await expect(page.getByText("Fiyat 0'dan büyük olmalıdır")).toBeVisible()
  })

  test.fixme('imageUrl ile ürün ekleme → görsel listede render edilir', async ({ page }) => {
    // ProductModal'a imageUrl alanı eklendikten sonra bu testi aktifleştir.
    await page.goto('/dashboard/products')

    const addButton = page.getByRole('button', { name: 'Yeni Ürün Ekle' })
      .or(page.getByRole('button', { name: 'İlk ürününü ekle' }))
    await addButton.first().click()

    await page.fill('#prod-name', 'Görselli Ürün')
    await page.fill('#prod-price', '10.00')
    await page.fill('#prod-image-url', 'https://placehold.co/200x200.png')
    await page.getByRole('button', { name: 'Ekle' }).click()

    await expect(page.locator('img[src="https://placehold.co/200x200.png"]')).toBeVisible({ timeout: 5000 })
  })
})
```

- [ ] **Step 2: Testleri çalıştır**

```
npx playwright test e2e/business/product.spec.ts --headed
```

Beklenen: 3 test PASS, 1 test SKIPPED (fixme)

- [ ] **Step 3: Commit**

```
git add frontend/e2e/business/product.spec.ts
git commit -m "test: add Playwright E2E tests for product management flow"
```

---

## Self-Review Notları

**Spec coverage:**
- ✅ JwtAuthenticationFilter cookie fallback → Task 1
- ✅ POST /api/v1/auth/me endpoint → Task 3 (controller) + Task 2 (service)
- ✅ POST /api/v1/auth/logout endpoint → Task 3
- ✅ Cookie set on login/register → Task 3
- ✅ /me route authenticated → Task 4 (SecurityConfig)
- ✅ imageUrl URL validation → Task 5
- ✅ Dockerfile multi-stage → Task 6
- ✅ render.yaml → Task 7
- ✅ application-prod.yml → Task 7
- ✅ .env.example güncelleme → Task 7
- ✅ GET /api/v1/health endpoint → Task 4 (HealthController)
- ✅ Playwright setup → Task 8
- ✅ E2E register → Task 9
- ✅ E2E login → Task 10
- ✅ E2E profile → Task 11
- ✅ E2E product → Task 12

**Type consistency:** `MeResponse` Task 2'de tanımlanır, Task 3'te kullanılır. `me(String email)` Task 2'de eklenir, Task 3 controller buna `userDetails.getUsername()` ile çağırır. Tutarlı.

**Bağımlılık sırası:** Task 3 (AuthController), Task 2'yi (MeResponse, AuthService.me) gerektirir. Task 4 bağımsız. Task 8-12 arasında 8 önce gelmeli (Playwright kurulumu). 9-12 bağımsız, paralel çalıştırılabilir.
