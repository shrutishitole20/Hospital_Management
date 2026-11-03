package com.hospital.booking.service;

import static com.hospital.booking.dto.Dtos.*;

import com.hospital.booking.exception.ApiException;
import com.hospital.booking.model.Patient;
import com.hospital.booking.repository.PatientRepository;
import com.hospital.booking.security.JwtService;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
    private final PatientRepository patients;
    private final PasswordEncoder encoder;
    private final JwtService jwt;

    public AuthService(PatientRepository patients, PasswordEncoder encoder, JwtService jwt) {
        this.patients = patients;
        this.encoder = encoder;
        this.jwt = jwt;
    }

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        String email = req.email().trim().toLowerCase();
        if (patients.existsByEmail(email)) {
            throw ApiException.conflict("An account with this email already exists. Try logging in.");
        }
        Patient p = new Patient();
        p.setFullName(req.fullName().trim());
        p.setEmail(email);
        p.setPasswordHash(encoder.encode(req.password()));
        p.setPhone(req.phone());
        p.setDateOfBirth(req.dateOfBirth());
        p.setGender(req.gender());
        patients.save(p);
        return new AuthResponse(jwt.generateToken(email), Mapper.patient(p));
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest req) {
        String email = req.email().trim().toLowerCase();
        Patient p = patients.findByEmail(email)
            .filter(x -> encoder.matches(req.password(), x.getPasswordHash()))
            .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Email or password is incorrect."));
        return new AuthResponse(jwt.generateToken(email), Mapper.patient(p));
    }
}
