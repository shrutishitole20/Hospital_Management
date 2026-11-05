"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useRequireAuth } from "@/lib/auth";
import { fmtDateTime } from "@/lib/format";
import {
  ClockIcon,
  CalendarIcon,
  SearchIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  ArrowRightIcon,
} from "@/components/Icons";

const TITLES = {
  BOOKED: "Appointment Booked",
  RESCHEDULED: "Slot Rescheduled",
  CANCELLED: "Appointment Cancelled",
};

export default function HistoryPage() {
  const { user, loading } = useRequireAuth();
  const [events, setEvents] = useState(null);
  const [error, setError] = useState("");
  const [filterAction, setFilterAction] = useState("ALL");
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (user) {
      api("/appointments/history")
        .then(setEvents)
        .catch((e) => {
          setError(e.message);
          setEvents([]);
        });
    }
  }, [user]);

  if (loading || !user) return <p className="muted">Authenticating patient account…</p>;

  const filtered = (events || []).filter((ev) => {
    if (filterAction !== "ALL" && ev.action !== filterAction) return false;
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      ev.doctorName?.toLowerCase().includes(q) ||
      ev.referenceCode?.toLowerCase().includes(q) ||
      (ev.note && ev.note.toLowerCase().includes(q))
    );
  });

  return (
    <>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1>Patient Activity &amp; History</h1>
        <p className="muted">
          Complete chronological record of all consultations booked, modified, or cancelled on your Careline account.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="history-filter-bar" style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center", marginBottom: "1.5rem" }}>
        <div className="chips" style={{ margin: 0 }}>
          <button
            type="button"
            className={`chip ${filterAction === "ALL" ? "on" : ""}`}
            onClick={() => setFilterAction("ALL")}
          >
            All Activity
          </button>
          <button
            type="button"
            className={`chip ${filterAction === "BOOKED" ? "on" : ""}`}
            onClick={() => setFilterAction("BOOKED")}
          >
            Bookings
          </button>
          <button
            type="button"
            className={`chip ${filterAction === "RESCHEDULED" ? "on" : ""}`}
            onClick={() => setFilterAction("RESCHEDULED")}
          >
            Reschedules
          </button>
          <button
            type="button"
            className={`chip ${filterAction === "CANCELLED" ? "on" : ""}`}
            onClick={() => setFilterAction("CANCELLED")}
          >
            Cancellations
          </button>
        </div>

        {events && events.length > 0 && (
          <div className="history-search-col" style={{ flex: 1, minWidth: "240px", maxWidth: "380px", marginLeft: "auto" }}>
            <div className="search-box" style={{ background: "#ffffff", border: "1px solid var(--line)", borderRadius: "8px", padding: "0.45rem 0.75rem" }}>
              <SearchIcon size={16} className="muted" />
              <input
                type="search"
                placeholder="Search history by doctor or ref code..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{ border: "none", fontSize: "0.875rem", outline: "none", width: "100%", background: "transparent" }}
              />
            </div>
          </div>
        )}
      </div>

      {error && <p className="alert alert-error">{error}</p>}

      {events === null ? (
        <div className="empty" style={{ padding: "2.5rem" }}>
          <ClockIcon size={32} className="muted" style={{ margin: "0 auto 0.75rem", display: "block" }} />
          <p className="muted">Loading activity log…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty">
          <CalendarIcon size={36} className="muted" style={{ margin: "0 auto 0.75rem", display: "block" }} />
          <h3 style={{ marginBottom: "0.35rem" }}>No activity matching your filter</h3>
          <p className="muted" style={{ maxWidth: "45ch", margin: "0 auto 1.25rem" }}>
            {query ? "Try clearing your search terms." : "You have not recorded any appointments yet."}
          </p>
          <Link href="/" className="btn btn-solid">
            Find a Doctor
          </Link>
        </div>
      ) : (
        <section className="card">
          <ul className="timeline">
            {filtered.map((ev) => (
              <li key={ev.id} className={`act-${ev.action}`}>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
                  <span style={{ font: "700 1.05rem var(--font-head)", color: "var(--navy)" }}>
                    {TITLES[ev.action] || ev.action} with {ev.doctorName}
                  </span>
                  <Link href={`/appointments/${ev.appointmentId}`} className="ref-pill">
                    {ev.referenceCode} →
                  </Link>
                </div>

                {ev.action === "RESCHEDULED" && (
                  <div style={{ fontSize: "0.9rem", margin: "0.35rem 0" }}>
                    Rescheduled from <strong style={{ color: "var(--amber)" }}>{ev.fromSlot}</strong> to <strong style={{ color: "var(--green)" }}>{ev.toSlot}</strong>
                  </div>
                )}
                {ev.action === "BOOKED" && (
                  <div style={{ fontSize: "0.9rem", margin: "0.35rem 0" }}>
                    Booked for <strong>{ev.toSlot}</strong>
                  </div>
                )}
                {ev.action === "CANCELLED" && (
                  <div style={{ fontSize: "0.9rem", margin: "0.35rem 0" }}>
                    Cancelled slot was <strong>{ev.fromSlot}</strong>
                  </div>
                )}

                {ev.note && (
                  <div style={{ background: "var(--mist)", border: "1px solid var(--line)", borderRadius: "6px", padding: "0.45rem 0.65rem", fontSize: "0.85rem", color: "var(--ink-secondary)", margin: "0.35rem 0" }}>
                    {ev.note}
                  </div>
                )}

                <div className="when">{fmtDateTime(ev.createdAt)}</div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
