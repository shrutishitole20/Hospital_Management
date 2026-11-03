"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import StatusBadge from "@/components/StatusBadge";
import { api } from "@/lib/api";
import { useRequireAuth } from "@/lib/auth";
import { fmtDate, fmtTime } from "@/lib/format";

export default function AppointmentsPage() {
  const { user, loading } = useRequireAuth();
  const [tab, setTab] = useState("upcoming");
  const [items, setItems] = useState(null);
  const [error, setError] = useState("");
  const [cancelId, setCancelId] = useState(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setItems(null);
    api(`/appointments?type=${tab}`).then(setItems).catch((e) => { setError(e.message); setItems([]); });
  }, [tab]);

  useEffect(() => { if (user) load(); }, [user, load]);

  async function cancel(id) {
    setBusy(true); setError("");
    try {
      await api(`/appointments/${id}/cancel`, { method: "POST", body: { reason } });
      setCancelId(null); setReason(""); load();
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  if (loading || !user) return <p className="muted">Loading…</p>;

  return (
    <>
      <h1>My appointments</h1>
      <div className="tabs" role="tablist">
        {["upcoming", "past"].map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} className={`tab ${tab === t ? "on" : ""}`}
            onClick={() => { setTab(t); setCancelId(null); setError(""); }}>
            {t === "upcoming" ? "Upcoming" : "Past"}
          </button>
        ))}
      </div>
      {error && <p className="alert alert-error" role="alert">{error}</p>}
      {items === null ? <p className="muted">Loading appointments…</p> : items.length === 0 ? (
        <p className="empty">
          {tab === "upcoming" ? <>You have no upcoming appointments. <Link href="/">Find a doctor</Link> to book one.</> : "No past appointments yet."}
        </p>
      ) : (
        <div className="stack">
          {items.map((a) => (
            <article key={a.id} className="card appt">
              <div className="appt-top">
                <div>
                  <div className="appt-when">{fmtDate(a.date)} · {fmtTime(a.startTime)}</div>
                  <div><strong>{a.doctor.fullName}</strong> <span className="muted">· {a.doctor.specialization}</span></div>
                </div>
                <StatusBadge status={a.status} />
              </div>
              {a.reason && <div className="muted">Reason: {a.reason}</div>}
              {a.status === "REJECTED" && (
                <div className="callout callout-red"><strong>Rejected.</strong> {a.rejectionReason || "No reason was given."}</div>
              )}
              {a.status === "CANCELLED" && a.cancellationReason && (
                <div className="callout callout-gray">You cancelled: {a.cancellationReason}</div>
              )}
              <div className="ref">Ref {a.referenceCode}</div>

              {cancelId === a.id ? (
                <div className="confirm-box">
                  <strong>Cancel this appointment?</strong>
                  <div className="field"><label htmlFor={`r${a.id}`}>Reason (optional)</label>
                    <input id={`r${a.id}`} value={reason} maxLength={500} onChange={(e) => setReason(e.target.value)} /></div>
                  <div className="actions">
                    <button className="btn btn-danger-solid" disabled={busy} onClick={() => cancel(a.id)}>
                      {busy ? "Cancelling…" : "Yes, cancel appointment"}
                    </button>
                    <button className="btn" onClick={() => setCancelId(null)}>Keep it</button>
                  </div>
                </div>
              ) : (
                <div className="actions">
                  <Link href={`/appointments/${a.id}`} className="btn">View details</Link>
                  {a.canModify && <Link href={`/appointments/${a.id}/reschedule`} className="btn">Reschedule</Link>}
                  {a.canModify && <button className="btn btn-danger" onClick={() => { setCancelId(a.id); setReason(""); }}>Cancel</button>}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </>
  );
}
