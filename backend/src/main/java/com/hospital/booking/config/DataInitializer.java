package com.hospital.booking.config;

import com.hospital.booking.model.Doctor;
import com.hospital.booking.model.Patient;
import com.hospital.booking.repository.DoctorRepository;
import com.hospital.booking.repository.PatientRepository;
import com.hospital.booking.service.DoctorService;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {
    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final DoctorRepository doctorRepository;
    private final PatientRepository patientRepository;
    private final DoctorService doctorService;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(DoctorRepository doctorRepository, PatientRepository patientRepository,
                           DoctorService doctorService, PasswordEncoder passwordEncoder) {
        this.doctorRepository = doctorRepository;
        this.patientRepository = patientRepository;
        this.doctorService = doctorService;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        try {
            initPatients();
            initDoctors();
        } catch (Exception e) {
            log.info("Data initialization check completed (database already initialized or offline: {})", e.getMessage());
        }
    }

    private void initPatients() {
        if (patientRepository.findByEmail("demo@patient.com").isEmpty()) {
            Patient p = new Patient();
            p.setFullName("Demo Patient");
            p.setEmail("demo@patient.com");
            p.setPasswordHash(passwordEncoder.encode("Password@123"));
            p.setPhone("9876543210");
            p.setDateOfBirth(LocalDate.of(1995, 6, 15));
            p.setGender("Female");
            p.setAddress("Shivajinagar, Pune, MH 411005");
            p.setBloodGroup("B+");
            patientRepository.save(p);
            log.info("Initialized demo patient account: demo@patient.com");
        }
    }

    private void initDoctors() {
        if (doctorRepository.count() > 0) return;

        List<Doctor> docs = List.of(
            createDoc("Dr. Anita Deshmukh", "Cardiology", "MBBS, MD, DM (Cardiology)", 16, new BigDecimal("800.00"),
                "Senior Interventional Cardiologist specializing in preventive cardiology, coronary interventions, and heart failure management."),
            createDoc("Dr. Rajesh Kulkarni", "Dermatology", "MBBS, MD (Dermatology, Venereology & Leprosy)", 12, new BigDecimal("650.00"),
                "Consultant Dermatologist and Trichologist focused on clinical dermatology, cosmetic therapies, and pediatric skin disorders."),
            createDoc("Dr. Sunita Patel", "Pediatrics", "MBBS, DCH, DNB (Pediatrics)", 14, new BigDecimal("600.00"),
                "Senior Pediatrician with extensive experience in neonatology, childhood vaccination schedules, and adolescent growth."),
            createDoc("Dr. Vikram Malhotra", "Orthopedics", "MBBS, MS (Orthopedics), M.Ch", 18, new BigDecimal("900.00"),
                "Chief Orthopedic Surgeon specializing in minimally invasive joint replacements, sports injuries, and arthroscopic procedures."),
            createDoc("Dr. Priya Sharma", "Gynecology", "MBBS, MS (Obstetrics & Gynecology)", 11, new BigDecimal("700.00"),
                "Obstetrician and Gynecologist dedicated to high-risk pregnancy management, laparoscopic surgeries, and women's wellness."),
            createDoc("Dr. Farhan Sayyed", "Neurology", "MBBS, MD (General Medicine), DM (Neurology)", 15, new BigDecimal("950.00"),
                "Consultant Neurologist specializing in stroke management, epilepsy, neuromuscular disorders, and chronic migraines."),
            createDoc("Dr. Meera Joshi", "General Medicine", "MBBS, MD (Internal Medicine)", 9, new BigDecimal("500.00"),
                "General Physician managing lifestyle diseases, diabetes, hypertension, infectious diseases, and routine health checks."),
            createDoc("Dr. Anand Verma", "ENT", "MBBS, MS (ENT / Otorhinolaryngology)", 13, new BigDecimal("650.00"),
                "ENT Specialist with advanced expertise in endoscopic sinus surgery, micro-ear surgery, and pediatric ENT disorders.")
        );

        doctorRepository.saveAll(docs);
        log.info("Initialized {} doctors.", docs.size());

        LocalDate today = LocalDate.now();
        for (Doctor doc : docs) {
            for (int i = 0; i < 14; i++) {
                LocalDate d = today.plusDays(i);
                if (doctorService.isDoctorWorkingDay(doc.getId(), d)) {
                    doctorService.ensureSlotsExist(doc, d);
                }
            }
        }
    }

    private Doctor createDoc(String name, String spec, String qual, int exp, BigDecimal fee, String about) {
        Doctor d = new Doctor();
        d.setFullName(name);
        d.setSpecialization(spec);
        d.setQualification(qual);
        d.setExperienceYears(exp);
        d.setConsultationFee(fee);
        d.setAbout(about);
        return d;
    }
}

