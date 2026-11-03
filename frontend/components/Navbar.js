"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export default function Navbar() {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const link = (href, label) => (
    <Link href={href} className={pathname === href || (href !== "/" && pathname.startsWith(href)) ? "active" : ""}>
      {label}
    </Link>
  );

  return (
    <header className="nav">
      <div className="nav-inner">
        <Link href="/" className="brand">Careline</Link>
        <nav className="nav-links">
          {link("/", "Find a doctor")}
          {user && link("/appointments", "My appointments")}
          {user && link("/history", "History")}
        </nav>
        <div className="nav-user">
          {loading ? null : user ? (
            <>
              {link("/profile", user.fullName.split(" ")[0])}
              <button className="btn btn-quiet" onClick={async () => { await logout(); router.push("/"); }}>
                Log out
              </button>
            </>
          ) : (
            <>
              <Link href="/login">Log in</Link>
              <Link href="/register" className="btn btn-solid">Create account</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
