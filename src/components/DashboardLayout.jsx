import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LogOut, Home, ClipboardList, User } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import useAuth from "../hooks/useAuth";
import "./DashboardLayout.css";

/**
 * DashboardLayout
 *
 * Komponen pembungkus untuk semua halaman di area dashboard.
 * Menyediakan:
 *  - Header atas: logo, sapaan nama, avatar inisial
 *  - Area konten: children
 *  - Bottom navigation: Beranda, Riwayat, Profil
 *
 * Penggunaan:
 *   <DashboardLayout>
 *     <HalamanAnda />
 *   </DashboardLayout>
 */
function DashboardLayout({ children }) {
  const navigate         = useNavigate();
  const location         = useLocation();
  const { fullName, email, initials } = useAuth();
  const [loggingOut, setLoggingOut]   = useState(false);

  /* Tentukan tab aktif berdasarkan URL */
  function isActive(path) {
    return location.pathname === path;
  }

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  }

  /* Sapaan berdasarkan jam */
  function getGreeting() {
    const h = new Date().getHours();
    if (h < 11)  return "Selamat pagi";
    if (h < 15)  return "Selamat siang";
    if (h < 18)  return "Selamat sore";
    return "Selamat malam";
  }

  const displayName = fullName || email || "Pengguna";

  return (
    <div className="dl-root">

      {/* ══ HEADER ══ */}
      <header className="dl-header">
        <div className="dl-header__left">
          <img
            src="/images/logo.png"
            alt="Logo"
            className="dl-header__logo"
            draggable="false"
          />
          <div className="dl-header__greeting">
            <span className="dl-header__greeting-text">
              {getGreeting()},
            </span>
            <span className="dl-header__name">
              {displayName}
            </span>
          </div>
        </div>

        <div className="dl-header__right">
          {/* Avatar inisial */}
          <div
            className="dl-avatar"
            aria-label={`Profil ${displayName}`}
            role="img"
          >
            {initials}
          </div>

          {/* Tombol logout */}
          <button
            type="button"
            className="dl-logout-btn"
            onClick={handleLogout}
            disabled={loggingOut}
            aria-label="Keluar dari aplikasi"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* ══ KONTEN UTAMA ══ */}
      <main className="dl-main">
        {children}
      </main>

      {/* ══ BOTTOM NAVIGATION ══ */}
      <nav className="dl-bottom-nav" aria-label="Navigasi utama">

        <button
          type="button"
          className={`dl-nav-item ${isActive("/dashboard") ? "dl-nav-item--active" : ""}`}
          onClick={() => navigate("/dashboard")}
          aria-label="Beranda"
          aria-current={isActive("/dashboard") ? "page" : undefined}
        >
          <Home size={22} />
          <span>Beranda</span>
        </button>

        <button
          type="button"
          className={`dl-nav-item ${isActive("/dashboard/riwayat") ? "dl-nav-item--active" : ""}`}
          onClick={() => navigate("/dashboard/riwayat")}
          aria-label="Riwayat"
          aria-current={isActive("/dashboard/riwayat") ? "page" : undefined}
        >
          <ClipboardList size={22} />
          <span>Riwayat</span>
        </button>

        <button
          type="button"
          className={`dl-nav-item ${isActive("/dashboard/profil") ? "dl-nav-item--active" : ""}`}
          onClick={() => navigate("/dashboard/profil")}
          aria-label="Profil"
          aria-current={isActive("/dashboard/profil") ? "page" : undefined}
        >
          <User size={22} />
          <span>Profil</span>
        </button>

      </nav>

    </div>
  );
}

export default DashboardLayout;
