-- Hospital Appointment Scheduling System: Patient Booking Module
-- MySQL 8.0+
DROP DATABASE IF EXISTS hospital_db;
CREATE DATABASE hospital_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE hospital_db;

CREATE TABLE patients (
  id             BIGINT AUTO_INCREMENT PRIMARY KEY,
  full_name      VARCHAR(100) NOT NULL,
  email          VARCHAR(150) NOT NULL UNIQUE,
  password_hash  VARCHAR(100) NOT NULL,
  phone          VARCHAR(20),
  date_of_birth  DATE,
  gender         VARCHAR(20),
  address        VARCHAR(255),
  blood_group    VARCHAR(5),
  created_at     DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB;

CREATE TABLE doctors (
  id               BIGINT AUTO_INCREMENT PRIMARY KEY,
  full_name        VARCHAR(100) NOT NULL,
  specialization   VARCHAR(100) NOT NULL,
  qualification    VARCHAR(150),
  experience_years INT,
  consultation_fee DECIMAL(10,2) NOT NULL,
  about            VARCHAR(1000),
  INDEX idx_doctor_name (full_name),
  INDEX idx_doctor_spec (specialization)
) ENGINE=InnoDB;

-- Slots published by each doctor's schedule. status flips to BOOKED when a patient books it.
CREATE TABLE time_slots (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  doctor_id   BIGINT NOT NULL,
  slot_date   DATE NOT NULL,
  start_time  TIME NOT NULL,
  end_time    TIME NOT NULL,
  status      VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',
  CONSTRAINT fk_slot_doctor FOREIGN KEY (doctor_id) REFERENCES doctors(id),
  CONSTRAINT uq_doctor_slot UNIQUE (doctor_id, slot_date, start_time),
  CONSTRAINT chk_slot_status CHECK (status IN ('AVAILABLE','BOOKED')),
  INDEX idx_slot_lookup (doctor_id, slot_date, status)
) ENGINE=InnoDB;

CREATE TABLE appointments (
  id                   BIGINT AUTO_INCREMENT PRIMARY KEY,
  reference_code       VARCHAR(30) NOT NULL UNIQUE,
  patient_id           BIGINT NOT NULL,
  doctor_id            BIGINT NOT NULL,
  slot_id              BIGINT NOT NULL,
  reason               VARCHAR(500),
  status               VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  rejection_reason     VARCHAR(500),
  cancellation_reason  VARCHAR(500),
  created_at           DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at           DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  CONSTRAINT fk_appt_patient FOREIGN KEY (patient_id) REFERENCES patients(id),
  CONSTRAINT fk_appt_doctor  FOREIGN KEY (doctor_id)  REFERENCES doctors(id),
  CONSTRAINT fk_appt_slot    FOREIGN KEY (slot_id)    REFERENCES time_slots(id),
  CONSTRAINT chk_appt_status CHECK (status IN ('PENDING','CONFIRMED','REJECTED','CANCELLED','COMPLETED')),
  INDEX idx_appt_patient (patient_id, status)
) ENGINE=InnoDB;

-- Record of every booking, reschedule and cancellation.
CREATE TABLE appointment_history (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  appointment_id  BIGINT NOT NULL,
  action          VARCHAR(20) NOT NULL,
  from_slot_id    BIGINT NULL,
  to_slot_id      BIGINT NULL,
  note            VARCHAR(500),
  created_at      DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  CONSTRAINT fk_hist_appt FOREIGN KEY (appointment_id) REFERENCES appointments(id),
  CONSTRAINT fk_hist_from FOREIGN KEY (from_slot_id) REFERENCES time_slots(id),
  CONSTRAINT fk_hist_to   FOREIGN KEY (to_slot_id)   REFERENCES time_slots(id),
  CONSTRAINT chk_hist_action CHECK (action IN ('BOOKED','RESCHEDULED','CANCELLED')),
  INDEX idx_hist_appt (appointment_id)
) ENGINE=InnoDB;
