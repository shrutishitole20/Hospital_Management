/**
 * Generates and triggers download of an iCalendar (.ics) file for an appointment.
 */
export function downloadAppointmentIcs(appointment) {
  if (!appointment || !appointment.date || !appointment.startTime) return;

  const dateStr = appointment.date.replace(/-/g, "");
  const startParts = (appointment.startTime || "09:00:00").split(":");
  const endParts = (appointment.endTime || "09:30:00").split(":");

  const pad = (n) => String(n).padStart(2, "0");
  const dtStart = `${dateStr}T${pad(startParts[0])}${pad(startParts[1])}00`;
  const dtEnd = `${dateStr}T${pad(endParts[0])}${pad(endParts[1])}00`;

  const doctorName = appointment.doctor?.fullName || "Doctor";
  const spec = appointment.doctor?.specialization || "Consultation";
  const summary = `Medical Appointment: ${doctorName} (${spec})`;
  const description = `Careline Medical Center appointment with ${doctorName}. Reference Code: ${appointment.referenceCode || "N/A"}. Reason: ${appointment.reason || "General Consultation"}.`;
  const location = "Careline Medical Center, Main Clinic Wing, 100 Hospital Way";

  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Careline Hospital//Appointment System//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:careline-appt-${appointment.id || Date.now()}@careline.health`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `Careline-Appointment-${appointment.referenceCode || "booking"}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

