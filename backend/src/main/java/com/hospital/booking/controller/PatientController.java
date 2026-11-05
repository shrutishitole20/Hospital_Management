package com.hospital.booking.controller;

import static com.hospital.booking.dto.Dtos.*;

import com.hospital.booking.service.PatientService;
import jakarta.validation.Valid;
import java.security.Principal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/patients/me")
public class PatientController {
    private final PatientService patients;

    public PatientController(PatientService patients) { this.patients = patients; }

    private String patientEmail(Principal principal) {
        if (principal == null || principal.getName() == null || principal.getName().isBlank()) {
            throw new com.hospital.booking.exception.ApiException(org.springframework.http.HttpStatus.UNAUTHORIZED, "Please log in to continue.");
        }
        return principal.getName();
    }

    @GetMapping(path = {"", "/"})
    public PatientDto me(Principal principal) { return patients.me(patientEmail(principal)); }

    @PutMapping(path = {"", "/"})
    public PatientDto update(Principal principal, @Valid @RequestBody UpdateProfileRequest req) {
        return patients.update(patientEmail(principal), req);
    }
}
