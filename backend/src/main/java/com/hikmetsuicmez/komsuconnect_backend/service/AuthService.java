package com.hikmetsuicmez.komsuconnect_backend.service;

import com.hikmetsuicmez.komsuconnect_backend.dto.request.LoginRequest;
import com.hikmetsuicmez.komsuconnect_backend.dto.request.RegisterRequest;
import com.hikmetsuicmez.komsuconnect_backend.dto.response.AuthResponse;
import com.hikmetsuicmez.komsuconnect_backend.dto.response.MeResponse;
import com.hikmetsuicmez.komsuconnect_backend.entity.Role;
import com.hikmetsuicmez.komsuconnect_backend.entity.User;
import com.hikmetsuicmez.komsuconnect_backend.exception.EmailAlreadyExistsException;
import com.hikmetsuicmez.komsuconnect_backend.exception.UserNotFoundException;
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

    public MeResponse me(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("User not found: " + email));
        return MeResponse.builder()
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole().name())
                .build();
    }
}
