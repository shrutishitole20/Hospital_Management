"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { fmtFee } from "@/lib/format";

export default function FindDoctorPage() {
  const [q, setQ] = useState("");
  const [spec, setSpec] = useState("");
  const [specs, setSpecs] = useState([]);
  const [doctors, setDoctors] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => { api("/doctors/specializations").then(setSpecs).catch(() => {}); }, []);

  useEffect(() => {
    // wait briefly while the person is typing
    const t = setTimeout(() => {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (spec) params.set("specialization", spec);
      setError("");
      api(`/doctors?${params}`).then(setDoctors).catch((e) => { setError(e.message); setDoctors([]); });
    }, 250);
    return () => clearTimeout(t);
  }, [q, spec]);

  return (
    <>
      <section className="hero">
        <h1>See a doctor at a time that suits you.</h1>
        <p>Search by doctor name or specialization, then pick a free slot.</p>
        <div className="search">
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Doctor name or specialization, e.g. “cardio”" aria-label="Search doctors" />
        </div>
        <div className="chips" role="group" aria-label="Filter by specialization">
          <button className={`chip ${spec === "" ? "on" : ""}`} onClick={() => setSpec("")}>All</button>
          {specs.map((s) => (
            <button key={s} className={`chip ${spec === s ? "on" : ""}`} onClick={() => setSpec(s)}>{s}</button>
          ))}
        </div>
      </section>

      {error && <p className="alert alert-error">{error}</p>}
      {doctors === null ? (
        <p className="muted">Loading doctors…</p>
      ) : doctors.length === 0 && !error ? (
        <p className="empty">No doctors match “{q || spec}”. Try a different name or clear the filter.</p>
      ) : (
        <div className="doctor-list">
          {doctors.map((d) => (
            <article key={d.id} className="card doctor-card">
              <h3>{d.fullName}</h3>
              <span className="spec">{d.specialization}</span>
              <span className="muted">{d.qualification} · {d.experienceYears} yrs experience</span>
              <div className="row">
                <span className="fee">{fmtFee(d.consultationFee)}</span>
                <Link href={`/doctors/${d.id}`} className="btn btn-solid">View &amp; book</Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
