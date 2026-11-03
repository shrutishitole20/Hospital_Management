package com.hospital.booking.repository;

import com.hospital.booking.model.AppointmentHistory;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AppointmentHistoryRepository extends JpaRepository<AppointmentHistory, Long> {

    @Query("""
        select h from AppointmentHistory h
        join fetch h.appointment a join fetch a.doctor
        left join fetch h.fromSlot left join fetch h.toSlot
        where a.patient.id = :pid
        order by h.createdAt desc, h.id desc
        """)
    List<AppointmentHistory> findAllForPatient(@Param("pid") Long pid);

    @Query("""
        select h from AppointmentHistory h
        join fetch h.appointment a join fetch a.doctor
        left join fetch h.fromSlot left join fetch h.toSlot
        where a.id = :aid
        order by h.createdAt asc, h.id asc
        """)
    List<AppointmentHistory> findForAppointment(@Param("aid") Long aid);
}
