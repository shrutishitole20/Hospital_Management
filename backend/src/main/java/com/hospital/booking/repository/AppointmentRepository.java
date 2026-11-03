package com.hospital.booking.repository;

import com.hospital.booking.model.Appointment;
import com.hospital.booking.model.AppointmentStatus;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    @Query("select a from Appointment a join fetch a.doctor join fetch a.slot where a.patient.id = :pid")
    List<Appointment> findAllByPatient(@Param("pid") Long pid);

    @Query("select a from Appointment a join fetch a.doctor join fetch a.slot where a.id = :id and a.patient.id = :pid")
    Optional<Appointment> findOwned(@Param("id") Long id, @Param("pid") Long pid);

    @Query("""
        select count(a) from Appointment a
        where a.patient.id = :pid and a.slot.slotDate = :date and a.slot.startTime = :time
          and a.status in :statuses
        """)
    long countAtTime(@Param("pid") Long pid, @Param("date") LocalDate date, @Param("time") LocalTime time,
                     @Param("statuses") Collection<AppointmentStatus> statuses);

    boolean existsByReferenceCode(String referenceCode);
}
