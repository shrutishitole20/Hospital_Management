package com.hospital.booking.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

public final class Dtos {
    private Dtos() {}

    // ---- auth / profile ----
    public record RegisterRequest(
        @NotBlank @Size(max = 100) String fullName,
        @NotBlank @Email String email,
        @NotBlank @Size(min = 6, max = 72, message = "must be 6 to 72 characters") String password,
        @Pattern(regexp = "^[0-9+\\-\\s]{7,15}$", message = "enter a valid phone number") String phone,
        @Past(message = "must be in the past") LocalDate dateOfBirth,
        String gender) {}

    public record LoginRequest(@NotBlank @Email String email, @NotBlank String password) {}

    public record LoginResponse(String message, String token, PatientDto patient) {
        public LoginResponse(String message, String token) {
            this(message, token, null);
        }
    }

    public record AuthResponse(String token, PatientDto patient) {}

    public record PatientDto(Long id, String fullName, String email, String phone, LocalDate dateOfBirth,
                             String gender, String address, String bloodGroup) {}

    public record UpdateProfileRequest(
        @NotBlank @Size(max = 100) String fullName,
        @Pattern(regexp = "^$|^[0-9+\\-\\s]{7,15}$", message = "enter a valid phone number") String phone,
        @Past(message = "must be in the past") LocalDate dateOfBirth,
        String gender,
        @Size(max = 255) String address,
        @Size(max = 5) String bloodGroup) {}

    // ---- doctors & slots ----
    public record DoctorDto(Long id, String fullName, String specialization, String qualification,
                            Integer experienceYears, BigDecimal consultationFee, String about) {}

    public record SlotDto(Long id, LocalDate date, LocalTime startTime, LocalTime endTime, boolean available, String status) {
        public SlotDto(Long id, LocalDate date, LocalTime startTime, LocalTime endTime, boolean available) {
            this(id, date, startTime, endTime, available, available ? "AVAILABLE" : "BOOKED");
        }
    }

    public record DayAvailabilityDto(
        LocalDate date,
        String status,
        int totalSlots,
        int availableSlots,
        int bookedSlots
    ) {}

    public record MonthAvailabilityDto(
        String month,
        Long doctorId,
        List<DayAvailabilityDto> days
    ) {}

    // ---- appointments ----
    public record BookRequest(
        Long slotId,
        Long doctorId,
        LocalDate appointmentDate,
        LocalTime appointmentTime,
        @Size(max = 500) String reason
    ) {
        public BookRequest(Long slotId, String reason) {
            this(slotId, null, null, null, reason);
        }
    }

    public record RescheduleRequest(@NotNull Long newSlotId, @Size(max = 500) String reason) {}

    public record CancelRequest(@Size(max = 500) String reason) {}

    public record AppointmentDto(Long id, String referenceCode, DoctorDto doctor, Long slotId, LocalDate date,
                                 LocalTime startTime, LocalTime endTime, String reason, String status,
                                 String rejectionReason, String cancellationReason, boolean upcoming,
                                 boolean canModify, LocalDateTime createdAt) {}

    public record ConfirmationDto(String message, AppointmentDto appointment) {}

    public record HistoryEventDto(Long id, Long appointmentId, String referenceCode, String doctorName,
                                  String action, String fromSlot, String toSlot, String note,
                                  LocalDateTime createdAt) {}
}
