"use client";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import SlotPicker from "@/components/SlotPicker";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { fmtDate, fmtFee, fmtTime } from "@/lib/format";

export default function DoctorPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [doctor, setDoctor] = useState(null);
  const [slot, setSlot] = useState(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => { api(`/doctors/${id}`).then(setDoctor).catch((e) => setError(e.message)); }, [id]);

  async function book() {
    if (!user) { router.push(`/login?next=${encodeURIComponent(`/doctors/${id}`)}`); return; }
    setBusy(true); setError("");
    try {
      const res = await api("/appointments", { method: "POST", body: { slotId: slot.id, reason } });
      router.push(`/appointments/${res.appointment.id}?booked=1`);
    } catch (e) {
      setError(e.message);
      setSlot(null);
      setRefreshKey((k) => k + 1); // reload slots so a taken slot shows as unavailable
    } finally { setBusy(false); }
  }

  if (!doctor) return error ? <p className="alert alert-error">{error}</p> : <p className="muted">Loading…</p>;

  return (
    <>
      <Link href="/" className="back">← All doctors</Link>
      <div className="split">
        <section className="card">
          <h1 style={{ fontSize: "1.9rem" }}>{doctor.fullName}</h1>
          <p className="spec">{doctor.specialization}</p>
          <dl className="facts">
            <dt>Qualification</dt><dd>{doctor.qualification}</dd>
            <dt>Experience</dt><dd>{doctor.experienceYears} years</dd>
            <dt>Consultation fee</dt><dd>{fmtFee(doctor.consultationFee)}</dd>
          </dl>
          <p>{doctor.about}</p>
        </section>

        <section className="card">
          <h2>Choose a time</h2>
          {error && <p className="alert alert-error">{error}</p>}
          <SlotPicker doctorId={id} selectedSlotId={slot?.id} onSelect={setSlot} refreshKey={refreshKey} />
          {slot && (
            <div className="stack">
              <p><strong>{fmtDate(slot.date)}, {fmtTime(slot.startTime)}</strong> with {doctor.fullName}</p>
              <div className="field">
                <label htmlFor="reason">Reason for visit (optional)</label>
                <textarea id="reason" rows={3} maxLength={500} value={reason}
                  onChange={(e) => setReason(e.target.value)} placeholder="Describe your symptoms briefly" />
              </div>
              <button className="btn btn-solid" onClick={book} disabled={busy}>
                {busy ? "Booking…" : user ? `Book appointment · ${fmtFee(doctor.consultationFee)}` : "Log in to book"}
              </button>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
