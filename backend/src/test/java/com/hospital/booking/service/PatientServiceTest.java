package com.hospital.booking.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.hospital.booking.dto.Dtos.PatientDto;
import com.hospital.booking.dto.Dtos.UpdateProfileRequest;
import com.hospital.booking.exception.ApiException;
import com.hospital.booking.model.Patient;
import com.hospital.booking.repository.PatientRepository;
import java.time.LocalDate;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class PatientServiceTest {

    @Mock
    private PatientRepository patientRepository;

    @InjectMocks
    private PatientService patientService;

    private Patient patient;

    @BeforeEach
    void setUp() {
        patient = new Patient();
        patient.setId(1L);
        patient.setEmail("patient@example.com");
        patient.setFullName("Original Name");
        patient.setPhone("9876543210");
        patient.setBloodGroup("O+");
    }

    @Test
    @DisplayName("Fetch patient profile for logged-in user")
    void testMeSuccess() {
        when(patientRepository.findByEmail("patient@example.com")).thenReturn(Optional.of(patient));

        PatientDto result = patientService.me("patient@example.com");
        assertThat(result.fullName()).isEqualTo("Original Name");
        assertThat(result.email()).isEqualTo("patient@example.com");
    }

    @Test
    @DisplayName("Fetch patient profile for non-existent email throws Not Found")
    void testMeNotFoundThrowsException() {
        when(patientRepository.findByEmail("unknown@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> patientService.me("unknown@example.com"))
            .isInstanceOf(ApiException.class)
            .hasMessageContaining("Patient not found");
    }

    @Test
    @DisplayName("Update patient profile updates all modifiable fields")
    void testUpdateProfileSuccess() {
        when(patientRepository.findByEmail("patient@example.com")).thenReturn(Optional.of(patient));
        when(patientRepository.save(any(Patient.class))).thenAnswer(i -> i.getArgument(0));

        UpdateProfileRequest req = new UpdateProfileRequest(
            "Updated Name",
            "9123456789",
            LocalDate.of(1990, 1, 1),
            "Male",
            "Shivajinagar, Pune",
            "A+"
        );

        PatientDto updated = patientService.update("patient@example.com", req);
        assertThat(updated.fullName()).isEqualTo("Updated Name");
        assertThat(updated.phone()).isEqualTo("9123456789");
        assertThat(updated.bloodGroup()).isEqualTo("A+");
        assertThat(updated.gender()).isEqualTo("Male");
        verify(patientRepository).save(patient);
    }
}

