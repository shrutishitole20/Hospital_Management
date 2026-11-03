-- Run after schema.sql.  Demo login:  demo@patient.com / Password@123
USE hospital_db;

INSERT INTO doctors (full_name, specialization, qualification, experience_years, consultation_fee, about) VALUES
('Dr. Anita Deshmukh', 'Cardiology',      'MD, DM (Cardiology)',  16, 800.00, 'Treats heart rhythm problems, high blood pressure and chest pain. Runs a preventive heart-health clinic.'),
('Dr. Rohan Kulkarni', 'Dermatology',     'MD (Dermatology)',      9, 600.00, 'Skin, hair and nail conditions including acne, eczema and allergies.'),
('Dr. Meera Iyer',     'Pediatrics',      'MD (Pediatrics)',      12, 500.00, 'Child health from newborn care to adolescence, vaccinations and growth checks.'),
('Dr. Sanjay Patil',   'Orthopedics',     'MS (Orthopedics)',     20, 900.00, 'Joint pain, fractures, sports injuries and knee or hip replacement follow-ups.'),
('Dr. Farah Sheikh',   'Gynecology',      'MD, DGO',              14, 700.00, 'Women''s health, pregnancy care and menstrual disorders.'),
('Dr. Vikram Joshi',   'Neurology',       'MD, DM (Neurology)',   18, 1000.00,'Headache, epilepsy, stroke recovery and nerve disorders.'),
('Dr. Neha Bhosale',   'General Medicine','MBBS, MD (Medicine)',   8, 400.00, 'First point of contact for fever, infections, diabetes and routine check-ups.'),
('Dr. Arjun Menon',    'ENT',             'MS (ENT)',             11, 550.00, 'Ear, nose and throat conditions, sinus problems and hearing tests.');

-- Slots for the next 14 days (Sundays off). 30-minute slots.
--  * every doctor sees patients 09:00-12:00
--  * doctors with an even id also have an afternoon session 14:00-17:00
--  * every 3rd doctor does not work Saturdays
INSERT INTO time_slots (doctor_id, slot_date, start_time, end_time, status)
SELECT d.id, DATE_ADD(CURDATE(), INTERVAL n.n DAY), t.st, ADDTIME(t.st, '00:30:00'), 'AVAILABLE'
FROM doctors d
CROSS JOIN (SELECT 0 n UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4
            UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9
            UNION ALL SELECT 10 UNION ALL SELECT 11 UNION ALL SELECT 12 UNION ALL SELECT 13) n
CROSS JOIN (SELECT CAST('09:00:00' AS TIME) st UNION ALL SELECT '09:30:00' UNION ALL SELECT '10:00:00'
            UNION ALL SELECT '10:30:00' UNION ALL SELECT '11:00:00' UNION ALL SELECT '11:30:00'
            UNION ALL SELECT '14:00:00' UNION ALL SELECT '14:30:00' UNION ALL SELECT '15:00:00'
            UNION ALL SELECT '15:30:00' UNION ALL SELECT '16:00:00' UNION ALL SELECT '16:30:00') t
WHERE DAYOFWEEK(DATE_ADD(CURDATE(), INTERVAL n.n DAY)) <> 1
  AND (d.id % 2 = 0 OR t.st < '14:00:00')
  AND NOT (d.id % 3 = 0 AND DAYOFWEEK(DATE_ADD(CURDATE(), INTERVAL n.n DAY)) = 7);

-- Demo patient (password: Password@123)
INSERT INTO patients (full_name, email, password_hash, phone, date_of_birth, gender, address, blood_group) VALUES
('Demo Patient', 'demo@patient.com', '$2b$10$lhD6tm60eTTDRGJvCCCfze1M9rRgem7TUnC5bXxcyekDVRt9y.LKC',
 '9876543210', '1995-06-15', 'Female', 'Kothrud, Pune', 'B+');

-- Past slots used by the demo history
INSERT INTO time_slots (doctor_id, slot_date, start_time, end_time, status) VALUES
(1, DATE_SUB(CURDATE(), INTERVAL 14 DAY), '10:00:00', '10:30:00', 'BOOKED'),
(3, DATE_SUB(CURDATE(), INTERVAL 5 DAY),  '11:00:00', '11:30:00', 'AVAILABLE'),
(7, DATE_SUB(CURDATE(), INTERVAL 2 DAY),  '09:30:00', '10:00:00', 'AVAILABLE');
SET @past_done = LAST_INSERT_ID();
SET @past_rej  = @past_done + 1;
SET @past_canc = @past_done + 2;

-- Upcoming slot for doctor 2 (first available 10:00 after today), marked booked
SET @future_slot = (SELECT id FROM time_slots
                    WHERE doctor_id = 2 AND slot_date > CURDATE() AND start_time = '10:00:00'
                    ORDER BY slot_date LIMIT 1);
UPDATE time_slots SET status = 'BOOKED' WHERE id = @future_slot;

INSERT INTO appointments (reference_code, patient_id, doctor_id, slot_id, reason, status, rejection_reason, cancellation_reason) VALUES
('APT-DEMO-0001', 1, 1, @past_done,   'Routine heart check-up',      'COMPLETED', NULL, NULL),
('APT-DEMO-0002', 1, 3, @past_rej,    'Child vaccination query',     'REJECTED',  'Doctor is on leave on this date. Please book another day.', NULL),
('APT-DEMO-0003', 1, 7, @past_canc,   'Fever and cold',              'CANCELLED', NULL, 'Felt better, no longer needed.'),
('APT-DEMO-0004', 1, 2, @future_slot, 'Persistent skin rash',        'CONFIRMED', NULL, NULL);

INSERT INTO appointment_history (appointment_id, action, from_slot_id, to_slot_id, note) VALUES
(1, 'BOOKED',    NULL,       @past_done,   'Appointment booked.'),
(2, 'BOOKED',    NULL,       @past_rej,    'Appointment booked.'),
(3, 'BOOKED',    NULL,       @past_canc,   'Appointment booked.'),
(3, 'CANCELLED', @past_canc, NULL,         'Felt better, no longer needed.'),
(4, 'BOOKED',    NULL,       @future_slot, 'Appointment booked.');
