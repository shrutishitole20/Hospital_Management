"use client";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import SlotPicker from "@/components/SlotPicker";
import { api } from "@/lib/api";
import { useRequireAuth } from "@/lib/auth";
import { fmtDate, fmtTime } from "@/lib/format";

export default function ReschedulePage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, loading } = useRequireAuth();
  const [appt, setAppt] = useState(null);
  const [slot, setSlot] = useState(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (user) api(`/appointments/${id}`).then(setAppt).catch((e) => setError(e.message));
  }, [user, id]);

  async function submit() {
    setBusy(true); setError("");
    try {
      await api(`/appointments/${id}/reschedule`, { method: "PUT", body: { newSlotId: slot.id, reason } });
      router.push(`/appointments/${id}?rescheduled=1`);
    } catch (e) {
      setError(e.message); setSlot(null); setRefreshKey((k) => k + 1);
    } finally { setBusy(false); }
  }

  if (loading || !user) return <p className="muted">Loading…</p>;
  if (!appt) return error ? <p className="alert alert-error">{error}</p> : <p className="muted">Loading…</p>;
  if (!appt.canModify) return (
    <>
      <p className="alert alert-error">This appointment can no longer be rescheduled.</p>
      <Link href="/appointments" className="btn">Back to appointments</Link>
    </>
  );

  return (
    <>
      <Link href={`/appointments/${id}`} className="back">← Back to appointment</Link>
      <h1>Reschedule</h1>
      <p className="muted">
        Currently {fmtDate(appt.date)} at {fmtTime(appt.startTime)} with {appt.doctor.fullName}. Pick a new time below.
      </p>
      {error && <p className="alert alert-error" role="alert">{error}</p>}
      <section className="card">
        <SlotPicker doctorId={appt.doctor.id} selectedSlotId={slot?.id} excludeSlotId={appt.slotId}
          onSelect={setSlot} refreshKey={refreshKey} />
        {slot && (
          <div className="stack">
            <p>Move to <strong>{fmtDate(slot.date)}, {fmtTime(slot.startTime)}</strong></p>
            <div className="field"><label htmlFor="why">Reason for changing (optional)</label>
              <input id="why" value={reason} maxLength={500} onChange={(e) => setReason(e.target.value)} /></div>
            <div className="actions">
              <button className="btn btn-solid" disabled={busy} onClick={submit}>{busy ? "Saving…" : "Confirm new time"}</button>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
