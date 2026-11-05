"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import StatusBadge from "@/components/StatusBadge";
import { api } from "@/lib/api";
import { useRequireAuth } from "@/lib/auth";
import { fmtDate, fmtTime } from "@/lib/format";
import { downloadAppointmentIcs } from "@/lib/calendar";
import {
  CalendarIcon,
  ClockIcon,
  SearchIcon,
  CopyIcon,
  DownloadIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  StethoscopeIcon,
} from "@/components/Icons";

const CANCEL_REASONS = [
  "Schedule conflict",
  "Feeling better / Symptoms resolved",
  "Need to see different specialist",
  "Family emergency",
];

function AppointmentsContent() {
  const { user, loading } = useRequireAuth();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "past" ? "past" : "upcoming";
  const initialCancel = searchParams.get("cancel") ? parseInt(searchParams.get("cancel")) : null;

  const [tab, setTab] = useState(initialTab);
  const [items, setItems] = useState(null);
  const [error, setError] = useState("");
  const [cancelId, setCancelId] = useState(initialCancel);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [filterQuery, setFilterQuery] = useState("");
  const [copiedCode, setCopiedCode] = useState(null);

  const load = useCallback(() => {
    setItems(null);
    api(`/appointments?type=${tab}`)
      .then(setItems)
      .catch((e) => {
        setError(e.message);
        setItems([]);
      });
  }, [tab]);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  async function cancel(id) {
    setBusy(true);
    setError("");
    try {
      await api(`/appointments/${id}/cancel`, { method: "POST", body: { reason } });
      setCancelId(null);
      setReason("");
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  const copyRefCode = (code) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const getInitials = (name) => {
    if (!name) return "DR";
    const clean = name.replace(/^Dr\.\s*/i, "").trim();
    const parts = clean.split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return parts[0][0].toUpperCase();
  };

  if (loading || !user) {
    return (
      <div className="empty" style={{ margin: "2rem auto", maxWidth: "600px" }}>
        <ClockIcon size={32} className="muted" style={{ margin: "0 auto 0.75rem", display: "block" }} />
        <p className="muted">Authenticating patient account…</p>
      </div>
    );
  }

  const filteredItems = (items || []).filter((a) => {
    if (!filterQuery.trim()) return true;
    const q = filterQuery.toLowerCase();
    return (
      a.doctor?.fullName?.toLowerCase().includes(q) ||
      a.doctor?.specialization?.toLowerCase().includes(q) ||
      a.referenceCode?.toLowerCase().includes(q) ||
      (a.reason && a.reason.toLowerCase().includes(q))
    );
  });

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "1rem", marginBottom: "0.5rem" }}>
        <div>
          <h1>My Appointments</h1>
          <p className="muted" style={{ margin: 0 }}>
            Manage your consultations, add bookings to your calendar, and track appointment status.
          </p>
        </div>
        <Link href="/" className="btn btn-solid">
          <CalendarIcon size={16} /> Book New Appointment
        </Link>
      </div>

      {/* Tabs */}
      <div className="tabs" role="tablist">
        <button
          role="tab"
          aria-selected={tab === "upcoming"}
          className={`tab ${tab === "upcoming" ? "on" : ""}`}
          onClick={() => {
            setTab("upcoming");
            setCancelId(null);
            setError("");
          }}
        >
          <CalendarIcon size={16} />
          <span>Upcoming Consultations</span>
          {tab === "upcoming" && items && (
            <span className="tab-count">{items.length}</span>
          )}
        </button>

        <button
          role="tab"
          aria-selected={tab === "past"}
          className={`tab ${tab === "past" ? "on" : ""}`}
          onClick={() => {
            setTab("past");
            setCancelId(null);
            setError("");
          }}
        >
          <ClockIcon size={16} />
          <span>Past &amp; Completed</span>
          {tab === "past" && items && (
            <span className="tab-count">{items.length}</span>
          )}
        </button>
      </div>

      {/* Search / Filter within appointments */}
      {items && items.length > 0 && (
        <div style={{ marginBottom: "1.25rem", maxWidth: "420px" }}>
          <div className="search-box" style={{ background: "#ffffff", border: "1px solid var(--line)", borderRadius: "8px", padding: "0.45rem 0.75rem" }}>
            <SearchIcon size={16} className="muted" />
            <input
              type="search"
              placeholder="Filter by doctor, specialty, or ref code..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              style={{ border: "none", fontSize: "0.875rem", outline: "none", width: "100%", background: "transparent" }}
            />
          </div>
        </div>
      )}

      {error && <p className="alert alert-error" role="alert">{error}</p>}

      {items === null ? (
        <div className="empty" style={{ padding: "2.5rem" }}>
          <ClockIcon size={32} className="muted" style={{ margin: "0 auto 0.75rem", display: "block" }} />
          <p className="muted">Loading your appointments…</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="empty">
          <CalendarIcon size={36} className="muted" style={{ margin: "0 auto 0.75rem", display: "block" }} />
          {filterQuery ? (
            <>
              <p style={{ fontWeight: 600, color: "var(--navy)" }}>No appointments match “{filterQuery}”</p>
              <button className="btn btn-secondary" onClick={() => setFilterQuery("")}>Clear Filter</button>
            </>
          ) : tab === "upcoming" ? (
            <>
              <h3 style={{ marginBottom: "0.35rem" }}>You have no upcoming consultations</h3>
              <p className="muted" style={{ maxWidth: "45ch", margin: "0 auto 1.25rem" }}>
                Need to see a physician? Find board-certified specialists and schedule your consultation online.
              </p>
              <Link href="/" className="btn btn-solid">
                <StethoscopeIcon size={16} /> Find a Doctor Now
              </Link>
            </>
          ) : (
            <>
              <h3 style={{ marginBottom: "0.35rem" }}>No past appointments on record</h3>
              <p className="muted">Your consultation history and completed visits will appear here.</p>
            </>
          )}
        </div>
      ) : (
        <div className="stack">
          {filteredItems.map((a) => (
            <article key={a.id} className="card appt">
              <div className="appt-top">
                <div className="appt-doctor-info">
                  <div className="doctor-avatar-circle" style={{ width: 48, height: 48, fontSize: "1rem" }}>
                    {getInitials(a.doctor.fullName)}
                  </div>
                  <div>
                    <div className="appt-when">
                      <CalendarIcon size={18} style={{ color: "var(--primary)" }} />
                      <span>{fmtDate(a.date, { weekday: "short", month: "short", day: "numeric" })} · {fmtTime(a.startTime)}</span>
                    </div>
                    <div style={{ marginTop: "0.25rem" }}>
                      <strong style={{ fontSize: "1.05rem", color: "var(--navy)" }}>{a.doctor.fullName}</strong>
                      <span className="spec-badge" style={{ marginLeft: "0.5rem" }}>
                        {a.doctor.specialization}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="appt-status-col">
                  <StatusBadge status={a.status} />
                  <button
                    type="button"
                    className="ref-pill"
                    onClick={() => copyRefCode(a.referenceCode)}
                    title="Click to copy reference code"
                  >
                    <CopyIcon size={12} />
                    <span>{copiedCode === a.referenceCode ? "Copied!" : a.referenceCode}</span>
                  </button>
                </div>
              </div>

              {a.reason && (
                <div style={{ background: "var(--mist)", border: "1px solid var(--line)", borderRadius: "8px", padding: "0.6rem 0.85rem", fontSize: "0.875rem" }}>
                  <span style={{ color: "var(--muted)", fontWeight: 600 }}>Reason: </span>
                  <span style={{ color: "var(--ink-secondary)" }}>{a.reason}</span>
                </div>
              )}

              {a.status === "REJECTED" && (
                <div className="callout callout-red">
                  <strong style={{ display: "flex", alignItems: "center", gap: "0.35rem", marginBottom: "0.2rem" }}>
                    <AlertCircleIcon size={16} /> Appointment Declined by Doctor
                  </strong>
                  <span>{a.rejectionReason || "Doctor unavailable during this scheduled window."}</span>
                </div>
              )}

              {a.status === "CANCELLED" && a.cancellationReason && (
                <div className="callout callout-gray">
                  <strong>Cancellation Note:</strong> {a.cancellationReason}
                </div>
              )}

              {/* Inline Cancel Confirmation Box */}
              {cancelId === a.id ? (
                <div className="confirm-box">
                  <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", color: "var(--red)", fontWeight: 700 }}>
                    <AlertCircleIcon size={18} /> Are you sure you want to cancel this appointment?
                  </div>
                  <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--ink-secondary)" }}>
                    Cancelling will release your reserved slot with {a.doctor.fullName}. This action cannot be undone.
                  </p>

                  <div className="field">
                    <label htmlFor={`r${a.id}`}>Cancellation reason (optional)</label>
                    <div className="reason-chips">
                      {CANCEL_REASONS.map((cr) => (
                        <button
                          key={cr}
                          type="button"
                          className="reason-chip"
                          onClick={() => setReason(cr)}
                        >
                          + {cr}
                        </button>
                      ))}
                    </div>
                    <input
                      id={`r${a.id}`}
                      value={reason}
                      maxLength={500}
                      placeholder="Why do you need to cancel?"
                      onChange={(e) => setReason(e.target.value)}
                    />
                  </div>

                  <div className="actions">
                    <button
                      className="btn btn-danger-solid"
                      disabled={busy}
                      onClick={() => cancel(a.id)}
                    >
                      {busy ? "Cancelling Slot…" : "Yes, Cancel Appointment"}
                    </button>
                    <button className="btn btn-secondary" onClick={() => setCancelId(null)}>
                      Keep My Appointment
                    </button>
                  </div>
                </div>
              ) : (
                <div className="actions">
                  <Link href={`/appointments/${a.id}`} className="btn btn-secondary">
                    View Details &amp; Receipt
                  </Link>

                  {a.upcoming && a.status !== "CANCELLED" && a.status !== "REJECTED" && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => downloadAppointmentIcs(a)}
                      title="Download calendar (.ics) invite"
                    >
                      <DownloadIcon size={15} /> Add to Calendar
                    </button>
                  )}

                  {a.canModify && (
                    <Link href={`/appointments/${a.id}/reschedule`} className="btn">
                      Reschedule Slot
                    </Link>
                  )}

                  {a.canModify && (
                    <button
                      className="btn btn-danger"
                      onClick={() => {
                        setCancelId(a.id);
                        setReason("");
                      }}
                    >
                      Cancel
                    </button>
                  )}

                  {a.status === "REJECTED" && (
                    <Link href={`/doctors/${a.doctor.id}`} className="btn btn-solid">
                      Book Another Slot
                    </Link>
                  )}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </>
  );
}

export default function AppointmentsPage() {
  return (
    <Suspense fallback={<p className="muted">Loading consultations…</p>}>
      <AppointmentsContent />
    </Suspense>
  );
}
