"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useAuth } from "@/lib/auth";

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const next = useSearchParams().get("next") || "/appointments";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setError("");
    try { await login(email, password); router.replace(next.startsWith("/") ? next : "/appointments"); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  return (
    <div className="authbox">
      <h1>Log in</h1>
      <p className="muted">Demo account: demo@patient.com / Password@123</p>
      {error && <p className="alert alert-error" role="alert">{error}</p>}
      <form className="form" onSubmit={submit}>
        <div className="field"><label htmlFor="email">Email</label>
          <input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div className="field"><label htmlFor="password">Password</label>
          <input id="password" type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
        <button className="btn btn-solid" disabled={busy}>{busy ? "Logging in…" : "Log in"}</button>
      </form>
      <p style={{ marginTop: "1rem" }}>New here? <Link href="/register">Create an account</Link></p>
    </div>
  );
}

export default function LoginPage() {
  return <Suspense fallback={null}><LoginForm /></Suspense>;
}
