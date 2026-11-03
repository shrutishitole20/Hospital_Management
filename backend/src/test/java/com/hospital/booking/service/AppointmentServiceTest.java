package com.hospital.booking.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.hospital.booking.dto.Dtos.*;
import com.hospital.booking.exception.ApiException;
import com.hospital.booking.model.*;
import com.hospital.booking.repository.AppointmentHistoryRepository;
import com.hospital.booking.repository.AppointmentRepository;
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
class AppointmentServiceTest {

    @Mock
    private AppointmentRepository appointmentRepository;

    @Mock
    private AppointmentHistoryRepository historyRepository;

    @Mock
    private TimeSlotRepository timeSlotRepository;

    @Mock
    private PatientService patientService;

    @InjectMocks
    private AppointmentService appointmentService;

    private Patient testPatient;
    private Doctor testDoctor;
    private TimeSlot futureAvailableSlot;

    @BeforeEach
    void setUp() {
        testPatient = new Patient();
        testPatient.setId(1L);
        testPatient.setEmail("patient@example.com");
        testPatient.setFullName("Test Patient");

        testDoctor = new Doctor();
        testDoctor.setId(10L);
        testDoctor.setFullName("Dr. Test");
        testDoctor.setSpecialization("Cardiology");
        testDoctor.setConsultationFee(new BigDecimal("500.00"));

        futureAvailableSlot = new TimeSlot();
        futureAvailableSlot.setId(100L);
        futureAvailableSlot.setDoctor(testDoctor);
        futureAvailableSlot.setSlotDate(LocalDate.now().plusDays(2));
        futureAvailableSlot.setStartTime(LocalTime.of(10, 0));
        futureAvailableSlot.setEndTime(LocalTime.of(10, 30));
        futureAvailableSlot.setStatus(SlotStatus.AVAILABLE);
    }

    @Test
    @DisplayName("Booking succeeds for future available slot and sets status to BOOKED")
    void testBookSuccess() {
        when(patientService.requirePatient("patient@example.com")).thenReturn(testPatient);
        when(timeSlotRepository.findByIdForUpdate(100L)).thenReturn(Optional.of(futureAvailableSlot));
        when(appointmentRepository.countAtTime(eq(1L), any(LocalDate.class), any(LocalTime.class), any()))
            .thenReturn(0L);
        when(appointmentRepository.existsByReferenceCode(anyString())).thenReturn(false);

        ConfirmationDto confirmation = appointmentService.book(
            "patient@example.com",
            new BookRequest(100L, "Routine checkup")
        );

        assertThat(confirmation).isNotNull();
        assertThat(confirmation.message()).contains("is booked");
        assertThat(futureAvailableSlot.getStatus()).isEqualTo(SlotStatus.BOOKED);
        verify(appointmentRepository).save(any(Appointment.class));
        verify(historyRepository).save(any(AppointmentHistory.class));
    }

    @Test
    @DisplayName("Business Rule: Do not allow appointments in the past")
    void testBookSlotInPastThrowsBadRequest() {
        TimeSlot pastSlot = new TimeSlot();
        pastSlot.setId(101L);
        pastSlot.setDoctor(testDoctor);
        pastSlot.setSlotDate(LocalDate.now().minusDays(1));
        pastSlot.setStartTime(LocalTime.of(10, 0));
        pastSlot.setEndTime(LocalTime.of(10, 30));
        pastSlot.setStatus(SlotStatus.AVAILABLE);

        when(patientService.requirePatient("patient@example.com")).thenReturn(testPatient);
        when(timeSlotRepository.findByIdForUpdate(101L)).thenReturn(Optional.of(pastSlot));

        assertThatThrownBy(() -> appointmentService.book("patient@example.com", new BookRequest(101L, null)))
            .isInstanceOf(ApiException.class)
            .hasMessageContaining("You cannot book a time in the past");
    }

    @Test
    @DisplayName("Business Rule: Do not allow a patient to book an already occupied doctor/time slot")
    void testBookOccupiedSlotThrowsConflict() {
        futureAvailableSlot.setStatus(SlotStatus.BOOKED);

        when(patientService.requirePatient("patient@example.com")).thenReturn(testPatient);
        when(timeSlotRepository.findByIdForUpdate(100L)).thenReturn(Optional.of(futureAvailableSlot));

        assertThatThrownBy(() -> appointmentService.book("patient@example.com", new BookRequest(100L, null)))
            .isInstanceOf(ApiException.class)
            .hasMessageContaining("Sorry, that slot was just taken");
    }

    @Test
    @DisplayName("Business Rule: Patient cannot hold two active appointments at the same time")
    void testBookConflictingTimeThrowsConflict() {
        when(patientService.requirePatient("patient@example.com")).thenReturn(testPatient);
        when(timeSlotRepository.findByIdForUpdate(100L)).thenReturn(Optional.of(futureAvailableSlot));
        when(appointmentRepository.countAtTime(eq(1L), any(LocalDate.class), any(LocalTime.class), any()))
            .thenReturn(1L);

        assertThatThrownBy(() -> appointmentService.book("patient@example.com", new BookRequest(100L, null)))
            .isInstanceOf(ApiException.class)
            .hasMessageContaining("You already have an appointment at that time");
    }

    @Test
    @DisplayName("Business Rule: Reschedule releases old slot and books new slot with history record")
    void testRescheduleSuccess() {
        TimeSlot oldSlot = new TimeSlot();
        oldSlot.setId(200L);
        oldSlot.setDoctor(testDoctor);
        oldSlot.setSlotDate(LocalDate.now().plusDays(1));
        oldSlot.setStartTime(LocalTime.of(9, 0));
        oldSlot.setEndTime(LocalTime.of(9, 30));
        oldSlot.setStatus(SlotStatus.BOOKED);

        Appointment appt = new Appointment();
        appt.setId(50L);
        appt.setPatient(testPatient);
        appt.setDoctor(testDoctor);
        appt.setSlot(oldSlot);
        appt.setStatus(AppointmentStatus.PENDING);
        appt.setReferenceCode("APT-2026-TEST1");

        when(patientService.requirePatient("patient@example.com")).thenReturn(testPatient);
        when(appointmentRepository.findOwned(50L, 1L)).thenReturn(Optional.of(appt));
        when(timeSlotRepository.findByIdForUpdate(200L)).thenReturn(Optional.of(oldSlot));
        when(timeSlotRepository.findByIdForUpdate(100L)).thenReturn(Optional.of(futureAvailableSlot));
        when(appointmentRepository.countAtTime(eq(1L), any(LocalDate.class), any(LocalTime.class), any()))
            .thenReturn(0L);

        ConfirmationDto result = appointmentService.reschedule(
            "patient@example.com",
            50L,
            new RescheduleRequest(100L, "Schedule conflict")
        );

        assertThat(result).isNotNull();
        assertThat(oldSlot.getStatus()).isEqualTo(SlotStatus.AVAILABLE);
        assertThat(futureAvailableSlot.getStatus()).isEqualTo(SlotStatus.BOOKED);
        assertThat(appt.getSlot()).isEqualTo(futureAvailableSlot);
        assertThat(appt.getStatus()).isEqualTo(AppointmentStatus.PENDING);
        verify(historyRepository).save(any(AppointmentHistory.class));
    }

    @Test
    @DisplayName("Business Rule: Cancel releases slot and records reason in history")
    void testCancelSuccess() {
        Appointment appt = new Appointment();
        appt.setId(50L);
        appt.setPatient(testPatient);
        appt.setDoctor(testDoctor);
        appt.setSlot(futureAvailableSlot);
        appt.setStatus(AppointmentStatus.CONFIRMED);
        appt.setReferenceCode("APT-2026-TEST2");
        futureAvailableSlot.setStatus(SlotStatus.BOOKED);

        when(patientService.requirePatient("patient@example.com")).thenReturn(testPatient);
        when(appointmentRepository.findOwned(50L, 1L)).thenReturn(Optional.of(appt));
        when(timeSlotRepository.findByIdForUpdate(100L)).thenReturn(Optional.of(futureAvailableSlot));

        AppointmentDto cancelled = appointmentService.cancel(
            "patient@example.com",
            50L,
            new CancelRequest("Personal emergency")
        );

        assertThat(cancelled.status()).isEqualTo("CANCELLED");
        assertThat(futureAvailableSlot.getStatus()).isEqualTo(SlotStatus.AVAILABLE);
        assertThat(appt.getCancellationReason()).isEqualTo("Personal emergency");
        verify(historyRepository).save(any(AppointmentHistory.class));
    }

    @Test
    @DisplayName("Listing separates upcoming and past appointments accurately")
    void testListUpcomingAndPast() {
        Appointment upcoming = new Appointment();
        upcoming.setId(1L);
        upcoming.setPatient(testPatient);
        upcoming.setDoctor(testDoctor);
        upcoming.setSlot(futureAvailableSlot);
        upcoming.setStatus(AppointmentStatus.CONFIRMED);
        upcoming.setReferenceCode("APT-UPCOMING");

        TimeSlot pastSlot = new TimeSlot();
        pastSlot.setId(201L);
        pastSlot.setDoctor(testDoctor);
        pastSlot.setSlotDate(LocalDate.now().minusDays(5));
        pastSlot.setStartTime(LocalTime.of(11, 0));
        pastSlot.setEndTime(LocalTime.of(11, 30));
        pastSlot.setStatus(SlotStatus.AVAILABLE);

        Appointment past = new Appointment();
        past.setId(2L);
        past.setPatient(testPatient);
        past.setDoctor(testDoctor);
        past.setSlot(pastSlot);
        past.setStatus(AppointmentStatus.COMPLETED);
        past.setReferenceCode("APT-PAST");

        when(patientService.requirePatient("patient@example.com")).thenReturn(testPatient);
        when(appointmentRepository.findAllByPatient(1L)).thenReturn(List.of(upcoming, past));

        List<AppointmentDto> upcomingList = appointmentService.list("patient@example.com", "upcoming");
        assertThat(upcomingList).hasSize(1);
        assertThat(upcomingList.get(0).referenceCode()).isEqualTo("APT-UPCOMING");

        List<AppointmentDto> pastList = appointmentService.list("patient@example.com", "past");
        assertThat(pastList).hasSize(1);
        assertThat(pastList.get(0).referenceCode()).isEqualTo("APT-PAST");
    }
}

