package com.hospital.booking.controller;

import static com.hospital.booking.dto.Dtos.*;

import com.hospital.booking.service.DoctorService;
import java.time.LocalDate;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/doctors")
public class DoctorController {
    private final DoctorService doctors;

    public DoctorController(DoctorService doctors) { this.doctors = doctors; }

    @GetMapping
    public List<DoctorDto> search(@RequestParam(required = false) String q,
                                  @RequestParam(required = false) String specialization) {
        return doctors.search(q, specialization);
    }

    @GetMapping("/specializations")
    public List<String> specializations() { return doctors.specializations(); }

    @GetMapping("/{id}")
    public DoctorDto get(@PathVariable Long id) { return doctors.get(id); }

    @GetMapping("/{id}/dates")
    public List<LocalDate> dates(@PathVariable Long id) { return doctors.availableDates(id); }

    @GetMapping("/{id}/slots")
    public List<SlotDto> slots(@PathVariable Long id,
                               @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return doctors.slotsFor(id, date);
    }
}
