"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { fmtDate, fmtTime } from "@/lib/format";

/** Shows the dates a doctor has free, then that date's published slots. */
export default function SlotPicker({ doctorId, selectedSlotId, onSelect, excludeSlotId, refreshKey = 0 }) {
  const [dates, setDates] = useState(null);
  const [date, setDate] = useState(null);
  const [slots, setSlots] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setDates(null);
    api(`/doctors/${doctorId}/dates`)
      .then((d) => { setDates(d); setDate((cur) => (cur && d.includes(cur) ? cur : d[0] || null)); })
      .catch((e) => setError(e.message));
  }, [doctorId, refreshKey]);

  useEffect(() => {
    if (!date) { setSlots([]); return; }
    setSlots(null);
    api(`/doctors/${doctorId}/slots?date=${date}`)
      .then(setSlots)
      .catch((e) => setError(e.message));
  }, [doctorId, date, refreshKey]);

  if (error) return <p className="alert alert-error">{error}</p>;
  if (!dates) return <p className="muted">Loading available dates…</p>;
  if (dates.length === 0)
    return <p className="empty">No free slots in the next 30 days. Check back soon or try another doctor.</p>;

  return (
    <div className="slot-picker">
      <div className="date-row" role="tablist" aria-label="Available dates">
        {dates.map((d) => (
          <button key={d} role="tab" aria-selected={d === date}
            className={`date-chip ${d === date ? "on" : ""}`} onClick={() => setDate(d)}>
            <span className="dow">{fmtDate(d, { weekday: "short" })}</span>
            <span className="dom">{fmtDate(d, { day: "numeric" })}</span>
            <span className="mon">{fmtDate(d, { month: "short" })}</span>
          </button>
        ))}
      </div>
      {slots === null ? (
        <p className="muted">Loading times…</p>
      ) : (
        <div className="slot-grid">
          {slots.map((s) => {
            const disabled = !s.available || s.id === excludeSlotId;
            return (
              <button key={s.id} disabled={disabled}
                className={`slot ${selectedSlotId === s.id ? "on" : ""}`}
                aria-pressed={selectedSlotId === s.id}
                title={s.id === excludeSlotId ? "Your current time" : !s.available ? "Already booked" : ""}
                onClick={() => onSelect(s)}>
                {fmtTime(s.startTime)}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
