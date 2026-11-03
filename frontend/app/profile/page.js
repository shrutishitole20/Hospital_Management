"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useRequireAuth } from "@/lib/auth";

export default function ProfilePage() {
  const { user, setUser, loading } = useRequireAuth();
  const [f, setF] = useState(null);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) setF({
      fullName: user.fullName || "", phone: user.phone || "", dateOfBirth: user.dateOfBirth || "",
      gender: user.gender || "", address: user.address || "", bloodGroup: user.bloodGroup || "",
    });
  }, [user]);

  if (loading || !user || !f) return <p className="muted">Loading…</p>;
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function save(e) {
    e.preventDefault();
    setBusy(true); setMsg(""); setError(""); setFieldErrors({});
    try {
      const updated = await api("/patients/me", { method: "PUT", body: { ...f, dateOfBirth: f.dateOfBirth || null } });
      setUser(updated);
      setMsg("Profile saved.");
    } catch (err) { setError(err.message); setFieldErrors(err.fieldErrors); }
    finally { setBusy(false); }
  }

  const err = (k) => fieldErrors[k] && <div className="err">{fieldErrors[k]}</div>;

  return (
    <>
      <h1>Your profile</h1>
      {msg && <p className="alert alert-ok" role="status">{msg}</p>}
      {error && <p className="alert alert-error" role="alert">{error}</p>}
      <form className="form form-wide" onSubmit={save}>
        <div className="field full"><label htmlFor="email">Email</label>
          <input id="email" value={user.email} readOnly />
          <div className="hint">Email is your login and cannot be changed.</div></div>
        <div className="field"><label htmlFor="fullName">Full name</label>
          <input id="fullName" required value={f.fullName} onChange={set("fullName")} />{err("fullName")}</div>
        <div className="field"><label htmlFor="phone">Phone</label>
          <input id="phone" type="tel" value={f.phone} onChange={set("phone")} />{err("phone")}</div>
        <div className="field"><label htmlFor="dob">Date of birth</label>
          <input id="dob" type="date" value={f.dateOfBirth} onChange={set("dateOfBirth")} max={new Date().toISOString().slice(0, 10)} />{err("dateOfBirth")}</div>
        <div className="field"><label htmlFor="gender">Gender</label>
          <select id="gender" value={f.gender} onChange={set("gender")}>
            <option value="">Prefer not to say</option><option>Female</option><option>Male</option><option>Other</option>
          </select></div>
        <div className="field"><label htmlFor="bg">Blood group</label>
          <select id="bg" value={f.bloodGroup} onChange={set("bloodGroup")}>
            <option value="">Not set</option>
            {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((b) => <option key={b}>{b}</option>)}
          </select></div>
        <div className="field full"><label htmlFor="address">Address</label>
          <input id="address" maxLength={255} value={f.address} onChange={set("address")} />{err("address")}</div>
        <div className="full"><button className="btn btn-solid" disabled={busy}>{busy ? "Saving…" : "Save changes"}</button></div>
      </form>
    </>
  );
}
