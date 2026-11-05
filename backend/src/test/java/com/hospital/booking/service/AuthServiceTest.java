package com.hospital.booking.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.hospital.booking.dto.Dtos.*;
import com.hospital.booking.exception.ApiException;
import com.hospital.booking.model.Patient;
import com.hospital.booking.repository.PatientRepository;
import com.hospital.booking.security.JwtService;
import java.time.LocalDate;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private PatientRepository patientRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @InjectMocks
    private AuthService authService;

    private Patient patient;

    @BeforeEach
    void setUp() {
        patient = new Patient();
        patient.setId(1L);
        patient.setEmail("new@patient.com");
        patient.setFullName("New Patient");
        patient.setPasswordHash("hashed_password");
        patient.setPhone("9876543210");
        patient.setDateOfBirth(LocalDate.of(1995, 5, 20));
        patient.setGender("Female");
    }

    @Test
    @DisplayName("Registration succeeds and returns JWT token and patient profile")
    void testRegisterSuccess() {
        when(patientRepository.existsByEmail("new@patient.com")).thenReturn(false);
        when(passwordEncoder.encode("Password@123")).thenReturn("hashed_password");
        when(jwtService.generateToken("new@patient.com")).thenReturn("jwt-token-123");

        RegisterRequest req = new RegisterRequest(
            "New Patient",
            "new@patient.com",
            "Password@123",
            "9876543210",
            LocalDate.of(1995, 5, 20),
            "Female"
        );

        AuthResponse resp = authService.register(req);
        assertThat(resp).isNotNull();
        assertThat(resp.token()).isEqualTo("jwt-token-123");
        assertThat(resp.patient().email()).isEqualTo("new@patient.com");
        verify(patientRepository).save(any(Patient.class));
    }

    @Test
    @DisplayName("Registration with existing email throws Conflict")
    void testRegisterDuplicateEmailThrowsConflict() {
        when(patientRepository.existsByEmail("existing@patient.com")).thenReturn(true);

        RegisterRequest req = new RegisterRequest(
            "New Patient",
            "existing@patient.com",
            "Password@123",
            null, null, null
        );

        assertThatThrownBy(() -> authService.register(req))
            .isInstanceOf(ApiException.class)
            .hasMessageContaining("An account with this email already exists");
    }

    @Test
    @DisplayName("Login with valid credentials returns message and JWT token")
    void testLoginSuccess() {
        when(patientRepository.findByEmail("new@patient.com")).thenReturn(Optional.of(patient));
        when(passwordEncoder.matches("Password@123", "hashed_password")).thenReturn(true);
        when(jwtService.generateToken("new@patient.com")).thenReturn("valid-jwt-token");

        LoginRequest req = new LoginRequest("new@patient.com", "Password@123");
        LoginResponse resp = authService.login(req);

        assertThat(resp.message()).isEqualTo("Login successful");
        assertThat(resp.token()).isEqualTo("valid-jwt-token");
    }

    @Test
    @DisplayName("Login with wrong password throws Unauthorized")
    void testLoginInvalidPasswordThrowsUnauthorized() {
        when(patientRepository.findByEmail("new@patient.com")).thenReturn(Optional.of(patient));
        when(passwordEncoder.matches("WrongPassword", "hashed_password")).thenReturn(false);

        LoginRequest req = new LoginRequest("new@patient.com", "WrongPassword");

        assertThatThrownBy(() -> authService.login(req))
            .isInstanceOf(ApiException.class)
            .hasMessageContaining("Email or password is incorrect");
    }
}

