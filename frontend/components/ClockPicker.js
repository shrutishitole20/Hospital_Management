"use client";
import { useState, useMemo, useEffect } from "react";
import { fmtTime } from "@/lib/format";
import { ClockIcon, CheckCircleIcon, AlertCircleIcon } from "./Icons";

/**
 * Clock-style interactive time picker that maps user 12-hour selections to doctor's active slots.
 */
export default function ClockPicker({ slots = [], selectedSlot, onSelectSlot }) {
  // Parse currently selected slot or default to first available slot
  const initialTimeState = useMemo(() => {
    if (selectedSlot?.startTime) {
      const [hStr, mStr] = selectedSlot.startTime.split(":");
      let h = parseInt(hStr, 10);
      const isPm = h >= 12;
      if (h === 0) h = 12;
      else if (h > 12) h -= 12;
      return { hour: h, minute: mStr.slice(0, 2), period: isPm ? "PM" : "AM" };
    }
    // Default to first available slot or 9:00 AM
    const firstAvail = slots.find((s) => s.available);
    if (firstAvail) {
      const [hStr, mStr] = firstAvail.startTime.split(":");
      let h = parseInt(hStr, 10);
      const isPm = h >= 12;
      if (h === 0) h = 12;
      else if (h > 12) h -= 12;
      return { hour: h, minute: mStr.slice(0, 2), period: isPm ? "PM" : "AM" };
    }
    return { hour: 9, minute: "00", period: "AM" };
  }, [selectedSlot, slots]);

  const [selectedHour, setSelectedHour] = useState(initialTimeState.hour);
  const [selectedMinute, setSelectedMinute] = useState(initialTimeState.minute);
  const [selectedPeriod, setSelectedPeriod] = useState(initialTimeState.period);

  useEffect(() => {
    setSelectedHour(initialTimeState.hour);
    setSelectedMinute(initialTimeState.minute);
    setSelectedPeriod(initialTimeState.period);
  }, [initialTimeState]);

  // Convert 12h + AM/PM back to 24h string "HH:MM:00"
  const current24HourTime = useMemo(() => {
    let h = selectedHour;
    if (selectedPeriod === "PM" && h < 12) h += 12;
    if (selectedPeriod === "AM" && h === 12) h = 0;
    return `${String(h).padStart(2, "0")}:${selectedMinute}:00`;
  }, [selectedHour, selectedMinute, selectedPeriod]);

  // Match current clock selection to doctor's actual slots
  const matchingSlot = useMemo(() => {
    return slots.find((s) => s.startTime.startsWith(current24HourTime.slice(0, 5)));
  }, [slots, current24HourTime]);

  // Find nearest available slot if current is booked or unavailable
  const nearestAvailableSlot = useMemo(() => {
    if (matchingSlot && matchingSlot.available) return null;
    const avail = slots.filter((s) => s.available);
    if (avail.length === 0) return null;
    // Find slot with minimum time distance
    return avail.reduce((prev, curr) => {
      const prevDiff = Math.abs(curr.startTime.localeCompare(current24HourTime));
      const currDiff = Math.abs(prev.startTime.localeCompare(current24HourTime));
      return prevDiff < currDiff ? curr : prev;
    }, avail[0]);
  }, [slots, matchingSlot, current24HourTime]);

  const handleTimeChange = (newHour, newMinute, newPeriod) => {
    const h = newHour ?? selectedHour;
    const m = newMinute ?? selectedMinute;
    const p = newPeriod ?? selectedPeriod;
    setSelectedHour(h);
    setSelectedMinute(m);
    setSelectedPeriod(p);

    let h24 = h;
    if (p === "PM" && h24 < 12) h24 += 12;
    if (p === "AM" && h24 === 12) h24 = 0;
    const timeStr = `${String(h24).padStart(2, "0")}:${m}:00`;

    const found = slots.find((s) => s.startTime.startsWith(timeStr.slice(0, 5)));
    if (found && found.available) {
      onSelectSlot(found);
    }
  };

  const hoursList = [9, 10, 11, 12, 1, 2, 3, 4, 5, 6, 7];
  const minutesList = ["00", "30"];

  return (
    <div className="clock-picker-card">
      <div className="clock-header">
        <div className="clock-header-title">
          <ClockIcon size={18} /> Interactive Clock Time Selector
        </div>
        <span className="clock-format-tag">12-Hour System</span>
      </div>

      {/* Clock Digital Display & AM/PM Toggle */}
      <div className="clock-display-wrap">
        <div className="clock-digital-box">
          <span className="clock-digit">{String(selectedHour).padStart(2, "0")}</span>
          <span className="clock-colon">:</span>
          <span className="clock-digit">{selectedMinute}</span>
        </div>

        <div className="clock-period-toggle">
          <button
            type="button"
            className={`clock-period-btn ${selectedPeriod === "AM" ? "active" : ""}`}
            onClick={() => handleTimeChange(null, null, "AM")}
          >
            AM
          </button>
          <button
            type="button"
            className={`clock-period-btn ${selectedPeriod === "PM" ? "active" : ""}`}
            onClick={() => handleTimeChange(null, null, "PM")}
          >
            PM
          </button>
        </div>
      </div>

      {/* Hours Selector */}
      <div className="clock-selector-section">
        <div className="clock-section-label">Select Hour:</div>
        <div className="clock-pill-grid">
          {hoursList.map((h) => {
            const isSelected = selectedHour === h;
            return (
              <button
                key={h}
                type="button"
                className={`clock-pill-btn ${isSelected ? "selected" : ""}`}
                onClick={() => handleTimeChange(h, null, null)}
              >
                {h}
              </button>
            );
          })}
        </div>
      </div>

      {/* Minutes Selector */}
      <div className="clock-selector-section">
        <div className="clock-section-label">Select Minute Interval:</div>
        <div className="clock-pill-grid clock-min-grid">
          {minutesList.map((m) => {
            const isSelected = selectedMinute === m;
            return (
              <button
                key={m}
                type="button"
                className={`clock-pill-btn ${isSelected ? "selected" : ""}`}
                onClick={() => handleTimeChange(null, m, null)}
              >
                :{m}
              </button>
            );
          })}
        </div>
      </div>

      {/* Slot Availability Feedback Box */}
      <div className="clock-feedback-box">
        {matchingSlot ? (
          matchingSlot.available ? (
            <div className="clock-status-available">
              <CheckCircleIcon size={18} />
              <div>
                <strong>{fmtTime(matchingSlot.startTime)} is Available</strong>
                <div style={{ fontSize: "0.8rem", color: "var(--green)" }}>
                  Slot verified on doctor schedule. Ready to book!
                </div>
              </div>
            </div>
          ) : (
            <div className="clock-status-booked">
              <AlertCircleIcon size={18} />
              <div>
                <strong>{fmtTime(matchingSlot.startTime)} is Already Booked</strong>
                <div style={{ fontSize: "0.8rem" }}>
                  Another patient holds this consultation slot.
                </div>
                {nearestAvailableSlot && (
                  <button
                    type="button"
                    className="clock-jump-btn"
                    onClick={() => {
                      onSelectSlot(nearestAvailableSlot);
                    }}
                  >
                    Select Nearest Open Slot ({fmtTime(nearestAvailableSlot.startTime)}) →
                  </button>
                )}
              </div>
            </div>
          )
        ) : (
          <div className="clock-status-unavailable">
            <AlertCircleIcon size={18} />
            <div>
              <strong>Outside Doctor's Practice Hours</strong>
              <div style={{ fontSize: "0.8rem" }}>
                Dr. sees patients 09:00 AM – 12:00 PM and 12:30 PM – 07:30 PM.
              </div>
              {nearestAvailableSlot && (
                <button
                  type="button"
                  className="clock-jump-btn"
                  onClick={() => onSelectSlot(nearestAvailableSlot)}
                >
                  Choose Available Slot ({fmtTime(nearestAvailableSlot.startTime)}) →
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

