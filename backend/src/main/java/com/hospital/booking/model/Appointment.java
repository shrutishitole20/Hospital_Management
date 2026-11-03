package com.hospital.booking.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "appointments")
@Getter @Setter @NoArgsConstructor
public class Appointment {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true) private String referenceCode;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "patient_id")
    private Patient patient;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "doctor_id")
    private Doctor doctor;
    /** Current slot. Kept after cancellation so the record still shows when it was. */
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "slot_id")
    private TimeSlot slot;
    @Column(length = 500) private String reason;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false) private AppointmentStatus status = AppointmentStatus.PENDING;
    @Column(length = 500) private String rejectionReason;
    @Column(length = 500) private String cancellationReason;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist void onCreate() { createdAt = LocalDateTime.now(); updatedAt = createdAt; }
    @PreUpdate void onUpdate() { updatedAt = LocalDateTime.now(); }

    public boolean isActive() {
        return status == AppointmentStatus.PENDING || status == AppointmentStatus.CONFIRMED;
    }
}
