"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import {
  HeartPulseIcon,
  LockIcon,
  ShieldCheckIcon,
  AlertCircleIcon,
  EyeIcon,
  EyeOffIcon,
} from "@/components/Icons";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [f, setF] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setFieldErrors({});
    try {
      await register({
        ...f,
        dateOfBirth: f.dateOfBirth || null,
        gender: f.gender || null,
        phone: f.phone || null,
      });
      router.replace("/");
    } catch (err) {
      setError(err.message);
      setFieldErrors(err.fieldErrors || {});
    } finally {
      setBusy(false);
    }
  }

  const err = (k) =>
    fieldErrors[k] && (
      <div className="err">
        <AlertCircleIcon size={12} /> {fieldErrors[k]}
      </div>
    );

  return (
    <div className="auth-wrapper" style={{ maxWidth: "520px" }}>
      <div className="authbox">
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <div className="auth-logo-badge" style={{ margin: "0 auto 1rem" }}>
            <HeartPulseIcon size={26} />
          </div>
          <h1 style={{ fontSize: "1.85rem", marginBottom: "0.35rem" }}>Create Patient Account</h1>
          <p className="muted" style={{ fontSize: "0.9rem" }}>
            Register to book doctor appointments, track health records, and access care 24/7.
          </p>
        </div>

        {error && (
          <p className="alert alert-error" role="alert">
            <AlertCircleIcon size={18} /> {error}
          </p>
        )}

        <form className="form" onSubmit={submit}>
          <div className="field">
            <label htmlFor="fullName">Full Legal Name</label>
            <input
              id="fullName"
              required
              autoComplete="name"
              placeholder="e.g. Jane Doe"
              value={f.fullName}
              onChange={set("fullName")}
            />
            {err("fullName")}
          </div>

          <div className="field">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              placeholder="name@example.com"
              value={f.email}
              onChange={set("email")}
            />
            {err("email")}
          </div>

          <div className="field">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
              <label htmlFor="password" style={{ margin: 0 }}>Password (min. 6 characters)</label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: "0.8rem", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}
              >
                {showPassword ? <EyeOffIcon size={14} /> : <EyeIcon size={14} />}
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              minLength={6}
              autoComplete="new-password"
              placeholder="Create a strong password"
              value={f.password}
              onChange={set("password")}
            />
            {err("password")}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem" }}>
            <div className="field">
              <label htmlFor="phone">Phone Number</label>
              <input
                id="phone"
                type="tel"
                autoComplete="tel"
                placeholder="e.g. 9876543210"
                value={f.phone}
                onChange={set("phone")}
              />
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

          <button
            className="btn btn-solid"
            disabled={busy}
            style={{ width: "100%", padding: "0.85rem", marginTop: "0.5rem" }}
          >
            {busy ? "Registering Patient Account…" : "Complete Registration"}
          </button>
        </form>

        <div style={{ borderTop: "1px solid var(--line)", marginTop: "1.75rem", paddingTop: "1.25rem", textAlign: "center", fontSize: "0.9rem" }}>
          <span className="muted">Already registered? </span>
          <Link href="/login" style={{ fontWeight: 600 }}>Sign in here</Link>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", color: "var(--muted)", fontSize: "0.775rem", marginTop: "1.25rem" }}>
          <ShieldCheckIcon size={14} /> Your health data is securely encrypted &amp; never shared
        </div>
      </div>
    </div>
  );
}
