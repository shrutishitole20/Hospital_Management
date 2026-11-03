package com.hospital.booking.service;

import static com.hospital.booking.dto.Dtos.*;

import com.hospital.booking.exception.ApiException;
import com.hospital.booking.model.SlotStatus;
import com.hospital.booking.model.TimeSlot;
import com.hospital.booking.repository.DoctorRepository;
import com.hospital.booking.repository.TimeSlotRepository;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class DoctorService {
    private static final int BOOKING_WINDOW_DAYS = 30;

    private final DoctorRepository doctors;
    private final TimeSlotRepository slots;

    public DoctorService(DoctorRepository doctors, TimeSlotRepository slots) {
        this.doctors = doctors;
        this.slots = slots;
    }

    public List<DoctorDto> search(String q, String specialization) {
        String query = q == null ? "" : q.trim();
        String spec = specialization == null ? "" : specialization.trim();
        return doctors.search(query, spec).stream().map(Mapper::doctor).toList();
    }

    public DoctorDto get(Long id) {
        return doctors.findById(id).map(Mapper::doctor)
            .orElseThrow(() -> ApiException.notFound("Doctor not found."));
    }

    public List<String> specializations() { return doctors.findSpecializations(); }

    /** Dates in the next 30 days on which the doctor still has at least one free, future slot. */
    public List<LocalDate> availableDates(Long doctorId) {
        get(doctorId);
        LocalDate today = LocalDate.now();
        LocalDateTime now = LocalDateTime.now();
        return slots.findByDoctorAndStatusBetween(doctorId, SlotStatus.AVAILABLE, today,
                today.plusDays(BOOKING_WINDOW_DAYS)).stream()
            .filter(s -> s.startsAt().isAfter(now))
            .map(TimeSlot::getSlotDate)
            .distinct()
            .toList();
    }

    /** Slots published by the doctor for one date. Past times are never returned. */
    public List<SlotDto> slotsFor(Long doctorId, LocalDate date) {
        get(doctorId);
        if (date.isBefore(LocalDate.now())) {
            throw ApiException.badRequest("You cannot view slots for a past date.");
        }
        LocalDateTime now = LocalDateTime.now();
        return slots.findByDoctorAndDate(doctorId, date).stream()
            .filter(s -> s.startsAt().isAfter(now))
            .map(s -> new SlotDto(s.getId(), s.getSlotDate(), s.getStartTime(), s.getEndTime(),
                s.getStatus() == SlotStatus.AVAILABLE))
            .toList();
    }
}
