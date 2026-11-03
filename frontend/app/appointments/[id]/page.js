"use client";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import StatusBadge from "@/components/StatusBadge";
import { api } from "@/lib/api";
import { useRequireAuth } from "@/lib/auth";
import { fmtDate, fmtDateTime, fmtFee, fmtTime } from "@/lib/format";

function Detail() {
  const { id } = useParams();
  const search = useSearchParams();
  const { user, loading } = useRequireAuth();
  const [appt, setAppt] = useState(null);
  const [events, setEvents] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    Promise.all([api(`/appointments/${id}`), api(`/appointments/${id}/history`)])
      .then(([a, h]) => { setAppt(a); setEvents(h); })
      .catch((e) => setError(e.message));
  }, [user, id]);

  if (loading || !user) return <p className="muted">Loading…</p>;
  if (error) return <p className="alert alert-error">{error}</p>;
  if (!appt) return <p className="muted">Loading appointment…</p>;

  return (
    <>
      <Link href="/appointments" className="back">← My appointments</Link>
      {search.get("booked") === "1" && (
        <div className="confirmation" role="status">
          <strong>Booking confirmed. Your reference is {appt.referenceCode}</strong>
          We have recorded your appointment with {appt.doctor.fullName} on {fmtDate(appt.date)} at {fmtTime(appt.startTime)}.
          It will show as confirmed once the doctor approves it.
        </div>
      )}
      {search.get("rescheduled") === "1" && (
        <div className="confirmation" role="status">
          <strong>Appointment rescheduled</strong>
          Your new time is {fmtDate(appt.date)} at {fmtTime(appt.startTime)}. The doctor will confirm it again.
        </div>
      )}
      <div className="split">
        <section className="card appt">
          <div className="appt-top">
            <h1 style={{ fontSize: "1.7rem", margin: 0 }}>{appt.doctor.fullName}</h1>
            <StatusBadge status={appt.status} />
          </div>
          <div className="spec">{appt.doctor.specialization}</div>
          <dl className="facts">
            <dt>Date</dt><dd>{fmtDate(appt.date)}</dd>
            <dt>Time</dt><dd>{fmtTime(appt.startTime)} to {fmtTime(appt.endTime)}</dd>
            <dt>Fee</dt><dd>{fmtFee(appt.doctor.consultationFee)}</dd>
            <dt>Reference</dt><dd>{appt.referenceCode}</dd>
            {appt.reason && (<><dt>Reason</dt><dd>{appt.reason}</dd></>)}
          </dl>
          {appt.status === "REJECTED" && (
            <div className="callout callout-red"><strong>Rejected.</strong> {appt.rejectionReason || "No reason was given."}</div>
          )}
          {appt.status === "CANCELLED" && (
            <div className="callout callout-gray">Cancelled{appt.cancellationReason ? `: ${appt.cancellationReason}` : "."}</div>
          )}
          {appt.canModify && (
            <div className="actions">
              <Link href={`/appointments/${appt.id}/reschedule`} className="btn">Reschedule</Link>
            </div>
          )}
          {appt.status === "REJECTED" && (
            <div className="actions"><Link href={`/doctors/${appt.doctor.id}`} className="btn btn-solid">Book another time</Link></div>
          )}
        </section>

        <section className="card">
          <h2>Appointment history</h2>
          <ul className="timeline">
            {events.map((ev) => (
              <li key={ev.id} className={`act-${ev.action}`}>
                <strong>{{ BOOKED: "Booked", RESCHEDULED: "Rescheduled", CANCELLED: "Cancelled" }[ev.action]}</strong>
                {ev.action === "RESCHEDULED" && <div>From {ev.fromSlot} to {ev.toSlot}</div>}
                {ev.action === "BOOKED" && <div>For {ev.toSlot}</div>}
                {ev.action === "CANCELLED" && <div>Was {ev.fromSlot}</div>}
                {ev.note && <div className="muted">{ev.note}</div>}
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
  return <Suspense fallback={null}><Detail /></Suspense>;
}
