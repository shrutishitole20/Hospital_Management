package com.hospital.booking.repository;

import com.hospital.booking.model.SlotStatus;
import com.hospital.booking.model.TimeSlot;
import jakarta.persistence.LockModeType;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TimeSlotRepository extends JpaRepository<TimeSlot, Long> {

    @Query("""
        select s from TimeSlot s
        where s.doctor.id = :doctorId and s.status = :status
          and s.slotDate between :from and :to
        order by s.slotDate, s.startTime
        """)
    List<TimeSlot> findByDoctorAndStatusBetween(@Param("doctorId") Long doctorId,
                                                @Param("status") SlotStatus status,
                                                @Param("from") LocalDate from,
                                                @Param("to") LocalDate to);

    @Query("select s from TimeSlot s where s.doctor.id = :doctorId and s.slotDate = :date order by s.startTime")
    List<TimeSlot> findByDoctorAndDate(@Param("doctorId") Long doctorId, @Param("date") LocalDate date);

    /** Row lock so two patients cannot book the same slot at the same time. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select s from TimeSlot s join fetch s.doctor where s.id = :id")
    Optional<TimeSlot> findByIdForUpdate(@Param("id") Long id);
}
