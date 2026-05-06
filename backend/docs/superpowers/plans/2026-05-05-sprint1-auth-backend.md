# Sprint 1 — Auth Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sprint 1 backend — User + BusinessProfile entity'leri, JWT auth (register/login endpoint), Flyway migration ve Security config ile tam çalışan bir auth altyapısı kurmak.

**Architecture:** Katmanlı Spring Boot mimarisi: Controller → Service → Repository. JWT token'lar stateless auth için kullanılır; Spring Security filter chain her isteği doğrular. Tüm bağlantı bilgileri env variable üzerinden gelir.

**Tech Stack:** Spring Boot 3.5.14, Java 21, PostgreSQL (Supabase), Spring Security, JJWT 0.12.6, MapStruct 1.5.5.Final, Lombok, Flyway

> **Not:** CLAUDE.md kuralı — unit testler Sprint 3'ten itibaren zorunlu. Bu sprint'te test adımları atlanmıştır.

---

## File Map

| Dosya | İşlem | Sorumluluk |
|---|---|---|
| `pom.xml` | Modify | MapStruct + JJWT bağımlılıkları |
| `entity/Role.java` | Create | USER/BUSINESS enum |
| `entity/User.java` | Create | Users tablosu entity |
| `entity/BusinessProfile.java` | Create | Business_profiles tablosu entity |
| `repository/UserRepository.java` | Create | User JPA repo |
| `repository/BusinessProfileRepository.java` | Create | BusinessProfile JPA repo |
| `config/JpaConfig.java` | Create | @EnableJpaAuditing |
| `security/JwtUtil.java` | Create | Token üret / doğrula |
| `security/JwtAuthenticationFilter.java` | Create | Her isteği JWT ile filtrele |
| `config/SecurityConfig.java` | Create | Public endpoint'ler, filter chain, bean'ler |
| `dto/request/RegisterRequest.java` | Create | Register isteği DTO |
| `dto/request/LoginRequest.java` | Create | Login isteği DTO |
| `dto/response/AuthResponse.java` | Create | Auth yanıtı DTO |
| `exception/EmailAlreadyExistsException.java` | Create | Email çakışma exception |
| `exception/GlobalExceptionHandler.java` | Create | @RestControllerAdvice |
| `service/AuthService.java` | Create | Register + Login iş mantığı |
| `controller/AuthController.java` | Create | POST /register + /login |
| `src/main/resources/application.yaml` | Modify | Tam konfigürasyon |
| `.env.example` | Create | Env değişken şablonu |
| `src/main/resources/db/migration/V1__init.sql` | Create | Flyway DDL |

**Base package:** `com.hikmetsuicmez.komsuconnect_backend`
**Base path (src/main/java altında):** `src/main/java/com/hikmetsuicmez/komsuconnect_backend/`

---

## Task 1: pom.xml — MapStruct + JJWT Bağımlılıkları

**Files:**
- Modify: `pom.xml`

- [ ] **Step 1: `<properties>` bloğuna MapStruct versiyonunu ekle**

`<java.version>21</java.version>` satırının hemen altına:

```xml
<mapstruct.version>1.5.5.Final</mapstruct.version>
```

- [ ] **Step 2: `<dependencies>` içine MapStruct + JJWT bağımlılıklarını ekle**

`</dependencies>` kapanış etiketinin hemen önüne:

```xml
<!-- MapStruct -->
<dependency>
    <groupId>org.mapstruct</groupId>
    <artifactId>mapstruct</artifactId>
    <version>${mapstruct.version}</version>
</dependency>

<!-- JJWT -->
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-api</artifactId>
    <version>0.12.6</version>
</dependency>
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-impl</artifactId>
    <version>0.12.6</version>
    <scope>runtime</scope>
</dependency>
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-jackson</artifactId>
    <version>0.12.6</version>
    <scope>runtime</scope>
</dependency>
```

- [ ] **Step 3: maven-compiler-plugin'e MapStruct annotation processor ekle**

Her iki `<annotationProcessorPaths>` bloğunda, mevcut Lombok `<path>` bloğunun hemen altına (Lombok'tan SONRA gelmelidir):

```xml
<path>
    <groupId>org.mapstruct</groupId>
    <artifactId>mapstruct-processor</artifactId>
    <version>${mapstruct.version}</version>
</path>
```

- [ ] **Step 4: Derlemeyi doğrula**

```powershell
.\mvnw.cmd compile -q
```

Beklenen: `BUILD SUCCESS` (hata yok)

- [ ] **Step 5: Commit**

```bash
git add pom.xml
git commit -m "feat: add MapStruct and JJWT dependencies"
```

---

## Task 2: Entity'ler — Role, User, BusinessProfile

**Files:**
- Create: `src/main/java/com/hikmetsuicmez/komsuconnect_backend/entity/Role.java`
- Create: `src/main/java/com/hikmetsuicmez/komsuconnect_backend/entity/User.java`
- Create: `src/main/java/com/hikmetsuicmez/komsuconnect_backend/entity/BusinessProfile.java`

- [ ] **Step 1: Role enum oluştur**

```java
package com.hikmetsuicmez.komsuconnect_backend.entity;

public enum Role {
    USER,
    BUSINESS
}
```

- [ ] **Step 2: User entity oluştur**

```java
package com.hikmetsuicmez.komsuconnect_backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "users")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String fullName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(nullable = false)
    private LocalDateTime updatedAt;
}
```

- [ ] **Step 3: BusinessProfile entity oluştur**

```java
package com.hikmetsuicmez.komsuconnect_backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "business_profiles")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BusinessProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(nullable = false)
    private String businessName;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String address;

    private String city;

    private String phone;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(nullable = false)
    private LocalDateTime updatedAt;
}
```

- [ ] **Step 4: Derlemeyi doğrula**

```powershell
.\mvnw.cmd compile -q
```

Beklenen: `BUILD SUCCESS`

- [ ] **Step 5: Commit**

```bash
git add src/main/java/com/hikmetsuicmez/komsuconnect_backend/entity/
git commit -m "feat: add User, BusinessProfile entities and Role enum"
```

---

## Task 3: Repository'ler + JPA Auditing Config

**Files:**
- Create: `src/main/java/com/hikmetsuicmez/komsuconnect_backend/repository/UserRepository.java`
- Create: `src/main/java/com/hikmetsuicmez/komsuconnect_backend/repository/BusinessProfileRepository.java`
- Create: `src/main/java/com/hikmetsuicmez/komsuconnect_backend/config/JpaConfig.java`

- [ ] **Step 1: UserRepository oluştur**

```java
package com.hikmetsuicmez.komsuconnect_backend.repository;

import com.hikmetsuicmez.komsuconnect_backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
}
```

- [ ] **Step 2: BusinessProfileRepository oluştur**

```java
package com.hikmetsuicmez.komsuconnect_backend.repository;

import com.hikmetsuicmez.komsuconnect_backend.entity.BusinessProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface BusinessProfileRepository extends JpaRepository<BusinessProfile, UUID> {
    Optional<BusinessProfile> findByUserId(UUID userId);
}
```

- [ ] **Step 3: JpaConfig oluştur — JPA Auditing'i etkinleştir**

```java
package com.hikmetsuicmez.komsuconnect_backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@Configuration
@EnableJpaAuditing
public class JpaConfig {
}
```

- [ ] **Step 4: Derlemeyi doğrula**

```powershell
.\mvnw.cmd compile -q
```

Beklenen: `BUILD SUCCESS`

- [ ] **Step 5: Commit**

```bash
git add src/main/java/com/hikmetsuicmez/komsuconnect_backend/repository/ src/main/java/com/hikmetsuicmez/komsuconnect_backend/config/JpaConfig.java
git commit -m "feat: add UserRepository, BusinessProfileRepository, and JPA auditing config"
```

---

## Task 4: JWT — JwtUtil + JwtAuthenticationFilter

**Files:**
- Create: `src/main/java/com/hikmetsuicmez/komsuconnect_backend/security/JwtUtil.java`
- Create: `src/main/java/com/hikmetsuicmez/komsuconnect_backend/security/JwtAuthenticationFilter.java`

- [ ] **Step 1: JwtUtil oluştur**

```java
package com.hikmetsuicmez.komsuconnect_backend.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
@Slf4j
public class JwtUtil {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.access-token-expiration}")
    private long accessTokenExpiration;

    public String generateToken(String email) {
        return Jwts.builder()
                .subject(email)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + accessTokenExpiration))
                .signWith(getSignKey())
                .compact();
    }

    public String extractEmail(String token) {
        return extractClaims(token).getSubject();
    }

    public boolean isTokenValid(String token) {
        try {
            extractClaims(token);
            return true;
        } catch (Exception e) {
            log.warn("Invalid JWT token: {}", e.getMessage());
            return false;
        }
    }

    private Claims extractClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSignKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private SecretKey getSignKey() {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }
}
```

- [ ] **Step 2: JwtAuthenticationFilter oluştur**

```java
package com.hikmetsuicmez.komsuconnect_backend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String token = extractToken(request);
        if (token != null && jwtUtil.isTokenValid(token)) {
            String email = jwtUtil.extractEmail(token);
            UserDetails userDetails = userDetailsService.loadUserByUsername(email);
            UsernamePasswordAuthenticationToken auth =
                    new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
            auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(auth);
        }
        filterChain.doFilter(request, response);
    }

    private String extractToken(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (StringUtils.hasText(header) && header.startsWith("Bearer ")) {
            return header.substring(7);
        }
        return null;
    }
}
```

- [ ] **Step 3: Derlemeyi doğrula**

```powershell
.\mvnw.cmd compile -q
```

Beklenen: `BUILD SUCCESS`

- [ ] **Step 4: Commit**

```bash
git add src/main/java/com/hikmetsuicmez/komsuconnect_backend/security/
git commit -m "feat: add JwtUtil and JwtAuthenticationFilter"
```

---

## Task 5: SecurityConfig

**Files:**
- Create: `src/main/java/com/hikmetsuicmez/komsuconnect_backend/config/SecurityConfig.java`

- [ ] **Step 1: SecurityConfig oluştur**

```java
package com.hikmetsuicmez.komsuconnect_backend.config;

import com.hikmetsuicmez.komsuconnect_backend.repository.UserRepository;
import com.hikmetsuicmez.komsuconnect_backend.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final UserRepository userRepository;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                .csrf(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/v1/auth/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/businesses", "/api/v1/businesses/{id}").permitAll()
                        .anyRequest().authenticated()
                )
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    @Bean
    public UserDetailsService userDetailsService() {
        return email -> userRepository.findByEmail(email)
                .map(user -> org.springframework.security.core.userdetails.User.builder()
                        .username(user.getEmail())
                        .password(user.getPassword())
                        .roles(user.getRole().name())
                        .build())
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService());
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
```

- [ ] **Step 2: Derlemeyi doğrula**

```powershell
.\mvnw.cmd compile -q
```

Beklenen: `BUILD SUCCESS`

- [ ] **Step 3: Commit**

```bash
git add src/main/java/com/hikmetsuicmez/komsuconnect_backend/config/SecurityConfig.java
git commit -m "feat: add SecurityConfig with JWT filter chain and public endpoints"
```

---

## Task 6: DTO'lar

**Files:**
- Create: `src/main/java/com/hikmetsuicmez/komsuconnect_backend/dto/request/RegisterRequest.java`
- Create: `src/main/java/com/hikmetsuicmez/komsuconnect_backend/dto/request/LoginRequest.java`
- Create: `src/main/java/com/hikmetsuicmez/komsuconnect_backend/dto/response/AuthResponse.java`

- [ ] **Step 1: RegisterRequest oluştur**

```java
package com.hikmetsuicmez.komsuconnect_backend.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {

    @NotBlank
    @Email
    private String email;

    @NotBlank
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;

    @NotBlank
    private String fullName;

    private String role;
}
```

- [ ] **Step 2: LoginRequest oluştur**

```java
package com.hikmetsuicmez.komsuconnect_backend.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequest {

    @NotBlank
    @Email
    private String email;

    @NotBlank
    private String password;
}
```

- [ ] **Step 3: AuthResponse oluştur**

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
public class AuthResponse {
    private String token;
    private String email;
    private String fullName;
    private String role;
}
```

- [ ] **Step 4: Derlemeyi doğrula**

```powershell
.\mvnw.cmd compile -q
```

Beklenen: `BUILD SUCCESS`

- [ ] **Step 5: Commit**

```bash
git add src/main/java/com/hikmetsuicmez/komsuconnect_backend/dto/
git commit -m "feat: add RegisterRequest, LoginRequest, and AuthResponse DTOs"
```

---

## Task 7: Exception'lar — GlobalExceptionHandler

**Files:**
- Create: `src/main/java/com/hikmetsuicmez/komsuconnect_backend/exception/EmailAlreadyExistsException.java`
- Create: `src/main/java/com/hikmetsuicmez/komsuconnect_backend/exception/GlobalExceptionHandler.java`

- [ ] **Step 1: EmailAlreadyExistsException oluştur**

```java
package com.hikmetsuicmez.komsuconnect_backend.exception;

public class EmailAlreadyExistsException extends RuntimeException {
    public EmailAlreadyExistsException(String message) {
        super(message);
    }
}
```

- [ ] **Step 2: GlobalExceptionHandler oluştur**

```java
package com.hikmetsuicmez.komsuconnect_backend.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(EmailAlreadyExistsException.class)
    public ResponseEntity<Map<String, Object>> handleEmailAlreadyExists(EmailAlreadyExistsException ex) {
        return buildResponse(HttpStatus.CONFLICT, ex.getMessage());
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<Map<String, Object>> handleBadCredentials(BadCredentialsException ex) {
        return buildResponse(HttpStatus.UNAUTHORIZED, "Invalid email or password");
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> fieldErrors = new HashMap<>();
        ex.getBindingResult().getFieldErrors()
                .forEach(error -> fieldErrors.put(error.getField(), error.getDefaultMessage()));
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", HttpStatus.BAD_REQUEST.value());
        body.put("errors", fieldErrors);
        return ResponseEntity.badRequest().body(body);
    }

    private ResponseEntity<Map<String, Object>> buildResponse(HttpStatus status, String message) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", status.value());
        body.put("message", message);
        return ResponseEntity.status(status).body(body);
    }
}
```

- [ ] **Step 3: Derlemeyi doğrula**

```powershell
.\mvnw.cmd compile -q
```

Beklenen: `BUILD SUCCESS`

- [ ] **Step 4: Commit**

```bash
git add src/main/java/com/hikmetsuicmez/komsuconnect_backend/exception/
git commit -m "feat: add EmailAlreadyExistsException and GlobalExceptionHandler"
```

---

## Task 8: AuthService

**Files:**
- Create: `src/main/java/com/hikmetsuicmez/komsuconnect_backend/service/AuthService.java`

- [ ] **Step 1: AuthService oluştur**

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
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new EmailAlreadyExistsException("Email already in use: " + request.getEmail());
        }

        Role role = "BUSINESS".equalsIgnoreCase(request.getRole()) ? Role.BUSINESS : Role.USER;

        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .role(role)
                .build();

        userRepository.save(user);
        log.info("New user registered: {}", user.getEmail());

        String token = jwtUtil.generateToken(user.getEmail());

        return AuthResponse.builder()
                .token(token)
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole().name())
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        String token = jwtUtil.generateToken(user.getEmail());

        return AuthResponse.builder()
                .token(token)
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole().name())
                .build();
    }
}
```

- [ ] **Step 2: Derlemeyi doğrula**

```powershell
.\mvnw.cmd compile -q
```

Beklenen: `BUILD SUCCESS`

- [ ] **Step 3: Commit**

```bash
git add src/main/java/com/hikmetsuicmez/komsuconnect_backend/service/AuthService.java
git commit -m "feat: add AuthService with register and login logic"
```

---

## Task 9: AuthController

**Files:**
- Create: `src/main/java/com/hikmetsuicmez/komsuconnect_backend/controller/AuthController.java`

- [ ] **Step 1: AuthController oluştur**

```java
package com.hikmetsuicmez.komsuconnect_backend.controller;

import com.hikmetsuicmez.komsuconnect_backend.dto.request.LoginRequest;
import com.hikmetsuicmez.komsuconnect_backend.dto.request.RegisterRequest;
import com.hikmetsuicmez.komsuconnect_backend.dto.response.AuthResponse;
import com.hikmetsuicmez.komsuconnect_backend.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }
}
```

- [ ] **Step 2: Derlemeyi doğrula**

```powershell
.\mvnw.cmd compile -q
```

Beklenen: `BUILD SUCCESS`

- [ ] **Step 3: Commit**

```bash
git add src/main/java/com/hikmetsuicmez/komsuconnect_backend/controller/AuthController.java
git commit -m "feat: add AuthController with register and login endpoints"
```

---

## Task 10: application.yaml + .env.example

**Files:**
- Modify: `src/main/resources/application.yaml`
- Create: `.env.example`

- [ ] **Step 1: application.yaml'ı tamamen yeniden yaz**

`src/main/resources/application.yaml` içeriğini şununla değiştir:

```yaml
spring:
  application:
    name: komsuconnect-backend
  datasource:
    url: ${DB_URL}
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}
    driver-class-name: org.postgresql.Driver
  jpa:
    hibernate:
      ddl-auto: validate
    show-sql: false
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect
        format_sql: true
  flyway:
    enabled: true
    locations: classpath:db/migration

jwt:
  secret: ${JWT_SECRET}
  access-token-expiration: 86400000

server:
  port: 8080
```

- [ ] **Step 2: .env.example oluştur (backend kökünde)**

```
DB_URL=jdbc:postgresql://db.xxxx.supabase.co:5432/postgres
DB_USERNAME=postgres
DB_PASSWORD=your-supabase-db-password
JWT_SECRET=your-secret-key-must-be-at-least-32-characters-long
```

- [ ] **Step 3: .gitignore'ı kontrol et — .env satırı mevcut mu**

```powershell
Select-String -Path .gitignore -Pattern "\.env"
```

Eğer `.env` satırı yoksa `.gitignore`'a ekle:

```
.env
```

- [ ] **Step 4: Commit**

```bash
git add src/main/resources/application.yaml .env.example .gitignore
git commit -m "feat: configure application.yaml with env placeholders and add .env.example"
```

---

## Task 11: Flyway Migration — V1__init.sql

**Files:**
- Create: `src/main/resources/db/migration/V1__init.sql`

- [ ] **Step 1: Migration dizinini oluştur ve SQL dosyasını yaz**

```sql
CREATE TABLE IF NOT EXISTS users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email       VARCHAR(255)  NOT NULL UNIQUE,
    password    VARCHAR(255)  NOT NULL,
    full_name   VARCHAR(255)  NOT NULL,
    role        VARCHAR(20)   NOT NULL,
    created_at  TIMESTAMP     NOT NULL,
    updated_at  TIMESTAMP     NOT NULL
);

CREATE TABLE IF NOT EXISTS business_profiles (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID          NOT NULL UNIQUE,
    business_name VARCHAR(255)  NOT NULL,
    description   TEXT,
    address       VARCHAR(500),
    city          VARCHAR(100),
    phone         VARCHAR(20),
    created_at    TIMESTAMP     NOT NULL,
    updated_at    TIMESTAMP     NOT NULL,
    CONSTRAINT fk_business_user FOREIGN KEY (user_id) REFERENCES users (id)
);
```

> **Not:** Supabase PostgreSQL'de `gen_random_uuid()` default olarak mevcuttur (`pgcrypto` eklentisine gerek yoktur). Eğer hata alınırsa `CREATE EXTENSION IF NOT EXISTS "pgcrypto";` satırını en başa ekle.

- [ ] **Step 2: Son derlemeyi doğrula**

```powershell
.\mvnw.cmd compile -q
```

Beklenen: `BUILD SUCCESS`

- [ ] **Step 3: Commit**

```bash
git add src/main/resources/db/migration/V1__init.sql
git commit -m "feat: add Flyway V1 init migration for users and business_profiles tables"
```

---

## Tamamlanma Sonrası Kontrol Listesi

- [ ] `.\mvnw.cmd compile -q` → `BUILD SUCCESS`
- [ ] `.env` dosyası `.gitignore`'da
- [ ] `application.yaml`'da hardcoded değer yok
- [ ] `POST /api/v1/auth/register` → 201 + JWT token döner (DB bağlantısı olduğunda)
- [ ] `POST /api/v1/auth/login` → 200 + JWT token döner
- [ ] Duplicate email → 409 Conflict döner
- [ ] Yanlış şifre → 401 Unauthorized döner
- [ ] Eksik/geçersiz alan → 400 Bad Request döner (validation mesajları ile)
