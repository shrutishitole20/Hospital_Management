const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

export const getToken = () =>
  typeof window === "undefined" ? null : window.localStorage.getItem("token");
export const setToken = (t) => window.localStorage.setItem("token", t);
export const clearToken = () => window.localStorage.removeItem("token");

export class ApiError extends Error {
  constructor(message, status, fieldErrors) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors || {};
  }
}

export async function api(path, { method = "GET", body } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";

  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError("Cannot reach the server. Check that the backend is running.", 0);
  }

  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && token) clearToken();
    throw new ApiError(
      data.message || (res.status === 401 ? "Please log in to continue." : "Request failed."),
      res.status,
      data.fieldErrors
    );
  }
  return data;
}
