package com.hospital.booking.service;

import static com.hospital.booking.dto.Dtos.*;

import com.hospital.booking.exception.ApiException;
import com.hospital.booking.model.*;
import com.hospital.booking.repository.AppointmentHistoryRepository;
import com.hospital.booking.repository.AppointmentRepository;
import com.hospital.booking.repository.TimeSlotRepository;
import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AppointmentService {
    private static final Logger log = LoggerFactory.getLogger(AppointmentService.class);
    private static final String CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final EnumSet<AppointmentStatus> ACTIVE =
        EnumSet.of(AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED);

    private final AppointmentRepository appointments;
    private final AppointmentHistoryRepository history;
    private final TimeSlotRepository slots;
    private final PatientService patientService;
    private final SecureRandom random = new SecureRandom();

    public AppointmentService(AppointmentRepository appointments, AppointmentHistoryRepository history,
                              TimeSlotRepository slots, PatientService patientService) {
        this.appointments = appointments;
        this.history = history;
        this.slots = slots;
        this.patientService = patientService;
    }

    // ---------------------------------------------------------------- book
    @Transactional
    public ConfirmationDto book(String email, BookRequest req) {
        Patient patient = patientService.requirePatient(email);
        TimeSlot slot = lockBookableSlot(req.slotId());
        ensurePatientFree(patient.getId(), slot);

        slot.setStatus(SlotStatus.BOOKED); // slot is now unavailable to everyone else

        Appointment a = new Appointment();
        a.setReferenceCode(newReferenceCode());
        a.setPatient(patient);
        a.setDoctor(slot.getDoctor());
        a.setSlot(slot);
        a.setReason(req.reason());
        a.setStatus(AppointmentStatus.PENDING);
        appointments.save(a);

        record(a, HistoryAction.BOOKED, null, slot, "Appointment booked.");

        String msg = "Your appointment with " + slot.getDoctor().getFullName() + " is booked for "
            + Mapper.slotText(slot) + ". Reference: " + a.getReferenceCode()
            + ". It will be confirmed once the doctor approves it.";
        // Stand-in for an email/SMS gateway. Replace with JavaMailSender if required.
        log.info("[CONFIRMATION to {}] {}", patient.getEmail(), msg);
        return new ConfirmationDto(msg, Mapper.appointment(a));
    }

    // ---------------------------------------------------------------- list / view
    @Transactional(readOnly = true)
    public List<AppointmentDto> list(String email, String type) {
        Patient patient = patientService.requirePatient(email);
        List<AppointmentDto> all = appointments.findAllByPatient(patient.getId()).stream()
            .map(Mapper::appointment).toList();
        Comparator<AppointmentDto> byTime = Comparator.comparing(AppointmentDto::date)
            .thenComparing(AppointmentDto::startTime);
        return switch (type == null ? "all" : type.toLowerCase()) {
            case "upcoming" -> all.stream().filter(AppointmentDto::upcoming).sorted(byTime).toList();
            case "past" -> all.stream().filter(x -> !x.upcoming()).sorted(byTime.reversed()).toList();
            default -> all.stream().sorted(byTime.reversed()).toList();
        };
    }

    @Transactional(readOnly = true)
    public AppointmentDto get(String email, Long id) {
        return Mapper.appointment(findOwned(email, id));
    }

    // ---------------------------------------------------------------- reschedule
    @Transactional
    public ConfirmationDto reschedule(String email, Long id, RescheduleRequest req) {
        Appointment a = findOwned(email, id);
        ensureModifiable(a, "rescheduled");
        TimeSlot oldSlot = slots.findByIdForUpdate(a.getSlot().getId()).orElseThrow();
        if (oldSlot.getId().equals(req.newSlotId())) {
            throw ApiException.badRequest("Choose a different time from your current one.");
        }
        TimeSlot newSlot = lockBookableSlot(req.newSlotId());
        if (!newSlot.getDoctor().getId().equals(a.getDoctor().getId())) {
            throw ApiException.badRequest("You can only reschedule to another slot with the same doctor.");
        }
        ensurePatientFree(a.getPatient().getId(), newSlot);

        oldSlot.setStatus(SlotStatus.AVAILABLE); // old slot is released
        newSlot.setStatus(SlotStatus.BOOKED);
        a.setSlot(newSlot);
        a.setStatus(AppointmentStatus.PENDING);  // doctor re-approves the new time
        record(a, HistoryAction.RESCHEDULED, oldSlot, newSlot,
            req.reason() == null || req.reason().isBlank() ? "Rescheduled by patient." : req.reason().trim());

        String msg = "Your appointment " + a.getReferenceCode() + " has moved to " + Mapper.slotText(newSlot)
            + ". It is pending confirmation again.";
        log.info("[RESCHEDULE to {}] {}", a.getPatient().getEmail(), msg);
        return new ConfirmationDto(msg, Mapper.appointment(a));
    }

    // ---------------------------------------------------------------- cancel
    @Transactional
    public AppointmentDto cancel(String email, Long id, CancelRequest req) {
        Appointment a = findOwned(email, id);
        ensureModifiable(a, "cancelled");
        TimeSlot slot = slots.findByIdForUpdate(a.getSlot().getId()).orElseThrow();
        slot.setStatus(SlotStatus.AVAILABLE); // slot goes back on the doctor's schedule

        String reason = req == null || req.reason() == null || req.reason().isBlank()
            ? null : req.reason().trim();
        a.setStatus(AppointmentStatus.CANCELLED);
        a.setCancellationReason(reason);
        record(a, HistoryAction.CANCELLED, slot, null, reason == null ? "Cancelled by patient." : reason);
        return Mapper.appointment(a);
    }

    // ---------------------------------------------------------------- history
    @Transactional(readOnly = true)
    public List<HistoryEventDto> historyFor(String email, Long id) {
        Appointment a = findOwned(email, id);
        return history.findForAppointment(a.getId()).stream().map(Mapper::history).toList();
    }

    @Transactional(readOnly = true)
    public List<HistoryEventDto> allHistory(String email) {
        Patient p = patientService.requirePatient(email);
        return history.findAllForPatient(p.getId()).stream().map(Mapper::history).toList();
    }

    // ---------------------------------------------------------------- helpers
    private Appointment findOwned(String email, Long id) {
        Patient p = patientService.requirePatient(email);
        return appointments.findOwned(id, p.getId())
            .orElseThrow(() -> ApiException.notFound("Appointment not found."));
    }

    private void ensureModifiable(Appointment a, String verb) {
        if (!a.isActive()) {
            throw ApiException.badRequest("This appointment is " + a.getStatus().name().toLowerCase()
                + " and cannot be " + verb + ".");
        }
        if (!a.getSlot().startsAt().isAfter(LocalDateTime.now())) {
            throw ApiException.badRequest("Past appointments cannot be " + verb + ".");
        }
    }

    /** Locks the slot row, then checks it is in the future and still free. */
    private TimeSlot lockBookableSlot(Long slotId) {
        TimeSlot slot = slots.findByIdForUpdate(slotId)
            .orElseThrow(() -> ApiException.notFound("That time slot does not exist."));
        if (!slot.startsAt().isAfter(LocalDateTime.now())) {
            throw ApiException.badRequest("You cannot book a time in the past.");
        }
        if (slot.getStatus() != SlotStatus.AVAILABLE) {
            throw ApiException.conflict("Sorry, that slot was just taken. Please pick another time.");
        }
        return slot;
    }

    private void ensurePatientFree(Long patientId, TimeSlot slot) {
        long clash = appointments.countAtTime(patientId, slot.getSlotDate(), slot.getStartTime(), ACTIVE);
        if (clash > 0) {
            throw ApiException.conflict("You already have an appointment at that time.");
        }
    }

    private void record(Appointment a, HistoryAction action, TimeSlot from, TimeSlot to, String note) {
        AppointmentHistory h = new AppointmentHistory();
        h.setAppointment(a);
        h.setAction(action);
        h.setFromSlot(from);
        h.setToSlot(to);
        h.setNote(note);
        history.save(h);
    }

    private String newReferenceCode() {
        String date = LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE);
        String code;
        do {
            StringBuilder sb = new StringBuilder("APT-").append(date).append('-');
            for (int i = 0; i < 5; i++) sb.append(CODE_CHARS.charAt(random.nextInt(CODE_CHARS.length())));
            code = sb.toString();
        } while (appointments.existsByReferenceCode(code));
        return code;
    }
}
