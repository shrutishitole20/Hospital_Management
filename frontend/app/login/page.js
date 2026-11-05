"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useAuth } from "@/lib/auth";
import {
  HeartPulseIcon,
  LockIcon,
  ShieldCheckIcon,
  AlertCircleIcon,
  EyeIcon,
  EyeOffIcon,
  SparklesIcon,
} from "@/components/Icons";

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const next = useSearchParams().get("next") || "/appointments";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e?.preventDefault();
    setBusy(true);
    setError("");
    try {
      await login(email, password);
      router.replace(next.startsWith("/") ? next : "/appointments");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function quickDemoLogin() {
    setEmail("demo@patient.com");
    setPassword("Password@123");
    setBusy(true);
    setError("");
    try {
      await login("demo@patient.com", "Password@123");
      router.replace(next.startsWith("/") ? next : "/appointments");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-wrapper">
      <div className="authbox">
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <div className="auth-logo-badge" style={{ margin: "0 auto 1rem" }}>
            <HeartPulseIcon size={26} />
          </div>
          <h1 style={{ fontSize: "1.85rem", marginBottom: "0.35rem" }}>Patient Sign In</h1>
          <p className="muted" style={{ fontSize: "0.9rem" }}>
            Access your medical appointments, test consultations, and doctor visits.
          </p>
        </div>

        {/* 1-Click Quick Demo Sign In */}
        <button
          type="button"
          className="demo-fill-btn"
          onClick={quickDemoLogin}
          disabled={busy}
          title="Click to sign in instantly with the demo patient account"
        >
          <SparklesIcon size={16} /> Instant Demo Patient Login (demo@patient.com)
        </button>

        {error && (
          <p className="alert alert-error" role="alert">
            <AlertCircleIcon size={18} /> {error}
          </p>
        )}

        <form className="form" onSubmit={submit}>
          <div className="field">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="field">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
              <label htmlFor="password" style={{ margin: 0 }}>Password</label>
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
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            className="btn btn-solid"
            disabled={busy}
            style={{ width: "100%", padding: "0.8rem", marginTop: "0.5rem" }}
          >
            {busy ? "Authenticating…" : "Sign In to Account"}
          </button>
        </form>

        <div style={{ borderTop: "1px solid var(--line)", marginTop: "1.75rem", paddingTop: "1.25rem", textAlign: "center", fontSize: "0.9rem" }}>
          <span className="muted">New to Careline Health? </span>
          <Link href="/register" style={{ fontWeight: 600 }}>Create an account</Link>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", color: "var(--muted)", fontSize: "0.775rem", marginTop: "1.25rem" }}>
          <LockIcon size={12} /> HIPAA Compliant · 256-bit Encrypted Portal
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
