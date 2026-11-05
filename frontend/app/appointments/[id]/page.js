"use client";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import StatusBadge from "@/components/StatusBadge";
import { api } from "@/lib/api";
import { useRequireAuth } from "@/lib/auth";
import { fmtDate, fmtDateTime, fmtFee, fmtTime } from "@/lib/format";
import { downloadAppointmentIcs } from "@/lib/calendar";
import {
  ArrowLeftIcon,
  CalendarIcon,
  ClockIcon,
  PrinterIcon,
  DownloadIcon,
  CopyIcon,
  MapPinIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  ShieldCheckIcon,
  HeartPulseIcon,
} from "@/components/Icons";

function Detail() {
  const { id } = useParams();
  const search = useSearchParams();
  const { user, loading } = useRequireAuth();
  const [appt, setAppt] = useState(null);
  const [events, setEvents] = useState([]);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) return;
    Promise.all([api(`/appointments/${id}`), api(`/appointments/${id}/history`)])
      .then(([a, h]) => {
        setAppt(a);
        setEvents(h);
      })
      .catch((e) => setError(e.message));
  }, [user, id]);

  const copyRef = (code) => {
    navigator.clipboard?.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const getInitials = (name) => {
    if (!name) return "DR";
    const clean = name.replace(/^Dr\.\s*/i, "").trim();
    const parts = clean.split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return parts[0][0].toUpperCase();
  };

  if (loading || !user) {
    return <p className="muted">Authenticating patient account…</p>;
  }
  if (error) return <p className="alert alert-error">{error}</p>;
  if (!appt) return <p className="muted">Loading appointment details…</p>;

  // Stepper state calculation
  const isPending = appt.status === "PENDING";
  const isConfirmed = appt.status === "CONFIRMED";
  const isCompleted = appt.status === "COMPLETED";
  const isRejected = appt.status === "REJECTED";
  const isCancelled = appt.status === "CANCELLED";

  return (
    <>
      <Link href="/appointments" className="back-link">
        <ArrowLeftIcon size={16} /> Back to My Appointments
      </Link>

      {/* Success Notifications */}
      {search.get("booked") === "1" && (
        <div className="confirmation" role="status">
          <div style={{ color: "#059669" }}>
            <CheckCircleIcon size={28} />
          </div>
          <div>
            <strong>Appointment Request Registered! Reference: {appt.referenceCode}</strong>
            Your consultation request with {appt.doctor.fullName} on {fmtDate(appt.date)} at {fmtTime(appt.startTime)} has been submitted. The clinic has logged this reservation.
          </div>
        </div>
      )}

      {search.get("rescheduled") === "1" && (
        <div className="confirmation" role="status">
          <div style={{ color: "#059669" }}>
            <CheckCircleIcon size={28} />
          </div>
          <div>
            <strong>Appointment Rescheduled Successfully</strong>
            Your consultation has been moved to {fmtDate(appt.date)} at {fmtTime(appt.startTime)}.
          </div>
        </div>
      )}

      {/* Visual Status Stepper */}
      {!isCancelled && !isRejected && (
        <div className="card" style={{ padding: "1.25rem 1.5rem", marginBottom: "1.75rem" }}>
          <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--navy)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.75rem" }}>
            Appointment Progress
          </div>
          <div className="status-stepper">
            <div className="step-item done">
              <div className="step-circle">✓</div>
              <span className="step-title">Requested</span>
            </div>
            <div className={`step-item ${isConfirmed || isCompleted ? "done" : isPending ? "active" : ""}`}>
              <div className="step-circle">{isConfirmed || isCompleted ? "✓" : "2"}</div>
              <span className="step-title">{isConfirmed ? "Confirmed" : "Doctor Review"}</span>
            </div>
            <div className={`step-item ${isCompleted ? "done" : ""}`}>
              <div className="step-circle">{isCompleted ? "✓" : "3"}</div>
              <span className="step-title">Consultation</span>
            </div>
          </div>
        </div>
      )}

      <div className="split">
        {/* Printable Pass / Appointment Card */}
        <section className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid var(--line)", paddingBottom: "1rem", marginBottom: "1.25rem" }}>
            <div style={{ display: "flex", gap: "0.85rem", alignItems: "center" }}>
              <div className="doctor-avatar-circle" style={{ width: 50, height: 50, fontSize: "1.1rem" }}>
                {getInitials(appt.doctor.fullName)}
              </div>
              <div>
                <h1 style={{ fontSize: "1.5rem", margin: "0 0 0.2rem" }}>{appt.doctor.fullName}</h1>
                <span className="spec-badge">{appt.doctor.specialization}</span>
              </div>
            </div>
            <StatusBadge status={appt.status} />
          </div>

          <dl className="facts">
            <dt><CalendarIcon size={16} /> Date</dt>
            <dd>{fmtDate(appt.date, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</dd>

            <dt><ClockIcon size={16} /> Time Window</dt>
            <dd>{fmtTime(appt.startTime)} – {fmtTime(appt.endTime)} (30 min)</dd>

            <dt><MapPinIcon size={16} /> Hospital Clinic</dt>
            <dd>Suite 304, Careline Central Medical Center, 100 Hospital Way</dd>

            <dt>💵 Consultation Fee</dt>
            <dd style={{ color: "var(--primary-dark)", fontSize: "1.05rem" }}>
              {fmtFee(appt.doctor.consultationFee)} <span style={{ fontSize: "0.8rem", color: "var(--muted)", fontWeight: 400 }}>(Payable at clinic)</span>
            </dd>

            <dt>🔖 Booking Reference</dt>
            <dd>
              <button
                type="button"
                className="ref-pill"
                onClick={() => copyRef(appt.referenceCode)}
                title="Click to copy reference"
              >
                <CopyIcon size={13} />
                <span>{copied ? "Copied to clipboard!" : appt.referenceCode}</span>
              </button>
            </dd>

            {appt.reason && (
              <>
                <dt>📝 Reason for Visit</dt>
                <dd>{appt.reason}</dd>
              </>
            )}
          </dl>

          {appt.status === "REJECTED" && (
            <div className="callout callout-red">
              <strong style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                <AlertCircleIcon size={16} /> Appointment Declined
              </strong>
              <div>{appt.rejectionReason || "No specific reason provided by the clinic."}</div>
            </div>
          )}

          {appt.status === "CANCELLED" && (
            <div className="callout callout-gray">
              <strong>Appointment Cancelled.</strong> {appt.cancellationReason && `Reason: ${appt.cancellationReason}`}
            </div>
          )}

          {/* Action Toolbar */}
          <div className="actions" style={{ marginTop: "1.5rem", borderTop: "1px solid var(--line)", paddingTop: "1.25rem" }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => window.print()}
            >
              <PrinterIcon size={16} /> Print Consultation Slip
            </button>

            {appt.upcoming && appt.status !== "CANCELLED" && appt.status !== "REJECTED" && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => downloadAppointmentIcs(appt)}
              >
                <DownloadIcon size={16} /> Add to Calendar (.ics)
              </button>
            )}

            {appt.canModify && (
              <Link href={`/appointments/${appt.id}/reschedule`} className="btn btn-solid">
                Reschedule Slot
              </Link>
            )}

            {appt.status === "REJECTED" && (
              <Link href={`/doctors/${appt.doctor.id}`} className="btn btn-solid">
                Select Another Slot
              </Link>
            )}
          </div>
        </section>

        {/* Audit History Timeline */}
        <section className="card">
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            <ClockIcon size={20} style={{ color: "var(--primary)" }} />
            <h2 style={{ fontSize: "1.25rem", margin: 0 }}>Consultation Audit Log</h2>
          </div>
          <p className="muted" style={{ fontSize: "0.85rem", marginBottom: "1.25rem" }}>
            Official electronic log of all schedule changes, requests, and updates for this booking.
          </p>

          <ul className="timeline">
            {events.map((ev) => (
              <li key={ev.id} className={`act-${ev.action}`}>
                <div style={{ fontWeight: 700, color: "var(--navy)", fontSize: "0.95rem" }}>
                  {{ BOOKED: "Appointment Booked", RESCHEDULED: "Slot Rescheduled", CANCELLED: "Appointment Cancelled" }[ev.action] || ev.action}
                </div>
                {ev.action === "RESCHEDULED" && (
                  <div style={{ fontSize: "0.875rem", margin: "0.2rem 0" }}>
                    Moved from <strong style={{ color: "var(--amber)" }}>{ev.fromSlot}</strong> to <strong style={{ color: "var(--green)" }}>{ev.toSlot}</strong>
                  </div>
                )}
                {ev.action === "BOOKED" && (
                  <div style={{ fontSize: "0.875rem", margin: "0.2rem 0" }}>
                    Reserved time slot: <strong>{ev.toSlot}</strong>
                  </div>
                )}
                {ev.action === "CANCELLED" && (
                  <div style={{ fontSize: "0.875rem", margin: "0.2rem 0" }}>
                    Vacated slot: <strong>{ev.fromSlot}</strong>
                  </div>
                )}
                {ev.note && <div className="muted" style={{ fontSize: "0.85rem" }}>Note: {ev.note}</div>}
                <div className="when">{fmtDateTime(ev.createdAt)}</div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}

export default function AppointmentDetailPage() {
  return (
    <Suspense fallback={<p className="muted">Loading appointment details…</p>}>
      <Detail />
    </Suspense>
  );
}
