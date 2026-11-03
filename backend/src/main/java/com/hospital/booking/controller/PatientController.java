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

    @GetMapping
    public PatientDto me(Principal principal) { return patients.me(principal.getName()); }

    @PutMapping
    public PatientDto update(Principal principal, @Valid @RequestBody UpdateProfileRequest req) {
        return patients.update(principal.getName(), req);
    }
}
