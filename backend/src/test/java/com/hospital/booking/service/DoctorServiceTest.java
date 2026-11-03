package com.hospital.booking.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import com.hospital.booking.dto.Dtos.DoctorDto;
import com.hospital.booking.dto.Dtos.SlotDto;
import com.hospital.booking.exception.ApiException;
import com.hospital.booking.model.Doctor;
import com.hospital.booking.model.SlotStatus;
import com.hospital.booking.model.TimeSlot;
import com.hospital.booking.repository.DoctorRepository;
import com.hospital.booking.repository.TimeSlotRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class DoctorServiceTest {

    @Mock
    private DoctorRepository doctorRepository;

    @Mock
    private TimeSlotRepository timeSlotRepository;

    @InjectMocks
    private DoctorService doctorService;

    private Doctor doctor;

    @BeforeEach
    void setUp() {
        doctor = new Doctor();
        doctor.setId(1L);
        doctor.setFullName("Dr. Anita Deshmukh");
        doctor.setSpecialization("Cardiology");
        doctor.setQualification("MD, DM");
        doctor.setExperienceYears(16);
        doctor.setConsultationFee(new BigDecimal("800.00"));
        doctor.setAbout("Heart specialist");
    }

    @Test
    @DisplayName("Search doctors returns matching doctors")
    void testSearchDoctors() {
        when(doctorRepository.search("Anita", "Cardiology")).thenReturn(List.of(doctor));

        List<DoctorDto> results = doctorService.search("Anita", "Cardiology");
        assertThat(results).hasSize(1);
        assertThat(results.get(0).fullName()).isEqualTo("Dr. Anita Deshmukh");
    }

    @Test
    @DisplayName("Get doctor details by ID")
    void testGetDoctorSuccess() {
        when(doctorRepository.findById(1L)).thenReturn(Optional.of(doctor));

        DoctorDto result = doctorService.get(1L);
        assertThat(result.id()).isEqualTo(1L);
        assertThat(result.consultationFee()).isEqualByComparingTo("800.00");
    }

    @Test
    @DisplayName("Get doctor by non-existent ID throws Not Found")
    void testGetDoctorNotFound() {
        when(doctorRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> doctorService.get(999L))
            .isInstanceOf(ApiException.class)
            .hasMessageContaining("Doctor not found");
    }

    @Test
    @DisplayName("Cannot view slots for a past date")
    void testSlotsForPastDateThrowsBadRequest() {
        when(doctorRepository.findById(1L)).thenReturn(Optional.of(doctor));

        LocalDate pastDate = LocalDate.now().minusDays(1);
        assertThatThrownBy(() -> doctorService.slotsFor(1L, pastDate))
            .isInstanceOf(ApiException.class)
            .hasMessageContaining("You cannot view slots for a past date");
    }

    @Test
    @DisplayName("Slots for future date filters out past slots and marks availability")
    void testSlotsForFutureDate() {
        when(doctorRepository.findById(1L)).thenReturn(Optional.of(doctor));

        LocalDate tomorrow = LocalDate.now().plusDays(1);
        TimeSlot s1 = new TimeSlot();
        s1.setId(10L);
        s1.setDoctor(doctor);
        s1.setSlotDate(tomorrow);
        s1.setStartTime(LocalTime.of(9, 0));
        s1.setEndTime(LocalTime.of(9, 30));
        s1.setStatus(SlotStatus.AVAILABLE);

        TimeSlot s2 = new TimeSlot();
        s2.setId(11L);
        s2.setDoctor(doctor);
        s2.setSlotDate(tomorrow);
        s2.setStartTime(LocalTime.of(9, 30));
        s2.setEndTime(LocalTime.of(10, 0));
        s2.setStatus(SlotStatus.BOOKED);

        when(timeSlotRepository.findByDoctorAndDate(1L, tomorrow)).thenReturn(List.of(s1, s2));

        List<SlotDto> slots = doctorService.slotsFor(1L, tomorrow);
        assertThat(slots).hasSize(2);
        assertThat(slots.get(0).available()).isTrue();
        assertThat(slots.get(1).available()).isFalse();
    }
}

