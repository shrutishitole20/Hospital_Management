"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { api, clearToken, getToken, setToken } from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) { setLoading(false); return; }
    api("/patients/me")
      .then(setUser)
      .catch(() => clearToken())
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await api("/auth/login", { method: "POST", body: { email, password } });
    setToken(res.token);
    if (res.patient) {
      setUser(res.patient);
    } else {
      const profile = await api("/patients/me");
      setUser(profile);
    }
  }, []);

  const register = useCallback(async (form) => {
    const res = await api("/auth/register", { method: "POST", body: form });
    setToken(res.token);
    setUser(res.patient);
  }, []);

  const logout = useCallback(async () => {
    try { await api("/auth/logout", { method: "POST" }); } catch {}
    clearToken();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

/** Redirects to /login (remembering the page) when nobody is signed in. */
export function useRequireAuth() {
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    if (!auth.loading && !auth.user) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [auth.loading, auth.user, router, pathname]);
  return auth;
}
