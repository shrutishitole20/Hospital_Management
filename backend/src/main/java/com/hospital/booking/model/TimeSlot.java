package com.hospital.booking.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** One bookable slot published by a doctor's schedule. */
@Entity
@Table(name = "time_slots")
@Getter @Setter @NoArgsConstructor
public class TimeSlot {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "doctor_id")
    private Doctor doctor;
    @Column(nullable = false) private LocalDate slotDate;
    @Column(nullable = false) private LocalTime startTime;
    @Column(nullable = false) private LocalTime endTime;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false) private SlotStatus status = SlotStatus.AVAILABLE;

    public LocalDateTime startsAt() { return LocalDateTime.of(slotDate, startTime); }
}
