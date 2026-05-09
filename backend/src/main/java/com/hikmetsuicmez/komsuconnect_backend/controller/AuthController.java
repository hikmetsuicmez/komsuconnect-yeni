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
