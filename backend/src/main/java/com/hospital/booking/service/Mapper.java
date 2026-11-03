package com.hospital.booking.service;

import static com.hospital.booking.dto.Dtos.*;

import com.hospital.booking.model.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

/** Entity to DTO conversion. Call only inside a transaction (lazy associations). */
final class Mapper {
    private static final DateTimeFormatter SLOT_TEXT =
        DateTimeFormatter.ofPattern("EEE, d MMM yyyy 'at' h:mm a", Locale.ENGLISH);

    private Mapper() {}

    static PatientDto patient(Patient p) {
        return new PatientDto(p.getId(), p.getFullName(), p.getEmail(), p.getPhone(), p.getDateOfBirth(),
            p.getGender(), p.getAddress(), p.getBloodGroup());
    }

    static DoctorDto doctor(Doctor d) {
        return new DoctorDto(d.getId(), d.getFullName(), d.getSpecialization(), d.getQualification(),
            d.getExperienceYears(), d.getConsultationFee(), d.getAbout());
    }

    static AppointmentDto appointment(Appointment a) {
        TimeSlot s = a.getSlot();
        boolean upcoming = a.isActive() && s.startsAt().isAfter(LocalDateTime.now());
        return new AppointmentDto(a.getId(), a.getReferenceCode(), doctor(a.getDoctor()), s.getId(),
            s.getSlotDate(), s.getStartTime(), s.getEndTime(), a.getReason(), a.getStatus().name(),
            a.getRejectionReason(), a.getCancellationReason(), upcoming, upcoming, a.getCreatedAt());
    }

    static String slotText(TimeSlot s) {
        return s == null ? null : s.startsAt().format(SLOT_TEXT);
    }

    static HistoryEventDto history(AppointmentHistory h) {
        Appointment a = h.getAppointment();
        return new HistoryEventDto(h.getId(), a.getId(), a.getReferenceCode(), a.getDoctor().getFullName(),
            h.getAction().name(), slotText(h.getFromSlot()), slotText(h.getToSlot()), h.getNote(),
            h.getCreatedAt());
    }
}
