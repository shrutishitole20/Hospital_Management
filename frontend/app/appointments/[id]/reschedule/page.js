"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import AppointmentScheduler from "@/components/AppointmentScheduler";
import { api } from "@/lib/api";
import { useRequireAuth } from "@/lib/auth";
import { fmtDate, fmtTime } from "@/lib/format";
import {
  ArrowLeftIcon,
  CalendarIcon,
  ClockIcon,
  AlertCircleIcon,
} from "@/components/Icons";

export default function ReschedulePage() {
  const { id } = useParams();
  const { user, loading } = useRequireAuth();
  const [appt, setAppt] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      api(`/appointments/${id}`)
        .then(setAppt)
        .catch((e) => setError(e.message));
    }
  }, [user, id]);

  if (loading || !user) return <p className="muted">Authenticating patient account…</p>;
  if (!appt) return error ? <p className="alert alert-error">{error}</p> : <p className="muted">Loading appointment…</p>;
  if (!appt.canModify) {
    return (
      <div className="card" style={{ maxWidth: "600px", margin: "2rem auto", textAlign: "center" }}>
        <AlertCircleIcon size={36} style={{ color: "var(--red)", margin: "0 auto 0.75rem", display: "block" }} />
        <h2>Appointment Cannot Be Rescheduled</h2>
        <p className="muted" style={{ marginBottom: "1.5rem" }}>
          This consultation has either already passed, been completed, or was previously cancelled/rejected.
        </p>
        <Link href="/appointments" className="btn btn-solid">
          Back to Appointments
        </Link>
      </div>
    );
  }

  return (
    <>
      <Link href={`/appointments/${id}`} className="back-link">
        <ArrowLeftIcon size={16} /> Back to Appointment
      </Link>

      <div style={{ marginBottom: "1.5rem" }}>
        <h1>Reschedule Appointment</h1>
        <p className="muted">
          Change your scheduled consultation with <strong>{appt.doctor.fullName}</strong> ({appt.doctor.specialization}).
        </p>
      </div>

      {/* Current Appointment Banner */}
      <div style={{ background: "var(--paper)", border: "1.5px solid var(--line)", borderRadius: "12px", padding: "1.15rem 1.5rem", marginBottom: "1.75rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted)", fontWeight: 700 }}>
            Current Scheduled Slot
          </div>
          <div style={{ font: "700 1.2rem var(--font-head)", color: "var(--navy)", marginTop: "0.25rem" }}>
            {fmtDate(appt.date, { weekday: "long", month: "short", day: "numeric" })} at {fmtTime(appt.startTime)} – {fmtTime(appt.endTime)}
          </div>
          <span className="muted" style={{ fontSize: "0.85rem" }}>Booking Reference: <strong>{appt.referenceCode}</strong></span>
        </div>
        <div style={{ background: "var(--primary-light)", color: "var(--primary-dark)", padding: "0.45rem 0.85rem", borderRadius: "8px", fontSize: "0.85rem", fontWeight: 600 }}>
          Pick a new time below to move your slot
        </div>
      </div>

      {error && <p className="alert alert-error" role="alert">{error}</p>}

      <section className="card" style={{ padding: "1.75rem" }}>
        <AppointmentScheduler
          doctor={appt.doctor}
          user={user}
          excludeSlotId={appt.slotId}
          isReschedule={true}
          currentAppointment={appt}
        />
      </section>
    </>
  );
}
