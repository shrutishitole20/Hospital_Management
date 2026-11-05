package com.hospital.booking.service;

import static com.hospital.booking.dto.Dtos.*;

import com.hospital.booking.exception.ApiException;
import com.hospital.booking.model.Doctor;
import com.hospital.booking.model.SlotStatus;
import com.hospital.booking.model.TimeSlot;
import com.hospital.booking.repository.DoctorRepository;
import com.hospital.booking.repository.TimeSlotRepository;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.YearMonth;
import java.util.*;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class DoctorService {
    private static final int BOOKING_WINDOW_DAYS = 90;

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

    /** Dates in the next 90 days on which the doctor still has at least one free, future slot. */
    @Transactional
    public List<LocalDate> availableDates(Long doctorId) {
        Doctor doctor = doctors.findById(doctorId)
            .orElseThrow(() -> ApiException.notFound("Doctor not found."));
        LocalDate today = LocalDate.now();
        LocalDate pregenEnd = today.plusDays(14);
        for (LocalDate d = today; !d.isAfter(pregenEnd); d = d.plusDays(1)) {
            if (isDoctorWorkingDay(doctorId, d)) {
                ensureSlotsExist(doctor, d);
            }
        }
        LocalDateTime now = LocalDateTime.now();
        return slots.findByDoctorAndStatusBetween(doctorId, SlotStatus.AVAILABLE, today,
                today.plusDays(BOOKING_WINDOW_DAYS)).stream()
            .filter(s -> s.startsAt().isAfter(now))
            .map(TimeSlot::getSlotDate)
            .distinct()
            .toList();
    }

    /** Returns calendar availability metrics for each day in the requested month (YYYY-MM). */
    @Transactional
    public MonthAvailabilityDto availabilityForMonth(Long doctorId, String monthStr) {
        Doctor doctor = doctors.findById(doctorId)
            .orElseThrow(() -> ApiException.notFound("Doctor not found."));

        YearMonth ym;
        try {
            ym = (monthStr == null || monthStr.isBlank())
                ? YearMonth.now()
                : YearMonth.parse(monthStr.trim());
        } catch (Exception e) {
            ym = YearMonth.now();
        }

        LocalDate start = ym.atDay(1);
        LocalDate end = ym.atEndOfMonth();
        LocalDate today = LocalDate.now();
        LocalDateTime now = LocalDateTime.now();

        // Ensure schedule slots are created for valid working days in this month
        for (int day = 1; day <= ym.lengthOfMonth(); day++) {
            LocalDate d = ym.atDay(day);
            if (!d.isBefore(today) && isDoctorWorkingDay(doctor.getId(), d)) {
                ensureSlotsExist(doctor, d);
            }
        }

        List<TimeSlot> monthSlots = slots.findByDoctorAndDateBetween(doctorId, start, end);
        Map<LocalDate, List<TimeSlot>> byDate = monthSlots.stream()
            .collect(Collectors.groupingBy(TimeSlot::getSlotDate));

        List<DayAvailabilityDto> days = new ArrayList<>(ym.lengthOfMonth());
        for (int day = 1; day <= ym.lengthOfMonth(); day++) {
            LocalDate d = ym.atDay(day);

            if (d.isBefore(today) || !isDoctorWorkingDay(doctor.getId(), d)) {
                days.add(new DayAvailabilityDto(d, "UNAVAILABLE", 0, 0, 0));
                continue;
            }

            List<TimeSlot> daySlots = byDate.getOrDefault(d, Collections.emptyList());
            int total = daySlots.size();
            if (total == 0) {
                days.add(new DayAvailabilityDto(d, "UNAVAILABLE", 0, 0, 0));
                continue;
            }

            int available = 0;
            int booked = 0;
            for (TimeSlot s : daySlots) {
                if (s.getStatus() == SlotStatus.BOOKED) {
                    booked++;
                } else if (s.getStatus() == SlotStatus.AVAILABLE && s.startsAt().isAfter(now)) {
                    available++;
                }
            }

            String status;
            if (available == 0) {
                status = "FULLY_BOOKED";
            } else if (booked > 0) {
                status = "PARTIALLY_BOOKED";
            } else {
                status = "AVAILABLE";
            }

            days.add(new DayAvailabilityDto(d, status, total, available, booked));
        }

        return new MonthAvailabilityDto(ym.toString(), doctorId, days);
    }

    /** Slots published by the doctor for one date. Past times are never returned. */
    @Transactional
    public List<SlotDto> slotsFor(Long doctorId, LocalDate date) {
        Doctor doctor = doctors.findById(doctorId)
            .orElseThrow(() -> ApiException.notFound("Doctor not found."));

        if (date.isBefore(LocalDate.now())) {
            throw ApiException.badRequest("You cannot view slots for a past date.");
        }

        if (isDoctorWorkingDay(doctorId, date)) {
            ensureSlotsExist(doctor, date);
        }

        LocalDateTime now = LocalDateTime.now();
        return slots.findByDoctorAndDate(doctorId, date).stream()
            .map(s -> {
                boolean isFuture = s.startsAt().isAfter(now);
                boolean available = isFuture && (s.getStatus() == SlotStatus.AVAILABLE);
                String statusStr = s.getStatus() == SlotStatus.BOOKED ? "BOOKED" : (isFuture ? "AVAILABLE" : "EXPIRED");
                return new SlotDto(s.getId(), s.getSlotDate(), s.getStartTime(), s.getEndTime(), available, statusStr);
            })
            .toList();
    }

    /** Checks whether a doctor works on a given day based on clinical rules. */
    public boolean isDoctorWorkingDay(Long doctorId, LocalDate date) {
        DayOfWeek dow = date.getDayOfWeek();
        if (dow == DayOfWeek.SUNDAY) return false;
        if (doctorId != null && doctorId % 3 == 0 && dow == DayOfWeek.SATURDAY) return false;
        return true;
    }

    /** Auto-generates standard 30-minute consultation slots for a doctor on a valid working day if none exist. */
    @Transactional
    public void ensureSlotsExist(Doctor doctor, LocalDate date) {
        List<TimeSlot> existing = slots.findByDoctorAndDate(doctor.getId(), date);
        if (!existing.isEmpty()) {
            return;
        }

        List<TimeSlot> toSave = new ArrayList<>();
        // Morning: 09:00 - 12:00
        LocalTime[] morningStarts = {
            LocalTime.of(9, 0), LocalTime.of(9, 30),
            LocalTime.of(10, 0), LocalTime.of(10, 30),
            LocalTime.of(11, 0), LocalTime.of(11, 30)
        };
        for (LocalTime st : morningStarts) {
            toSave.add(createSlot(doctor, date, st, 30));
        }

        // Afternoon: 12:30 - 16:00
        LocalTime[] afternoonStarts = {
            LocalTime.of(12, 30), LocalTime.of(13, 0), LocalTime.of(13, 30),
            LocalTime.of(14, 0), LocalTime.of(14, 30),
            LocalTime.of(15, 0), LocalTime.of(15, 30)
        };
        for (LocalTime st : afternoonStarts) {
            toSave.add(createSlot(doctor, date, st, 30));
        }

        // Evening (doctors with even ID or ENT / General Medicine): 16:30 - 20:00
        if (doctor.getId() % 2 == 0 || doctor.getId() == 7 || doctor.getId() == 8) {
            LocalTime[] eveningStarts = {
                LocalTime.of(16, 30), LocalTime.of(17, 0), LocalTime.of(17, 30),
                LocalTime.of(18, 0), LocalTime.of(18, 30), LocalTime.of(19, 0)
            };
            for (LocalTime st : eveningStarts) {
                toSave.add(createSlot(doctor, date, st, 30));
            }
        }

        slots.saveAll(toSave);
    }

    private TimeSlot createSlot(Doctor doctor, LocalDate date, LocalTime startTime, int durationMinutes) {
        TimeSlot s = new TimeSlot();
        s.setDoctor(doctor);
        s.setSlotDate(date);
        s.setStartTime(startTime);
        s.setEndTime(startTime.plusMinutes(durationMinutes));
        s.setStatus(SlotStatus.AVAILABLE);
        return s;
    }
}
