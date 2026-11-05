"use client";
import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AppointmentCalendar from "./AppointmentCalendar";
import ClockPicker from "./ClockPicker";
import { api } from "@/lib/api";
import { fmtDate, fmtTime, fmtFee } from "@/lib/format";
import { downloadAppointmentIcs } from "@/lib/calendar";
import {
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  PrinterIcon,
  DownloadIcon,
  CopyIcon,
  ShieldCheckIcon,
  LockIcon,
  SparklesIcon,
} from "./Icons";

const QUICK_REASONS = [
  "General Consultation",
  "Routine Health Checkup",
  "Follow-up Visit",
  "Prescription Renewal",
  "Review Test Results",
];

export default function AppointmentScheduler({
  doctor,
  user,
  excludeSlotId = null,
  isReschedule = false,
  currentAppointment = null,
}) {
  const router = useRouter();

  // Selected date defaults to today's date formatted as YYYY-MM-DD
  const todayStr = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }, []);

  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [viewMode, setViewMode] = useState("SLOTS"); // "SLOTS" or "CLOCK"
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  // Modals
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Fetch slots whenever selectedDate or refreshKey changes
  const loadSlots = useCallback(() => {
    if (!selectedDate) return;
    setLoadingSlots(true);
    setError("");
    api(`/doctors/${doctor.id}/slots?date=${selectedDate}`)
      .then((res) => {
        setSlots(res || []);
        // If current selectedSlot is in the new slots, keep or update it
        setSelectedSlot((prev) => {
          if (!prev) return null;
          const matching = (res || []).find((s) => s.id === prev.id);
          return matching && matching.available ? matching : null;
        });
      })
      .catch((err) => {
        setError(err.message || "Failed to load slots for selected date.");
        setSlots([]);
      })
      .finally(() => {
        setLoadingSlots(false);
      });
  }, [doctor.id, selectedDate]);

  useEffect(() => {
    loadSlots();
  }, [loadSlots, refreshKey]);

  // Categorize slots by session
  const morningSlots = useMemo(() => {
    return slots.filter((s) => s.startTime < "12:00:00");
  }, [slots]);

  const afternoonSlots = useMemo(() => {
    return slots.filter((s) => s.startTime >= "12:00:00" && s.startTime < "16:00:00");
  }, [slots]);

  const eveningSlots = useMemo(() => {
    return slots.filter((s) => s.startTime >= "16:00:00");
  }, [slots]);

  const availableCount = useMemo(() => {
    return slots.filter((s) => s.available && s.id !== excludeSlotId).length;
  }, [slots, excludeSlotId]);

  // Handle slot selection
  const handleSelectSlot = (slot) => {
    if (!slot.available || slot.id === excludeSlotId) return;
    setSelectedSlot(slot);
    setError("");
  };

  // Perform booking with backend validation & atomic pessimistic lock
  const handleBookAppointment = async () => {
    if (!user) {
      router.push(`/login?next=${encodeURIComponent(`/doctors/${doctor.id}`)}`);
      return;
    }
    if (!selectedSlot) {
      setError("Please select an appointment time slot.");
      return;
    }

    setBusy(true);
    setError("");

    try {
      if (isReschedule && currentAppointment) {
        // Reschedule existing appointment
        const res = await api(`/appointments/${currentAppointment.id}/reschedule`, {
          method: "PUT",
          body: { newSlotId: selectedSlot.id, reason },
        });
        setShowConfirmModal(false);
        router.push(`/appointments/${currentAppointment.id}?rescheduled=1`);
      } else {
        // Book new appointment via /api/appointments/book/ (or /api/appointments)
        const res = await api("/appointments/book", {
          method: "POST",
          body: {
            slotId: selectedSlot.id,
            doctorId: doctor.id,
            appointmentDate: selectedDate,
            appointmentTime: selectedSlot.startTime,
            reason,
          },
        });
        setShowConfirmModal(false);
        setConfirmedBooking(res.appointment);
        // Refresh schedule
        setRefreshKey((k) => k + 1);
      }
    } catch (err) {
      // Handle race condition or conflict
      const isConflict = err.status === 409 || err.message?.toLowerCase().includes("slot") || err.message?.toLowerCase().includes("taken");
      if (isConflict) {
        setError("Sorry, this slot has just been booked. Please select another available time.");
      } else {
        setError(err.message || "Failed to confirm appointment. Please try again.");
      }
      setSelectedSlot(null);
      setShowConfirmModal(false);
      // Auto refresh slots so user immediately sees the slot as booked
      setRefreshKey((k) => k + 1);
    } finally {
      setBusy(false);
    }
  };

  const copyRefCode = (code) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const renderSlotButton = (s) => {
    const isCurrent = s.id === excludeSlotId;
    const isBooked = !s.available && !isCurrent;
    const isSelected = selectedSlot?.id === s.id;
    const disabled = !s.available || isCurrent;

    let btnClass = "slot-btn";
    if (isSelected) btnClass += " slot-btn-selected";
    else if (isCurrent) btnClass += " slot-btn-current";
    else if (isBooked) btnClass += " slot-btn-booked";
    else btnClass += " slot-btn-available";

    return (
      <button
        key={s.id}
        type="button"
        disabled={disabled}
        className={btnClass}
        onClick={() => handleSelectSlot(s)}
        title={
          isCurrent
            ? "Your currently booked slot"
            : isBooked
            ? "Already booked by another patient"
            : "Click to select this slot"
        }
        aria-pressed={isSelected}
      >
        <span className="slot-btn-time">{fmtTime(s.startTime)}</span>
        <span className="slot-btn-tag">
          {isSelected ? "Selected ✓" : isCurrent ? "Current" : isBooked ? "Booked" : "Available"}
        </span>
      </button>
    );
  };

  return (
    <div className="scheduler-root">
      {/* Top Banner: Selected Date Indicator & Availability Stats */}
      <div className="scheduler-header-bar">
        <div>
          <span className="scheduler-subheading">Date &amp; Time Scheduling</span>
          <h2 className="scheduler-title">
            {selectedDate
              ? fmtDate(selectedDate, { weekday: "long", month: "long", day: "numeric", year: "numeric" })
              : "Select Consultation Date"}
          </h2>
        </div>
        <div className="scheduler-stat-badge">
          <ClockIcon size={16} />
          <span>
            {loadingSlots ? "Refreshing slots…" : `${availableCount} open slot${availableCount === 1 ? "" : "s"} today`}
          </span>
        </div>
      </div>

      {error && (
        <div className="alert alert-error" role="alert" style={{ marginBottom: "1.25rem" }}>
          <AlertCircleIcon size={18} />
          <div>{error}</div>
        </div>
      )}

      {/* Main Two-Column Scheduling Interface */}
      <div className="scheduler-split">
        {/* Left Column: Interactive Monthly Calendar */}
        <div className="scheduler-cal-col">
          <div className="scheduler-section-header">
            <span className="step-badge">1</span>
            <h3>Select Date on Calendar</h3>
          </div>
          <AppointmentCalendar
            doctorId={doctor.id}
            selectedDate={selectedDate}
            onSelectDate={(newDate) => {
              setSelectedDate(newDate);
              setSelectedSlot(null);
            }}
            refreshKey={refreshKey}
          />
        </div>

        {/* Right Column: Time Slot & Clock Picker */}
        <div className="scheduler-time-col">
          <div className="scheduler-section-header" style={{ justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span className="step-badge">2</span>
              <h3>Choose Consultation Time</h3>
            </div>

            {/* Toggle View Mode: Slots vs Clock */}
            <div className="view-mode-toggle" role="group" aria-label="Time picker view mode">
              <button
                type="button"
                className={`view-mode-btn ${viewMode === "SLOTS" ? "active" : ""}`}
                onClick={() => setViewMode("SLOTS")}
                title="Grid slot view"
              >
                Slot View
              </button>
              <button
                type="button"
                className={`view-mode-btn ${viewMode === "CLOCK" ? "active" : ""}`}
                onClick={() => setViewMode("CLOCK")}
                title="Interactive 12h clock picker"
              >
                Clock View
              </button>
            </div>
          </div>

          {loadingSlots ? (
            <div className="scheduler-loading">
              <ClockIcon size={28} className="muted animate-spin" />
              <p className="muted">Fetching live schedule from doctor's clinic…</p>
            </div>
          ) : viewMode === "CLOCK" ? (
            <ClockPicker
              slots={slots}
              selectedSlot={selectedSlot}
              onSelectSlot={(slot) => setSelectedSlot(slot)}
            />
          ) : slots.length === 0 ? (
            <div className="empty" style={{ padding: "2.5rem 1.5rem" }}>
              <CalendarIcon size={36} className="muted" style={{ margin: "0 auto 0.75rem", display: "block" }} />
              <h4 style={{ margin: "0 0 0.35rem", color: "var(--navy)" }}>No Practice Sessions on this Date</h4>
              <p className="muted" style={{ fontSize: "0.85rem", maxWidth: "38ch", margin: "0 auto" }}>
                Dr. {doctor.fullName} is not scheduling appointments on {fmtDate(selectedDate)}. Please choose another date on the calendar.
              </p>
            </div>
          ) : availableCount === 0 ? (
            <div className="empty" style={{ padding: "2.5rem 1.5rem" }}>
              <AlertCircleIcon size={36} style={{ color: "var(--red)", margin: "0 auto 0.75rem", display: "block" }} />
              <h4 style={{ margin: "0 0 0.35rem", color: "var(--navy)" }}>All Consultation Slots Fully Booked</h4>
              <p className="muted" style={{ fontSize: "0.85rem", maxWidth: "38ch", margin: "0 auto" }}>
                Every appointment window for {fmtDate(selectedDate)} has been reserved. Please pick another date indicated in green on the calendar.
              </p>
            </div>
          ) : (
            <div className="slot-sessions-container">
              {/* Morning Session */}
              {morningSlots.length > 0 && (
                <div className="session-block">
                  <div className="session-title">
                    <span>🌅 Morning Session (09:00 AM – 12:00 PM)</span>
                    <span className="session-count">
                      {morningSlots.filter((s) => s.available && s.id !== excludeSlotId).length} free
                    </span>
                  </div>
                  <div className="session-grid">
                    {morningSlots.map(renderSlotButton)}
                  </div>
                </div>
              )}

              {/* Afternoon Session */}
              {afternoonSlots.length > 0 && (
                <div className="session-block">
                  <div className="session-title">
                    <span>☀️ Afternoon Session (12:00 PM – 04:00 PM)</span>
                    <span className="session-count">
                      {afternoonSlots.filter((s) => s.available && s.id !== excludeSlotId).length} free
                    </span>
                  </div>
                  <div className="session-grid">
                    {afternoonSlots.map(renderSlotButton)}
                  </div>
                </div>
              )}

              {/* Evening Session */}
              {eveningSlots.length > 0 && (
                <div className="session-block">
                  <div className="session-title">
                    <span>🌙 Evening Session (04:00 PM – 08:00 PM)</span>
                    <span className="session-count">
                      {eveningSlots.filter((s) => s.available && s.id !== excludeSlotId).length} free
                    </span>
                  </div>
                  <div className="session-grid">
                    {eveningSlots.map(renderSlotButton)}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Selected Appointment Confirmation Bar / Drawer */}
      {selectedSlot && (
        <div className="scheduler-summary-card">
          <div className="summary-left">
            <div className="summary-icon-circle">
              <CheckCircleIcon size={24} />
            </div>
            <div>
              <div className="summary-overline">SELECTED CONSULTATION TIME</div>
              <div className="summary-main-text">
                {fmtDate(selectedSlot.date, { weekday: "short", month: "short", day: "numeric" })} at {fmtTime(selectedSlot.startTime)} – {fmtTime(selectedSlot.endTime)}
              </div>
              <div className="summary-sub-text">
                With {doctor.fullName} · {doctor.specialization}
              </div>
            </div>
          </div>

          <div className="summary-right">
            <div className="summary-fee-block">
              <span className="fee-caption">Consultation Fee</span>
              <span className="fee-amount">{fmtFee(doctor.consultationFee)}</span>
            </div>
            <button
              type="button"
              className="btn btn-solid summary-cta-btn"
              onClick={() => setShowConfirmModal(true)}
            >
              <span>{isReschedule ? "Review & Confirm Reschedule" : "Proceed to Confirm"}</span>
              <span>→</span>
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && selectedSlot && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-content">
            <div className="modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <ShieldCheckIcon size={22} style={{ color: "var(--primary)" }} />
                <h3 style={{ margin: 0 }}>Review Appointment Summary</h3>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowConfirmModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              {/* Patient and Doctor Details */}
              <div className="confirm-overview-box">
                <div className="confirm-row">
                  <span className="confirm-label">Physician:</span>
                  <strong>{doctor.fullName} ({doctor.specialization})</strong>
                </div>
                <div className="confirm-row">
                  <span className="confirm-label">Date:</span>
                  <strong>{fmtDate(selectedSlot.date, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</strong>
                </div>
                <div className="confirm-row">
                  <span className="confirm-label">Time Window:</span>
                  <strong>{fmtTime(selectedSlot.startTime)} – {fmtTime(selectedSlot.endTime)} (30 mins)</strong>
                </div>
                <div className="confirm-row">
                  <span className="confirm-label">Clinic Location:</span>
                  <span>Suite 304, Careline Central Hospital, 100 Hospital Way</span>
                </div>
                {user && (
                  <div className="confirm-row">
                    <span className="confirm-label">Patient:</span>
                    <span>{user.fullName} ({user.email})</span>
                  </div>
                )}
              </div>

              {/* Consultation Reason input with quick chips */}
              <div className="field" style={{ margin: "1.25rem 0" }}>
                <label htmlFor="modalReason">Reason for Consultation (Optional)</label>
                <div className="reason-chips" style={{ marginBottom: "0.45rem" }}>
                  {QUICK_REASONS.map((r) => (
                    <button
                      key={r}
                      type="button"
                      className="reason-chip"
                      onClick={() => setReason(r)}
                    >
                      + {r}
                    </button>
                  ))}
                </div>
                <textarea
                  id="modalReason"
                  rows={2}
                  maxLength={500}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Primary symptoms or questions for the doctor..."
                />
              </div>

              {/* Fee Breakdown */}
              <div className="booking-summary-card" style={{ margin: "1rem 0" }}>
                <div className="booking-summary-row">
                  <span>Physician Consultation Fee:</span>
                  <strong>{fmtFee(doctor.consultationFee)}</strong>
                </div>
                <div className="booking-summary-row">
                  <span>Hospital Online Reservation Charge:</span>
                  <span style={{ color: "var(--green)", fontWeight: 700 }}>FREE (₹0)</span>
                </div>
                <div className="booking-summary-row booking-summary-total">
                  <span>Total Payable at Clinic Counter:</span>
                  <span>{fmtFee(doctor.consultationFee)}</span>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--muted)", fontSize: "0.8rem", marginBottom: "1rem" }}>
                <LockIcon size={14} /> Real-time slot locking active · Free cancellation up to consultation time
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowConfirmModal(false)}
                disabled={busy}
              >
                Back to Scheduling
              </button>
              <button
                type="button"
                className="btn btn-solid"
                disabled={busy}
                onClick={handleBookAppointment}
                style={{ padding: "0.75rem 1.5rem" }}
              >
                {busy
                  ? "Securing Appointment Slot…"
                  : isReschedule
                  ? "Confirm New Time Slot"
                  : `Confirm Appointment · ${fmtFee(doctor.consultationFee)}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Celebratory Booking Success Modal */}
      {confirmedBooking && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-content success-modal">
            <div className="success-header">
              <div className="success-icon-badge">
                <CheckCircleIcon size={36} />
              </div>
              <h2 style={{ margin: "0.5rem 0 0.25rem", color: "var(--navy)" }}>Appointment Confirmed!</h2>
              <p className="muted" style={{ margin: 0, fontSize: "0.925rem" }}>
                Your appointment has been registered and reserved in the hospital database.
              </p>
            </div>

            <div className="success-ref-card">
              <div className="success-ref-label">Official Booking Reference Number</div>
              <div className="success-ref-code">{confirmedBooking.referenceCode}</div>
              <button
                type="button"
                className="ref-pill"
                onClick={() => copyRefCode(confirmedBooking.referenceCode)}
                style={{ margin: "0.5rem auto 0" }}
              >
                <CopyIcon size={14} />
                <span>{copiedCode ? "Copied Reference Code!" : "Copy Reference Code"}</span>
              </button>
            </div>

            <dl className="facts" style={{ margin: "1.25rem 0" }}>
              <dt>Physician</dt>
              <dd>{doctor.fullName} ({doctor.specialization})</dd>

              <dt>Consultation Time</dt>
              <dd>
                {fmtDate(confirmedBooking.date, { weekday: "long", month: "short", day: "numeric", year: "numeric" })} at {fmtTime(confirmedBooking.startTime)}
              </dd>

              <dt>Clinic Location</dt>
              <dd>Suite 304, Careline Central Hospital</dd>

              <dt>Amount Payable</dt>
              <dd style={{ color: "var(--primary-dark)" }}>{fmtFee(doctor.consultationFee)}</dd>
            </dl>

            <div className="success-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => downloadAppointmentIcs(confirmedBooking)}
              >
                <DownloadIcon size={16} /> Add to Calendar (.ics)
              </button>

              <Link
                href={`/appointments/${confirmedBooking.id}`}
                className="btn btn-solid"
              >
                View Appointment &amp; Print Slip →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

