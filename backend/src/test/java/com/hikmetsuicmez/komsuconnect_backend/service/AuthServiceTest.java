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
}
