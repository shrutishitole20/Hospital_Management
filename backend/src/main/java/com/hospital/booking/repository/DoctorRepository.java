package com.hospital.booking.repository;

import com.hospital.booking.model.Doctor;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DoctorRepository extends JpaRepository<Doctor, Long> {

    /** Pass "" (not null) for a filter that should be ignored. */
    @Query("""
        select d from Doctor d
        where (:q = '' or lower(d.fullName) like lower(concat('%', :q, '%'))
                       or lower(d.specialization) like lower(concat('%', :q, '%')))
          and (:spec = '' or lower(d.specialization) = lower(:spec))
        order by d.fullName
        """)
    List<Doctor> search(@Param("q") String q, @Param("spec") String spec);

    @Query("select distinct d.specialization from Doctor d order by d.specialization")
    List<String> findSpecializations();
}
