import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import { HeartPulseIcon, PhoneIcon, MapPinIcon, ShieldCheckIcon } from "@/components/Icons";

export const metadata = {
  title: "Careline Health - Specialist Doctors & Appointment Booking",
  description: "Find board-certified doctors, explore real-time schedule slots, and book or manage appointments online.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,600;12..96,700&family=Instrument+Sans:wght@400;500;600;700&display=swap"
        />
      </head>
      <body>
        <AuthProvider>
          {/* Top Emergency Ribbon */}
          <div className="top-bar">
            <div className="top-bar-inner">
              <div className="top-bar-info">
                <span className="top-bar-item">
                  <MapPinIcon size={14} /> Careline Central Hospital · 100 Hospital Way
                </span>
                <span className="top-bar-item">
                  <PhoneIcon size={14} /> Appointments: (800) 200-CARE
                </span>
              </div>
              <div className="top-bar-emergency">
                <span className="top-bar-badge">24/7 EMERGENCY</span> Trauma &amp; Ambulance: Dial 911 / 108
              </div>
            </div>
          </div>

          <Navbar />

          <main className="page">{children}</main>

          <footer className="site-footer">
            <div className="footer-inner">
              <div className="footer-grid">
                <div className="footer-col">
                  <div className="brand" style={{ marginBottom: "0.75rem" }}>
                    <span className="brand-icon-wrap" style={{ width: "32px", height: "32px" }}>
                      <HeartPulseIcon size={18} />
                    </span>
                    <span>Careline Health</span>
                  </div>
                  <p style={{ color: "#94a3b8", fontSize: "0.875rem", lineHeight: "1.6" }}>
                    Connecting patients with board-certified physicians, transparent schedules, and compassionate care. Experience seamless hospital appointments anytime.
                  </p>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", color: "#38bdf8", fontSize: "0.8rem", fontWeight: 600, marginTop: "0.5rem" }}>
                    <ShieldCheckIcon size={16} /> JCI &amp; NABH Accredited Healthcare Network
                  </div>
                </div>

                <div className="footer-col">
                  <h4>Quick Links</h4>
                  <ul className="footer-links">
                    <li><a href="/">Find a Doctor</a></li>
                    <li><a href="/appointments">My Appointments</a></li>
                    <li><a href="/history">Medical History</a></li>
                    <li><a href="/profile">Patient Profile</a></li>
                  </ul>
                </div>

                <div className="footer-col">
                  <h4>Specialties</h4>
                  <ul className="footer-links">
                    <li><a href="/?spec=Cardiology">Cardiology</a></li>
                    <li><a href="/?spec=Dermatology">Dermatology</a></li>
                    <li><a href="/?spec=Pediatrics">Pediatrics</a></li>
                    <li><a href="/?spec=Orthopedics">Orthopedics</a></li>
                    <li><a href="/?spec=Neurology">Neurology</a></li>
                  </ul>
                </div>

                <div className="footer-col">
                  <h4>Patient Support</h4>
                  <p style={{ fontSize: "0.85rem", color: "#94a3b8", margin: "0 0 0.5rem" }}>
                    Need help booking an appointment or changing schedule?
                  </p>
                  <div style={{ color: "#ffffff", fontWeight: 600, fontSize: "0.95rem", marginBottom: "0.25rem" }}>
                    📞 1800-200-CARE (2273)
                  </div>
                  <div style={{ color: "#94a3b8", fontSize: "0.85rem" }}>
                    ✉️ support@careline.health
                  </div>
                  <div style={{ color: "#94a3b8", fontSize: "0.85rem", marginTop: "0.25rem" }}>
                    🕒 Mon - Sat: 8:00 AM - 8:00 PM
                  </div>
                </div>
              </div>

              <div className="footer-bottom">
                <div>© 2026 Careline Medical Health System. All rights reserved.</div>
                <div style={{ display: "flex", gap: "1.25rem" }}>
                  <span>HIPAA Compliant</span>
                  <span>Privacy Policy</span>
                  <span>Terms of Service</span>
                  <span>Patient Bill of Rights</span>
                </div>
              </div>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
