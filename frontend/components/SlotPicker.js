"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { fmtDate, fmtTime } from "@/lib/format";
import { ClockIcon, CalendarIcon } from "./Icons";

/** Shows the dates a doctor has free, then that date's published slots grouped by session. */
export default function SlotPicker({
  doctorId,
  selectedSlotId,
  onSelect,
  excludeSlotId,
  refreshKey = 0,
}) {
  const [dates, setDates] = useState(null);
  const [date, setDate] = useState(null);
  const [slots, setSlots] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setDates(null);
    api(`/doctors/${doctorId}/dates`)
      .then((d) => {
        setDates(d);
        setDate((cur) => (cur && d.includes(cur) ? cur : d[0] || null));
      })
      .catch((e) => setError(e.message));
  }, [doctorId, refreshKey]);

  useEffect(() => {
    if (!date) {
      setSlots([]);
      return;
    }
    setSlots(null);
    api(`/doctors/${doctorId}/slots?date=${date}`)
      .then(setSlots)
      .catch((e) => setError(e.message));
  }, [doctorId, date, refreshKey]);

  if (error) return <p className="alert alert-error">{error}</p>;
  if (!dates) {
    return (
      <div className="empty" style={{ padding: "1.5rem" }}>
        <ClockIcon size={24} className="muted" style={{ margin: "0 auto 0.5rem", display: "block" }} />
        <p className="muted">Checking available dates on doctor schedule…</p>
      </div>
    );
  }
  if (dates.length === 0) {
    return (
      <div className="empty">
        <CalendarIcon size={28} className="muted" style={{ margin: "0 auto 0.5rem", display: "block" }} />
        <p style={{ fontWeight: 600, color: "var(--navy)" }}>No open slots in the next 14 days</p>
        <p className="muted" style={{ fontSize: "0.85rem" }}>
          This doctor's schedule is fully booked or pending updates. Please check back soon or consult another specialist.
        </p>
      </div>
    );
  }

  // Filter slots into Morning (before 12:00) and Afternoon (12:00 and after)
  const morningSlots = (slots || []).filter((s) => s.startTime < "12:00:00");
  const afternoonSlots = (slots || []).filter((s) => s.startTime >= "12:00:00");
  const availableCount = (slots || []).filter((s) => s.available && s.id !== excludeSlotId).length;

  const renderSlotButton = (s) => {
    const disabled = !s.available || s.id === excludeSlotId;
    const isSelected = selectedSlotId === s.id;
    const title = s.id === excludeSlotId
      ? "Your current appointment slot"
      : !s.available
      ? "Already booked by another patient"
      : "Click to select this slot";

    return (
      <button
        key={s.id}
        type="button"
        disabled={disabled}
        className={`slot ${isSelected ? "on" : ""}`}
        aria-pressed={isSelected}
        title={title}
        onClick={() => onSelect(s)}
      >
        <ClockIcon size={13} />
        <span>{fmtTime(s.startTime)}</span>
      </button>
    );
  };

  return (
    <div className="slot-picker-wrap">
      {/* Date selector header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
        <span className="slot-section-title" style={{ margin: 0 }}>
          <CalendarIcon size={16} /> Select Date:
        </span>
        {date && (
          <span style={{ fontSize: "0.825rem", color: "var(--primary-dark)", fontWeight: 600 }}>
            {fmtDate(date, { weekday: "long", month: "short", day: "numeric" })}
          </span>
        )}
      </div>

      <div className="date-row" role="tablist" aria-label="Available dates">
        {dates.map((d) => (
          <button
            key={d}
            type="button"
            role="tab"
            aria-selected={d === date}
            className={`date-chip ${d === date ? "on" : ""}`}
            onClick={() => setDate(d)}
          >
            <span className="dow">{fmtDate(d, { weekday: "short" })}</span>
            <span className="dom">{fmtDate(d, { day: "numeric" })}</span>
            <span className="mon">{fmtDate(d, { month: "short" })}</span>
          </button>
        ))}
      </div>

      {/* Slots Status / Counter */}
      {slots !== null && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "0.75rem 0 1rem", fontSize: "0.85rem" }}>
          <span style={{ color: "var(--muted)" }}>
            <strong>{availableCount}</strong> open slot{availableCount === 1 ? "" : "s"} on this date
          </span>
          <div style={{ display: "flex", gap: "0.85rem", fontSize: "0.775rem", color: "var(--muted)" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#0284c7" }}></span> Available
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#94a3b8" }}></span> Booked
            </span>
          </div>
        </div>
      )}

      {/* Slot Grids */}
      {slots === null ? (
        <p className="muted" style={{ padding: "1rem 0", fontSize: "0.9rem" }}>
          Loading available consultation times…
        </p>
      ) : slots.length === 0 ? (
        <p className="empty" style={{ padding: "1.25rem" }}>
          No consultation slots published for this date.
        </p>
      ) : (
        <>
          {morningSlots.length > 0 && (
            <div style={{ marginBottom: "1rem" }}>
              <div className="slot-section-title">
                🌅 Morning Consultation (09:00 AM – 12:00 PM)
              </div>
              <div className="slot-grid">
                {morningSlots.map(renderSlotButton)}
              </div>
            </div>
          )}

          {afternoonSlots.length > 0 && (
            <div>
              <div className="slot-section-title">
                🌇 Afternoon Consultation (02:00 PM – 05:00 PM)
              </div>
              <div className="slot-grid">
                {afternoonSlots.map(renderSlotButton)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
