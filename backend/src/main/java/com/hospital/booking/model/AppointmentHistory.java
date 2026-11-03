package com.hospital.booking.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Audit trail: every booking, reschedule and cancellation is recorded here. */
@Entity
@Table(name = "appointment_history")
@Getter @Setter @NoArgsConstructor
public class AppointmentHistory {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "appointment_id")
    private Appointment appointment;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false) private HistoryAction action;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "from_slot_id")
    private TimeSlot fromSlot;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "to_slot_id")
    private TimeSlot toSlot;
    @Column(length = 500) private String note;
    private LocalDateTime createdAt;

    @PrePersist void onCreate() { createdAt = LocalDateTime.now(); }
}
