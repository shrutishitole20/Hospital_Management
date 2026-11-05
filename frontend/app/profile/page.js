"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useRequireAuth } from "@/lib/auth";
import {
  UserIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  HeartPulseIcon,
} from "@/components/Icons";

export default function ProfilePage() {
  const { user, setUser, loading } = useRequireAuth();
  const [f, setF] = useState(null);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) {
      setF({
        fullName: user.fullName || "",
        phone: user.phone || "",
        dateOfBirth: user.dateOfBirth || "",
        gender: user.gender || "",
        address: user.address || "",
        bloodGroup: user.bloodGroup || "",
      });
    }
  }, [user]);

  if (loading || !user || !f) {
    return <p className="muted">Authenticating patient account…</p>;
  }

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    setError("");
    setFieldErrors({});
    try {
      const updated = await api("/patients/me", {
        method: "PUT",
        body: { ...f, dateOfBirth: f.dateOfBirth || null },
      });
      setUser(updated);
      setMsg("Patient profile updated successfully.");
    } catch (err) {
      setError(err.message);
      setFieldErrors(err.fieldErrors || {});
    } finally {
      setBusy(false);
    }
  }

  const err = (k) => fieldErrors[k] && <div className="err"><AlertCircleIcon size={12} /> {fieldErrors[k]}</div>;

  const calculateAge = (dob) => {
    if (!dob) return null;
    const diff = Date.now() - new Date(dob).getTime();
    return Math.abs(new Date(diff).getUTCFullYear() - 1970);
  };

  return (
    <>
      <div style={{ marginBottom: "1.75rem" }}>
        <h1>Patient Medical Profile</h1>
        <p className="muted">
          Keep your medical records, contact information, and demographic details up-to-date for your hospital appointments.
        </p>
      </div>

      {/* Digital Patient Health Card Preview */}
      <div className="patient-health-card">
        <div className="patient-card-header">
          <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
            <span className="brand-icon-wrap" style={{ width: 34, height: 34 }}>
              <HeartPulseIcon size={18} />
            </span>
            <div>
              <div style={{ fontWeight: 700, fontSize: "1.1rem", letterSpacing: "-0.01em" }}>Careline Health System</div>
              <div style={{ fontSize: "0.75rem", color: "#38bdf8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Official Patient Identification Card
              </div>
            </div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.15)", padding: "0.3rem 0.75rem", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 700 }}>
            {f.bloodGroup ? `Blood: ${f.bloodGroup}` : "Active Record"}
          </div>
        </div>

        <div className="patient-card-body">
          <div>
            <div className="patient-card-label">Patient Name</div>
            <div className="patient-card-val">{f.fullName || user.fullName}</div>
          </div>
          <div>
            <div className="patient-card-label">Registered Email</div>
            <div className="patient-card-val" style={{ fontSize: "0.9rem" }}>{user.email}</div>
          </div>
          <div>
            <div className="patient-card-label">Phone</div>
            <div className="patient-card-val">{f.phone || "Not provided"}</div>
          </div>
          <div>
            <div className="patient-card-label">Age / Gender</div>
            <div className="patient-card-val">
              {f.dateOfBirth ? `${calculateAge(f.dateOfBirth)} yrs` : "N/A"} · {f.gender || "Unspecified"}
            </div>
          </div>
        </div>
      </div>

      {msg && (
        <p className="alert alert-ok" role="status">
          <CheckCircleIcon size={18} /> {msg}
        </p>
      )}
      {error && (
        <p className="alert alert-error" role="alert">
          <AlertCircleIcon size={18} /> {error}
        </p>
      )}

      {/* Profile Form */}
      <section className="card">
        <form className="form form-wide" onSubmit={save}>
          <div className="field full">
            <label htmlFor="email">Registered Login Email</label>
            <input id="email" value={user.email} readOnly />
            <div className="hint">Your login email is permanently tied to your medical ID and cannot be changed online.</div>
          </div>

          <div className="field">
            <label htmlFor="fullName">Full Legal Name</label>
            <input id="fullName" required value={f.fullName} onChange={set("fullName")} />
            {err("fullName")}
          </div>

          <div className="field">
            <label htmlFor="phone">Contact Phone Number</label>
            <input id="phone" type="tel" placeholder="e.g. 9876543210" value={f.phone} onChange={set("phone")} />
            {err("phone")}
          </div>

          <div className="field">
            <label htmlFor="dob">Date of Birth</label>
            <input
              id="dob"
              type="date"
              value={f.dateOfBirth}
              onChange={set("dateOfBirth")}
              max={new Date().toISOString().slice(0, 10)}
            />
            {err("dateOfBirth")}
          </div>

          <div className="field">
            <label htmlFor="gender">Gender</label>
            <select id="gender" value={f.gender} onChange={set("gender")}>
              <option value="">Prefer not to say</option>
              <option>Female</option>
              <option>Male</option>
              <option>Other</option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="bg">Blood Group</label>
            <select id="bg" value={f.bloodGroup} onChange={set("bloodGroup")}>
              <option value="">Not set / Unknown</option>
              {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((b) => (
                <option key={b}>{b}</option>
              ))}
            </select>
          </div>

          <div className="field full">
            <label htmlFor="address">Residential Address</label>
            <input
              id="address"
              maxLength={255}
              placeholder="Apartment, Street address, City, Postal Code"
              value={f.address}
              onChange={set("address")}
            />
            {err("address")}
          </div>

          <div className="full" style={{ marginTop: "0.5rem" }}>
            <button className="btn btn-solid" disabled={busy} style={{ padding: "0.75rem 1.75rem" }}>
              {busy ? "Saving Patient Record…" : "Save Profile Changes"}
            </button>
          </div>
        </form>
      </section>
    </>
  );
}
