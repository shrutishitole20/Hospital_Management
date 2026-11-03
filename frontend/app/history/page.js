"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useRequireAuth } from "@/lib/auth";
import { fmtDateTime } from "@/lib/format";

const TITLES = { BOOKED: "Booked", RESCHEDULED: "Rescheduled", CANCELLED: "Cancelled" };

export default function HistoryPage() {
  const { user, loading } = useRequireAuth();
  const [events, setEvents] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) api("/appointments/history").then(setEvents).catch((e) => { setError(e.message); setEvents([]); });
  }, [user]);

  if (loading || !user) return <p className="muted">Loading…</p>;

  return (
    <>
      <h1>Appointment history</h1>
      <p className="muted">Every booking, reschedule and cancellation on your account.</p>
      {error && <p className="alert alert-error">{error}</p>}
      {events === null ? <p className="muted">Loading…</p> : events.length === 0 ? (
        <p className="empty">Nothing here yet. <Link href="/">Book your first appointment.</Link></p>
      ) : (
        <section className="card">
          <ul className="timeline">
            {events.map((ev) => (
              <li key={ev.id} className={`act-${ev.action}`}>
                <strong>{TITLES[ev.action]}</strong> with {ev.doctorName}
                {ev.action === "RESCHEDULED" && <div>From {ev.fromSlot} to {ev.toSlot}</div>}
                {ev.action === "BOOKED" && <div>For {ev.toSlot}</div>}
                {ev.action === "CANCELLED" && <div>Was {ev.fromSlot}</div>}
                {ev.note && <div className="muted">{ev.note}</div>}
                <div className="when">
                  {fmtDateTime(ev.createdAt)} · <Link href={`/appointments/${ev.appointmentId}`}>{ev.referenceCode}</Link>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
