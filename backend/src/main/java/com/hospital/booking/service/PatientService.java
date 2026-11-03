package com.hospital.booking.service;

import static com.hospital.booking.dto.Dtos.*;

import com.hospital.booking.exception.ApiException;
import com.hospital.booking.model.Patient;
import com.hospital.booking.repository.PatientRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PatientService {
    private final PatientRepository patients;

    public PatientService(PatientRepository patients) { this.patients = patients; }

    public Patient requirePatient(String email) {
        return patients.findByEmail(email).orElseThrow(() -> ApiException.notFound("Patient not found."));
    }

    @Transactional(readOnly = true)
    public PatientDto me(String email) { return Mapper.patient(requirePatient(email)); }

    @Transactional
    public PatientDto update(String email, UpdateProfileRequest req) {
        Patient p = requirePatient(email);
        p.setFullName(req.fullName().trim());
        p.setPhone(req.phone());
        p.setDateOfBirth(req.dateOfBirth());
        p.setGender(req.gender());
        p.setAddress(req.address());
        p.setBloodGroup(req.bloodGroup());
        return Mapper.patient(patients.save(p));
    }
}
