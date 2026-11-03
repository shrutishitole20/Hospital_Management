# Hospital Appointment Scheduling System: Patient Booking Module

Patients can register, find doctors, see free time slots, and book, reschedule or cancel appointments.

| Layer     | Technology                                   |
|-----------|----------------------------------------------|
| Frontend  | Next.js 14 (App Router, JavaScript)          |
| Backend   | Spring Boot 3.3, Java 17, Spring Security + JWT, JPA |
| Database  | MySQL 8                                      |

```
Hospital_Management/
├── backend/     Spring Boot REST API  (port 8080)
├── frontend/    Next.js app           (port 3000)
├── database/    schema.sql + sample_data.sql
└── docs/screenshots/
```

## Prerequisites
Java 17+, Node.js 18.17+, MySQL 8.0+. Maven is optional: the backend ships with the Maven wrapper (`mvnw`), which downloads Maven 3.9.9 on first run.

## 1. Database
```bash
mysql -u root -p < database/schema.sql
mysql -u root -p < database/sample_data.sql
```
`schema.sql` drops and recreates `hospital_db`. The sample data adds 8 doctors, 14 days of 30-minute slots, and a demo patient with past, cancelled, rejected and upcoming appointments.

## 2. Backend
Default DB credentials are `root` / `root`. Change them with environment variables if yours differ.
```bash
cd backend
export DB_USER=root DB_PASSWORD=your_mysql_password   # Windows PowerShell: $env:DB_PASSWORD="..."
./mvnw spring-boot:run          # Windows: mvnw.cmd spring-boot:run   (plain `mvn spring-boot:run` also works)
```
API runs at http://localhost:8080/api. Other variables: `DB_HOST`, `DB_PORT`, `DB_NAME`, `JWT_SECRET` (base64, 32+ bytes; change it for any real deployment), `CORS_ORIGIN`.

## 3. Frontend
```bash
cd frontend
cp .env.local.example .env.local      # Windows: copy .env.local.example .env.local
npm install
npm run dev
```
Open http://localhost:3000 and log in with **demo@patient.com / Password@123**, or register a new account.

## Requirements coverage
| # | Requirement | Where |
|---|-------------|-------|
| 1 | Register, login, logout | `/register`, `/login`, navbar Log out · `AuthController` |
| 2 | View and update profile | `/profile` · `PatientController` |
| 3 | Search doctors by name or specialization | `/` · `GET /api/doctors?q=&specialization=` |
| 4 | Doctor details and fees | `/doctors/[id]` |
| 5 | Available dates and slots | `SlotPicker` · `GET /api/doctors/{id}/dates`, `/slots?date=` |
| 6 | Book appointment | `POST /api/appointments` |
| 7 | Upcoming and past appointments | `/appointments` (tabs) |
| 8 | Reschedule | `/appointments/[id]/reschedule` · `PUT /api/appointments/{id}/reschedule` |
| 9 | Cancel | Cancel button on `/appointments` · `POST /api/appointments/{id}/cancel` |
| 10 | Status and rejection reason | Status badge and red callout on list and detail pages |
| 11 | Booking confirmation | Confirmation banner with reference code after booking; message also logged by the backend as an email stand-in |
| 12 | Appointment history | `/history` and per-appointment timeline · `appointment_history` table |

## Business rules
| Rule | How it is enforced |
|------|--------------------|
| No appointments in the past | `AppointmentService.lockBookableSlot` rejects slots whose start is not in the future; past times and dates are never listed |
| No double booking of a doctor/time slot | Slot row is locked (`PESSIMISTIC_WRITE`) and its status checked inside the booking transaction; `time_slots` also has a unique key on doctor, date and start time |
| Only slots from the doctor's schedule | Patients can only book rows in `time_slots`; nothing is generated from patient input |
| Availability updates after booking | Slot flips to `BOOKED` on booking and reschedule target; returns to `AVAILABLE` when the old slot is vacated or the appointment is cancelled |
| Record cancellations and rescheduling | Every action writes an `appointment_history` row; cancelled appointments keep their reason and slot |

Extra rules: a patient cannot hold two active appointments at the same time, and rescheduling is limited to the same doctor. A rescheduled appointment returns to `PENDING` for doctor re-approval.

## Appointment statuses
`PENDING` (just booked or rescheduled) → `CONFIRMED` or `REJECTED` (with reason) by the doctor, then `COMPLETED`. Patients can also `CANCELLED`. The doctor/admin module is outside this assignment, so to demo approval or rejection, update the row directly:
```sql
UPDATE appointments SET status='CONFIRMED' WHERE reference_code='APT-...';
UPDATE appointments SET status='REJECTED', rejection_reason='Doctor unavailable that day' WHERE reference_code='APT-...';
```
(When a doctor rejects, also set that slot back to `AVAILABLE`.)

## API summary
```
POST /api/auth/register | /login | /logout
GET  PUT /api/patients/me
GET  /api/doctors?q=&specialization=      GET /api/doctors/specializations
GET  /api/doctors/{id}                    GET /api/doctors/{id}/dates
GET  /api/doctors/{id}/slots?date=YYYY-MM-DD
POST /api/appointments                    body: { slotId, reason }
GET  /api/appointments?type=upcoming|past|all
GET  /api/appointments/{id}               GET /api/appointments/{id}/history
GET  /api/appointments/history
PUT  /api/appointments/{id}/reschedule    body: { newSlotId, reason }
POST /api/appointments/{id}/cancel        body: { reason }
```
Doctor endpoints are public; everything else needs `Authorization: Bearer <token>`.

## Troubleshooting
- **"Cannot reach the server"**: backend is not running or `NEXT_PUBLIC_API_URL` is wrong.
- **CORS error**: the frontend must run on `http://localhost:3000`, or set `CORS_ORIGIN`.
- **No slots shown**: sample slots cover 14 days from the day you load the data. Re-run both SQL files to regenerate them.
- **Access denied for user 'root'**: set `DB_PASSWORD`.
