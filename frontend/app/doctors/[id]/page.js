"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import AppointmentScheduler from "@/components/AppointmentScheduler";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { fmtFee } from "@/lib/format";
import {
  ArrowLeftIcon,
  ShieldCheckIcon,
  StarIcon,
  AwardIcon,
  MapPinIcon,
  ClockIcon,
  StethoscopeIcon,
} from "@/components/Icons";

export default function DoctorPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [doctor, setDoctor] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api(`/doctors/${id}`)
      .then(setDoctor)
      .catch((e) => setError(e.message));
  }, [id]);

  const getInitials = (name) => {
    if (!name) return "DR";
    const clean = name.replace(/^Dr\.\s*/i, "").trim();
    const parts = clean.split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return parts[0][0].toUpperCase();
  };

  if (!doctor) {
    return error ? (
      <p className="alert alert-error">{error}</p>
    ) : (
      <p className="muted">Loading doctor profile…</p>
    );
  }

  return (
    <>
      <Link href="/" className="back-link">
        <ArrowLeftIcon size={16} /> Back to Doctor Directory
      </Link>

      <div className="split doctor-booking-split">
        {/* Doctor Profile Information (Matches Current UI exactly) */}
        <section className="card profile-card">
          <div className="doctor-hero-profile">
            <div className="doctor-profile-avatar">
              {getInitials(doctor.fullName)}
            </div>
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", color: "#047857", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>
                <ShieldCheckIcon size={14} /> Verified Hospital Faculty
              </div>
              <h1 style={{ fontSize: "1.75rem", margin: "0 0 0.35rem" }}>{doctor.fullName}</h1>
              <span className="spec-badge" style={{ fontSize: "0.85rem" }}>
                {doctor.specialization}
              </span>
            </div>
          </div>

          <div className="doctor-rating" style={{ marginBottom: "1.25rem" }}>
            <StarIcon size={16} fill="#d97706" />
            <span style={{ fontSize: "1rem" }}>4.9</span>
            <span className="muted" style={{ fontWeight: 400 }}>· 120+ verified patient ratings</span>
          </div>

          <h3 style={{ fontSize: "1rem", color: "var(--navy)", marginBottom: "0.5rem" }}>
            Physician Overview
          </h3>
          <p style={{ fontSize: "0.925rem", lineHeight: "1.55", marginBottom: "1.25rem" }}>
            {doctor.about}
          </p>

          <dl className="facts">
            <dt><AwardIcon size={15} /> Qualification</dt>
            <dd>{doctor.qualification}</dd>

            <dt><ClockIcon size={15} /> Clinical Experience</dt>
            <dd>{doctor.experienceYears} Years</dd>

            <dt><StethoscopeIcon size={15} /> Department</dt>
            <dd>{doctor.specialization}</dd>

            <dt><MapPinIcon size={15} /> Clinic Location</dt>
            <dd>Careline Main Wing, Suite 304</dd>

            <dt>💵 Consultation Fee</dt>
            <dd style={{ color: "var(--primary-dark)", fontSize: "1.05rem" }}>
              {fmtFee(doctor.consultationFee)}
            </dd>
          </dl>

          <div style={{ background: "var(--mist)", border: "1px solid var(--line)", borderRadius: "8px", padding: "0.85rem", fontSize: "0.825rem", color: "var(--muted)" }}>
            <strong style={{ color: "var(--navy)", display: "block", marginBottom: "0.25rem" }}>
              Patient Policy &amp; Timings
            </strong>
            Appointments are scheduled in dedicated 30-minute consultation windows. Please arrive 10 minutes prior to your scheduled time.
          </div>
        </section>

        {/* Upgraded Modern Appointment Scheduling Section */}
        <section className="card scheduler-card-wrap">
          <AppointmentScheduler
            doctor={doctor}
            user={user}
            isReschedule={false}
          />
        </section>
      </div>
    </>
  );
}
