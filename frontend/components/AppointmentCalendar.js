"use client";
import { useEffect, useState, useMemo } from "react";
import { api } from "@/lib/api";
import { fmtDate } from "@/lib/format";
import { CalendarIcon, ClockIcon } from "./Icons";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function AppointmentCalendar({
  doctorId,
  selectedDate,
  onSelectDate,
  refreshKey = 0,
}) {
  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => {
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }, [today]);

  // Calendar view state (year and month 0-indexed)
  const [viewYear, setViewYear] = useState(() => {
    if (selectedDate) return parseInt(selectedDate.split("-")[0]);
    return today.getFullYear();
  });
  const [viewMonth, setViewMonth] = useState(() => {
    if (selectedDate) return parseInt(selectedDate.split("-")[1]) - 1;
    return today.getMonth();
  });

  const [availability, setAvailability] = useState({});
  const [loading, setLoading] = useState(false);

  const monthParam = useMemo(() => {
    const mStr = String(viewMonth + 1).padStart(2, "0");
    return `${viewYear}-${mStr}`;
  }, [viewYear, viewMonth]);

  // Fetch month availability
  useEffect(() => {
    let active = true;
    setLoading(true);
    api(`/doctors/${doctorId}/availability?month=${monthParam}`)
      .then((res) => {
        if (!active) return;
        const map = {};
        if (res && res.days) {
          for (const d of res.days) {
            map[d.date] = d;
          }
        }
        setAvailability(map);
      })
      .catch(() => {
        // Fallback: continue gracefully even if availability endpoint is starting up
        if (active) setAvailability({});
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [doctorId, monthParam, refreshKey]);

  // Navigate months
  const goToPrevMonth = () => {
    if (viewYear === today.getFullYear() && viewMonth <= today.getMonth()) {
      return; // Cannot navigate to months entirely in the past
    }
    if (viewMonth === 0) {
      setViewYear(viewYear - 1);
      setViewMonth(11);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const goToNextMonth = () => {
    // Limit to next 12 months for practical healthcare scheduling
    const maxYear = today.getFullYear() + 1;
    if (viewYear > maxYear) return;
    if (viewMonth === 11) {
      setViewYear(viewYear + 1);
      setViewMonth(0);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const goToToday = () => {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    onSelectDate(todayStr);
  };

  const canGoPrev = !(viewYear === today.getFullYear() && viewMonth <= today.getMonth());

  // Generate calendar days
  const calendarCells = useMemo(() => {
    const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sun
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const cells = [];

    // Leading days from previous month
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      cells.push({
        type: "prev-month",
        dayNum: daysInPrevMonth - i,
        dateStr: null,
        isSelectable: false,
      });
    }

    // Days of current month
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const isPast = dateStr < todayStr;
      const isToday = dateStr === todayStr;
      const dayAvail = availability[dateStr];
      const isUnavailable = dayAvail?.status === "UNAVAILABLE";
      const isFullyBooked = dayAvail?.status === "FULLY_BOOKED";

      // Allow selecting if not past and not closed/unavailable
      const isSelectable = !isPast && !isUnavailable;

      cells.push({
        type: "current-month",
        dayNum: d,
        dateStr,
        isPast,
        isToday,
        isSelectable,
        status: dayAvail?.status || (isPast ? "PAST" : "AVAILABLE"),
        availableSlots: dayAvail?.availableSlots ?? null,
        totalSlots: dayAvail?.totalSlots ?? null,
      });
    }

    // Trailing days to round up to complete weeks (multiple of 7)
    const totalCurrentCells = cells.length;
    const remaining = (7 - (totalCurrentCells % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      cells.push({
        type: "next-month",
        dayNum: i,
        dateStr: null,
        isSelectable: false,
      });
    }

    return cells;
  }, [viewYear, viewMonth, todayStr, availability]);

  const yearOptions = useMemo(() => {
    const cur = today.getFullYear();
    return [cur, cur + 1, cur + 2];
  }, [today]);

  return (
    <div className="cal-container">
      {/* Calendar Header with Navigation and Quick Select */}
      <div className="cal-header">
        <div className="cal-title-group">
          <div className="cal-selectors">
            <select
              className="cal-select"
              value={viewMonth}
              onChange={(e) => setViewMonth(parseInt(e.target.value))}
              aria-label="Select month"
            >
              {MONTH_NAMES.map((name, idx) => {
                const isPastMonth = viewYear === today.getFullYear() && idx < today.getMonth();
                return (
                  <option key={name} value={idx} disabled={isPastMonth}>
                    {name}
                  </option>
                );
              })}
            </select>

            <select
              className="cal-select"
              value={viewYear}
              onChange={(e) => setViewYear(parseInt(e.target.value))}
              aria-label="Select year"
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="cal-nav-buttons">
          <button
            type="button"
            className="cal-today-btn"
            onClick={goToToday}
            title="Jump to today"
          >
            Today
          </button>
          <button
            type="button"
            className="cal-nav-btn"
            onClick={goToPrevMonth}
            disabled={!canGoPrev}
            aria-label="Previous month"
          >
            ‹
          </button>
          <button
            type="button"
            className="cal-nav-btn"
            onClick={goToNextMonth}
            aria-label="Next month"
          >
            ›
          </button>
        </div>
      </div>

      {/* Days of Week Header */}
      <div className="cal-weekdays">
        {DAYS_OF_WEEK.map((d) => (
          <div key={d} className={`cal-weekday ${d === "Sun" ? "cal-weekend" : ""}`}>
            {d}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="cal-grid" role="grid" aria-label="Appointment Calendar">
        {calendarCells.map((cell, idx) => {
          if (cell.type !== "current-month") {
            return (
              <div key={`empty-${idx}`} className="cal-cell cal-cell-empty">
                <span className="cal-cell-num muted">{cell.dayNum}</span>
              </div>
            );
          }

          const isSelected = selectedDate === cell.dateStr;
          const status = cell.status;

          let statusClass = "avail-available";
          let statusDotColor = "#10b981"; // green
          let tooltip = "Available for appointments";

          if (cell.isPast) {
            statusClass = "avail-past";
            statusDotColor = "transparent";
            tooltip = "Past date";
          } else if (status === "UNAVAILABLE") {
            statusClass = "avail-off";
            statusDotColor = "#94a3b8"; // gray
            tooltip = "Doctor unavailable / clinic closed";
          } else if (status === "FULLY_BOOKED") {
            statusClass = "avail-full";
            statusDotColor = "#ef4444"; // red
            tooltip = "Fully booked";
          } else if (status === "PARTIALLY_BOOKED") {
            statusClass = "avail-partial";
            statusDotColor = "#f59e0b"; // amber
            tooltip = `${cell.availableSlots || "Few"} slots remaining`;
          } else if (cell.availableSlots !== null) {
            tooltip = `${cell.availableSlots} available slots`;
          }

          return (
            <button
              key={cell.dateStr}
              type="button"
              disabled={!cell.isSelectable}
              onClick={() => onSelectDate(cell.dateStr)}
              className={`cal-cell ${statusClass} ${cell.isToday ? "cal-today" : ""} ${isSelected ? "cal-selected" : ""}`}
              title={tooltip}
              aria-label={`${cell.dateStr}: ${tooltip}`}
              aria-selected={isSelected}
            >
              <div className="cal-cell-inner">
                <span className="cal-cell-num">{cell.dayNum}</span>
                {cell.isToday && <span className="cal-today-badge">TODAY</span>}
                
                {/* Visual Status Indicator Dot */}
                {!cell.isPast && status !== "UNAVAILABLE" && (
                  <span
                    className="cal-dot"
                    style={{ backgroundColor: isSelected ? "#ffffff" : statusDotColor }}
                    aria-hidden="true"
                  />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Availability Status Legend */}
      <div className="cal-legend">
        <div className="cal-legend-item">
          <span className="cal-legend-dot" style={{ backgroundColor: "#10b981" }} />
          <span>Available</span>
        </div>
        <div className="cal-legend-item">
          <span className="cal-legend-dot" style={{ backgroundColor: "#f59e0b" }} />
          <span>Filling Fast</span>
        </div>
        <div className="cal-legend-item">
          <span className="cal-legend-dot" style={{ backgroundColor: "#ef4444" }} />
          <span>Fully Booked</span>
        </div>
        <div className="cal-legend-item">
          <span className="cal-legend-dot" style={{ backgroundColor: "#cbd5e1" }} />
          <span>Closed / Off</span>
        </div>
      </div>
    </div>
  );
}

