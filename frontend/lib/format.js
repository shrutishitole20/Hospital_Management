export function fmtDate(d, opts) {
  if (!d) return "";
  const [y, m, day] = d.split("-").map(Number);
  return new Date(y, m - 1, day).toLocaleDateString(
    "en-IN",
    opts || { weekday: "short", day: "numeric", month: "short", year: "numeric" }
  );
}

export function fmtTime(t) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${suffix}`;
}

export const fmtFee = (n) => `₹${Number(n).toLocaleString("en-IN")}`;

export function fmtDateTime(iso) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit",
  });
}
