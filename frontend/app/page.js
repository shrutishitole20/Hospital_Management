"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { fmtFee } from "@/lib/format";
import {
  SearchIcon,
  ShieldCheckIcon,
  AwardIcon,
  ClockIcon,
  StarIcon,
  ArrowRightIcon,
  HeartPulseIcon,
  StethoscopeIcon,
  BuildingIcon,
} from "@/components/Icons";

const SPECIALTY_ICONS = {
  Cardiology: "❤️",
  Dermatology: "🧴",
  Pediatrics: "👶",
  Orthopedics: "🦴",
  Gynecology: "🌸",
  Neurology: "🧠",
  "General Medicine": "💊",
  ENT: "👂",
};

function DoctorDirectory() {
  const searchParams = useSearchParams();
  const initialSpec = searchParams.get("spec") || "";

  const [q, setQ] = useState("");
  const [spec, setSpec] = useState(initialSpec);
  const [specs, setSpecs] = useState([]);
  const [doctors, setDoctors] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/doctors/specializations").then(setSpecs).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (spec) params.set("specialization", spec);
      setError("");
      api(`/doctors?${params}`)
        .then(setDoctors)
        .catch((e) => {
          setError(e.message);
          setDoctors([]);
        });
    }, 200);
    return () => clearTimeout(t);
  }, [q, spec]);

  const getInitials = (name) => {
    if (!name) return "DR";
    const clean = name.replace(/^Dr\.\s*/i, "").trim();
    const parts = clean.split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return parts[0][0].toUpperCase();
  };

  return (
    <>
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-tag">
          <ShieldCheckIcon size={14} /> JCI &amp; NABH Accredited Healthcare Network
        </div>
        <h1>World-Class Healthcare, Simplified.</h1>
        <p>
          Consult with board-certified physicians, explore real-time schedule slots, and book or manage medical appointments in seconds.
        </p>

        {/* Search input bar */}
        <div className="search-wrapper">
          <div className="search-box">
            <SearchIcon size={20} className="muted" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search doctor by name, qualification, or condition..."
              aria-label="Search doctors"
            />
            {q && (
              <button
                type="button"
                className="search-clear"
                onClick={() => setQ("")}
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>
          {spec && (
            <button
              type="button"
              className="chip on"
              onClick={() => setSpec("")}
              style={{ margin: 0, padding: "0.4rem 0.8rem", fontSize: "0.8rem" }}
            >
              {spec} ✕
            </button>
          )}
        </div>
      </section>

      {/* Trust Stats Ribbon */}
      <section className="trust-stats">
        <div className="stat-card">
          <div className="stat-icon"><StethoscopeIcon size={22} /></div>
          <div>
            <div className="stat-num">8+</div>
            <div className="stat-label">Specialist Clinics</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><AwardIcon size={22} /></div>
          <div>
            <div className="stat-num">100%</div>
            <div className="stat-label">Board-Certified Doctors</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><ClockIcon size={22} /></div>
          <div>
            <div className="stat-num">14 Days</div>
            <div className="stat-label">Live Open Slots</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><StarIcon size={22} /></div>
          <div>
            <div className="stat-num">4.9 / 5</div>
            <div className="stat-label">Verified Patient Rating</div>
          </div>
        </div>
      </section>

      {/* Specialty Filter Chips */}
      <section className="chips-section">
        <div className="chips-label">
          <HeartPulseIcon size={16} /> Filter by Medical Specialty:
        </div>
        <div className="chips" role="group" aria-label="Filter by specialization">
          <button
            className={`chip ${spec === "" ? "on" : ""}`}
            onClick={() => setSpec("")}
          >
            🩺 All Specialists
          </button>
          {specs.map((s) => (
            <button
              key={s}
              className={`chip ${spec === s ? "on" : ""}`}
              onClick={() => setSpec(s)}
            >
              <span>{SPECIALTY_ICONS[s] || "🩺"}</span>
              <span>{s}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Doctor Listings */}
      <section>
        <div className="doctor-list-header">
          <div>
            <h2>Available Specialists</h2>
            <p className="doctor-count">
              {doctors === null
                ? "Checking doctor availability..."
                : `${doctors.length} doctor${doctors.length === 1 ? "" : "s"} available for appointment`}
            </p>
          </div>
        </div>

        {error && <p className="alert alert-error">{error}</p>}

        {doctors === null ? (
          <div className="empty">
            <ClockIcon size={32} className="muted" style={{ margin: "0 auto 0.75rem", display: "block" }} />
            <p className="muted">Loading available doctors…</p>
          </div>
        ) : doctors.length === 0 && !error ? (
          <div className="empty">
            <SearchIcon size={32} className="muted" style={{ margin: "0 auto 0.75rem", display: "block" }} />
            <p style={{ fontWeight: 600, color: "var(--navy)" }}>
              No doctors found matching “{q || spec}”
            </p>
            <p className="muted" style={{ fontSize: "0.875rem" }}>
              Try searching with different keywords or clear the filter to see all departments.
            </p>
            <button
              className="btn btn-secondary"
              style={{ marginTop: "0.75rem" }}
              onClick={() => {
                setQ("");
                setSpec("");
              }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="doctor-list">
            {doctors.map((d) => (
              <article key={d.id} className="doctor-card">
                <div className="doctor-header-row">
                  <div className="doctor-avatar-circle">
                    {getInitials(d.fullName)}
                  </div>
                  <div className="doctor-title-col">
                    <h3>{d.fullName}</h3>
                    <span className="spec-badge">
                      {SPECIALTY_ICONS[d.specialization] || "🩺"} {d.specialization}
                    </span>
                  </div>
                </div>

                <div className="doctor-rating">
                  <StarIcon size={14} fill="#d97706" />
                  <span>4.9</span>
                  <span className="muted" style={{ fontSize: "0.8rem", fontWeight: 400 }}>
                    (120+ verified reviews)
                  </span>
                </div>

                <div className="doctor-meta">
                  <div><strong>Qualifications:</strong> {d.qualification}</div>
                  <div><strong>Experience:</strong> {d.experienceYears} years clinical practice</div>
                </div>

                <p className="doctor-about-snippet">{d.about}</p>

                <div className="doctor-footer">
                  <div className="fee-block">
                    <span className="fee-label">Consultation Fee</span>
                    <span className="fee">{fmtFee(d.consultationFee)}</span>
                  </div>
                  <Link href={`/doctors/${d.id}`} className="btn btn-solid">
                    <span>Book Visit</span>
                    <ArrowRightIcon size={16} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* How it Works Section */}
      <section className="workflow-section">
        <h2>How It Works</h2>
        <p className="workflow-subtitle">
          Careline makes booking medical appointments simple, transparent, and hassle-free in three quick steps.
        </p>
        <div className="steps-grid">
          <div className="step-card">
            <div className="step-num">1</div>
            <h3>Find a Specialist</h3>
            <p>
              Browse 8+ clinical departments, compare doctor qualifications, patient ratings, and consultation fees.
            </p>
          </div>
          <div className="step-card">
            <div className="step-num">2</div>
            <h3>Pick a Live Slot</h3>
            <p>
              View real-time doctor availability up to 14 days in advance and select a 30-minute session that fits your day.
            </p>
          </div>
          <div className="step-card">
            <div className="step-num">3</div>
            <h3>Instant Confirmation</h3>
            <p>
              Receive your unique appointment reference, add the visit to your calendar, and reschedule or cancel anytime with ease.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

export default function FindDoctorPage() {
  return (
    <Suspense fallback={<p className="muted">Loading healthcare portal…</p>}>
      <DoctorDirectory />
    </Suspense>
  );
}
