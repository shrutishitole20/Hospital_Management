# Hospital Appointment Scheduling System: Patient Booking Module

Patients can register, find doctors, see free time slots, and book, reschedule or cancel appointments.

| Layer    | Technology                                           |
| -------- | ---------------------------------------------------- |
| Frontend | Next.js 14 (App Router, JavaScript)                  |
| Backend  | Spring Boot 3.3, Java 17, Spring Security + JWT, JPA |
| Database | MySQL 8                                              |

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

| #   | Requirement                              | Where                                                                                                          |
| --- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| 1   | Register, login, logout                  | `/register`, `/login`, navbar Log out · `AuthController`                                                       |
| 2   | View and update profile                  | `/profile` · `PatientController`                                                                               |
| 3   | Search doctors by name or specialization | `/` · `GET /api/doctors?q=&specialization=`                                                                    |
| 4   | Doctor details and fees                  | `/doctors/[id]`                                                                                                |
| 5   | Available dates and slots                | `SlotPicker` · `GET /api/doctors/{id}/dates`, `/slots?date=`                                                   |
| 6   | Book appointment                         | `POST /api/appointments`                                                                                       |
| 7   | Upcoming and past appointments           | `/appointments` (tabs)                                                                                         |
| 8   | Reschedule                               | `/appointments/[id]/reschedule` · `PUT /api/appointments/{id}/reschedule`                                      |
| 9   | Cancel                                   | Cancel button on `/appointments` · `POST /api/appointments/{id}/cancel`                                        |
| 10  | Status and rejection reason              | Status badge and red callout on list and detail pages                                                          |
| 11  | Booking confirmation                     | Confirmation banner with reference code after booking; message also logged by the backend as an email stand-in |
| 12  | Appointment history                      | `/history` and per-appointment timeline · `appointment_history` table                                          |

## Business rules

| Rule                                    | How it is enforced                                                                                                                                                |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| No appointments in the past             | `AppointmentService.lockBookableSlot` rejects slots whose start is not in the future; past times and dates are never listed                                       |
| No double booking of a doctor/time slot | Slot row is locked (`PESSIMISTIC_WRITE`) and its status checked inside the booking transaction; `time_slots` also has a unique key on doctor, date and start time |
| Only slots from the doctor's schedule   | Patients can only book rows in `time_slots`; nothing is generated from patient input                                                                              |
| Availability updates after booking      | Slot flips to `BOOKED` on booking and reschedule target; returns to `AVAILABLE` when the old slot is vacated or the appointment is cancelled                      |
| Record cancellations and rescheduling   | Every action writes an `appointment_history` row; cancelled appointments keep their reason and slot                                                               |

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

### Postman API Collection

A complete, pre-configured Postman Collection with automated tests and dynamic authentication chaining is available in the repository:

- **Direct Postman Import URL (Raw):**  
  ```
  https://raw.githubusercontent.com/shrutishitole20/Hospital_Management/main/Hospital_Management_APIs.postman_collection.json
  ```
- **GitHub Collection File:**  
  [`Hospital_Management_APIs.postman_collection.json`](Hospital_Management_APIs.postman_collection.json)

#### How to Import via Link in Postman:
1. Open **Postman** and click **Import** (top left).
2. Paste the **Direct Postman Import URL** above into the input box.
3. Click **Import**.
4. Run `POST Login (Demo Patient)` first to automatically set the `{{token}}` variable, or click **Run collection** to run all 24 requests and 42 assertions automatically.

## Troubleshooting

- **"Cannot reach the server"**: backend is not running or `NEXT_PUBLIC_API_URL` is wrong.
- **CORS error**: the frontend must run on `http://localhost:3000`, or set `CORS_ORIGIN`.
- **No slots shown**: sample slots cover 14 days from the day you load the data. Re-run both SQL files to regenerate them.
- **Access denied for user 'root'**: set `DB_PASSWORD`.

### How to Run

#### 1. Start the Backend

In your PowerShell terminal:

```powershell
cd "c:\Users\shruti shitole\Downloads\Hospital_Management_Project\Hospital_Management\backend"
$env:DB_USER='root'
$env:DB_PASSWORD='your_mysql_password'
.\mvnw.cmd spring-boot:run
```

#### 2. Start the Frontend

In another terminal window:

```powershell
cd "c:\Users\shruti shitole\Downloads\Hospital_Management_Project\Hospital_Management\frontend"
copy .env.local.example .env.local
npm install
npm run dev
```

#### Demo Login

Once open in your browser (http://localhost:3000):

- **Email:** `demo@patient.com`
- **Password:** `Password@123`

## 4. Automated Testing

The backend includes a comprehensive JUnit 5 and Mockito test suite in `backend/src/test` covering all core business logic and rules:

```powershell
cd backend
.\mvnw.cmd test
```

### Verified Business Rules in Tests:
- `testBookSuccess`: Booking a valid future slot flips slot status to `BOOKED` and writes an audit event to `appointment_history`.
- `testBookSlotInPastThrowsBadRequest`: Enforces that past dates/times cannot be booked.
- `testBookOccupiedSlotThrowsConflict`: Prevents double-booking already occupied doctor slots.
- `testBookConflictingTimeThrowsConflict`: Blocks patients from booking multiple overlapping appointments.
- `testRescheduleSuccess`: Atomically releases the original slot back to `AVAILABLE`, marks the new slot `BOOKED`, resets status to `PENDING` for re-approval, and logs a `RESCHEDULED` action.
- `testCancelSuccess`: Releases the booked slot back to the schedule, updates status to `CANCELLED`, records the cancellation reason, and creates an audit entry.
- `testListUpcomingAndPast`: Verifies chronological sorting and segregation of upcoming vs past appointments.

---

## 5. Key Screens & Screenshots

All 11 key screen captures are archived in [`docs/screenshots`](docs/screenshots/):

| # | Screen | Description | File |
|---|---|---|---|
| 1 | **Patient Registration** | Registration with input validation and demographic capture | [`01-register.png`](docs/screenshots/01-register.png) |
| 2 | **Patient Login** | JWT authentication with pre-annotated demo credentials | [`02-login.png`](docs/screenshots/02-login.png) |
| 3 | **Find Doctor** | Real-time search by name and interactive specialization filter chips | [`03-find-doctor.png`](docs/screenshots/03-find-doctor.png) |
| 4 | **Doctor Details & Slots** | Doctor profile, consultation fees, and real-time schedule slot picker | [`04-doctor-slots.png`](docs/screenshots/04-doctor-slots.png) |
| 5 | **Booking Confirmation** | Booking confirmation banner with reference code and summary details | [`05-booking-confirmation.png`](docs/screenshots/05-booking-confirmation.png) |
| 6 | **Upcoming Appointments** | List of upcoming bookings with status badges and quick action controls | [`06-upcoming.png`](docs/screenshots/06-upcoming.png) |
| 7 | **Past & Rejected Bookings** | Past appointments with callouts explaining doctor rejection / patient cancellation reasons | [`07-past-rejected.png`](docs/screenshots/07-past-rejected.png) |
| 8 | **Reschedule Appointment** | Interface to choose an alternate time slot with the same doctor | [`08-reschedule.png`](docs/screenshots/08-reschedule.png) |
| 9 | **Cancel Appointment** | Cancellation prompt with optional reason field | [`09-cancel.png`](docs/screenshots/09-cancel.png) |
| 10 | **Appointment History** | Chronological audit trail showing every booking, reschedule, and cancellation | [`10-history.png`](docs/screenshots/10-history.png) |
| 11 | **Patient Profile** | Profile management screen to view and update contact & health profile info | [`11-profile.png`](docs/screenshots/11-profile.png) |

