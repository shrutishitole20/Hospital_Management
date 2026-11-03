"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [f, setF] = useState({ fullName: "", email: "", password: "", phone: "", dateOfBirth: "", gender: "" });
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setError(""); setFieldErrors({});
    try {
      await register({ ...f, dateOfBirth: f.dateOfBirth || null, gender: f.gender || null, phone: f.phone || null });
      router.replace("/");
    } catch (err) { setError(err.message); setFieldErrors(err.fieldErrors); }
    finally { setBusy(false); }
  }

  const field = (k, label, type = "text", extra = {}) => (
    <div className="field">
      <label htmlFor={k}>{label}</label>
      <input id={k} type={type} value={f[k]} onChange={set(k)} {...extra} />
      {fieldErrors[k] && <div className="err">{fieldErrors[k]}</div>}
    </div>
  );

  return (
    <div className="authbox">
      <h1>Create your account</h1>
      {error && <p className="alert alert-error" role="alert">{error}</p>}
      <form className="form" onSubmit={submit}>
        {field("fullName", "Full name", "text", { required: true, autoComplete: "name" })}
        {field("email", "Email", "email", { required: true, autoComplete: "email" })}
        {field("password", "Password (min 6 characters)", "password", { required: true, minLength: 6, autoComplete: "new-password" })}
        {field("phone", "Phone", "tel", { autoComplete: "tel" })}
        {field("dateOfBirth", "Date of birth", "date", { max: new Date().toISOString().slice(0, 10) })}
        <div className="field">
          <label htmlFor="gender">Gender</label>
          <select id="gender" value={f.gender} onChange={set("gender")}>
            <option value="">Prefer not to say</option><option>Female</option><option>Male</option><option>Other</option>
          </select>
        </div>
        <button className="btn btn-solid" disabled={busy}>{busy ? "Creating account…" : "Create account"}</button>
      </form>
      <p style={{ marginTop: "1rem" }}>Already registered? <Link href="/login">Log in</Link></p>
    </div>
  );
}
