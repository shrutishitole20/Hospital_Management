"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import {
  HeartPulseIcon,
  SearchIcon,
  CalendarIcon,
  ClockIcon,
  UserIcon,
} from "./Icons";

export default function Navbar() {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getInitials = (name) => {
    if (!name) return "P";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return parts[0][0].toUpperCase();
  };

  const isActive = (href) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const navLink = (href, label, icon) => (
    <Link
      href={href}
      className={isActive(href) ? "active" : ""}
      onClick={() => setMobileMenuOpen(false)}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );

  return (
    <header className="nav">
      <div className="nav-inner">
        <Link href="/" className="brand">
          <span className="brand-icon-wrap">
            <HeartPulseIcon size={22} />
          </span>
          <div>
            Careline
            <span className="brand-text-sub">Medical Health</span>
          </div>
        </Link>

        <button
          className="nav-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {mobileMenuOpen ? (
              <path d="M18 6L6 18M6 6l12 12" />
            ) : (
              <path d="M3 12h18M3 6h18M3 18h18" />
            )}
          </svg>
        </button>

        <nav className={`nav-links ${mobileMenuOpen ? "open" : ""}`}>
          {navLink("/", "Find a Doctor", <SearchIcon size={16} />)}
          {user && navLink("/appointments", "My Appointments", <CalendarIcon size={16} />)}
          {user && navLink("/history", "History", <ClockIcon size={16} />)}

          {/* Mobile Drawer Auth Actions */}
          <div className="nav-mobile-auth">
            {loading ? null : user ? (
              <>
                <Link
                  href="/profile"
                  className="nav-mobile-user-link"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="user-avatar">{getInitials(user.fullName)}</span>
                  <div>
                    <strong style={{ display: "block", color: "#fff" }}>{user.fullName}</strong>
                    <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>View Patient Profile</span>
                  </div>
                </Link>
                <button
                  className="btn btn-quiet nav-mobile-logout"
                  onClick={async () => {
                    setMobileMenuOpen(false);
                    await logout();
                    router.push("/");
                  }}
                >
                  Log out
                </button>
              </>
            ) : (
              <div className="nav-mobile-auth-btns">
                <Link
                  href="/login"
                  className="btn btn-secondary"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="btn btn-solid"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  Create Account
                </Link>
              </div>
            )}
          </div>
        </nav>

        <div className="nav-user">
          {loading ? null : user ? (
            <>
              <Link href="/profile" className="user-pill" title="View Patient Profile">
                <span className="user-avatar">{getInitials(user.fullName)}</span>
                <span>{user.fullName.split(" ")[0]}</span>
              </Link>
              <button
                className="btn btn-quiet"
                onClick={async () => {
                  await logout();
                  router.push("/");
                }}
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" style={{ color: "#cbd5e1", fontWeight: 500, fontSize: "0.925rem" }}>
                Log in
              </Link>
              <Link href="/register" className="btn btn-solid">
                Create Account
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
