import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import Navbar from "@/components/Navbar";

export const metadata = {
  title: "Careline: book a doctor appointment",
  description: "Find a doctor, pick a time and manage your appointments.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700&family=Instrument+Sans:wght@400;500;600&display=swap"
        />
      </head>
      <body>
        <AuthProvider>
          <Navbar />
          <main className="page">{children}</main>
          <footer className="footer">Careline patient booking · demo project</footer>
        </AuthProvider>
      </body>
    </html>
  );
}
