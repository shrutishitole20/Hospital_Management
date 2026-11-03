package com.hospital.booking.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "doctors")
@Getter @Setter @NoArgsConstructor
public class Doctor {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false) private String fullName;
    @Column(nullable = false) private String specialization;
    private String qualification;
    private Integer experienceYears;
    @Column(nullable = false, precision = 10, scale = 2) private BigDecimal consultationFee;
    @Column(length = 1000) private String about;
}
