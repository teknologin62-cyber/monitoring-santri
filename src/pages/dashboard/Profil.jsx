import { Mail, User, Shield, LogOut } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import useAuth from "../../hooks/useAuth";
import "./Profil.css";

/**
 * Profil — tab profil pengguna.
 * Menampilkan data user dari session, tombol logout,
 * dan placeholder untuk fitur edit profil (Tahap 4).
 */
function Profil() {
  const navigate             = useNavigate();
  const { fullName, email, role, initials } = useAuth();
  const [loggingOut, setLoggingOut]         = useState(false);

  const roleLabel = role === "admin"
    ? "Administrator"
    : role === "ustadz"
    ? "Ustadz / Ustadzah"
    : "Pengguna";

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  }

  return (
    <div className="profil-root">
      <h1 className="profil-title">Profil Saya</h1>

      {/* Kartu identitas */}
      <div className="profil-card">
        <div className="profil-card__avatar">{initials}</div>
        <div className="profil-card__info">
          <p className="profil-card__name">{fullName || "—"}</p>
          <span className="profil-card__role-badge">{roleLabel}</span>
        </div>
      </div>

      {/* Detail */}
      <div className="profil-detail">

        <div className="profil-detail__row">
          <div className="profil-detail__icon" aria-hidden="true">
            <User size={18} />
          </div>
          <div>
            <p className="profil-detail__label">Nama Lengkap</p>
            <p className="profil-detail__value">{fullName || "Belum diatur"}</p>
          </div>
        </div>

        <div className="profil-detail__divider" />

        <div className="profil-detail__row">
          <div className="profil-detail__icon" aria-hidden="true">
            <Mail size={18} />
          </div>
          <div>
            <p className="profil-detail__label">Email</p>
            <p className="profil-detail__value">{email || "—"}</p>
          </div>
        </div>

        <div className="profil-detail__divider" />

        <div className="profil-detail__row">
          <div className="profil-detail__icon" aria-hidden="true">
            <Shield size={18} />
          </div>
          <div>
            <p className="profil-detail__label">Peran</p>
            <p className="profil-detail__value">{roleLabel}</p>
          </div>
        </div>

      </div>

      {/* Placeholder edit profil */}
      <div className="profil-placeholder">
        <p>✏️ Fitur edit profil akan tersedia segera.</p>
      </div>

      {/* Tombol logout */}
      <button
        type="button"
        className="profil-logout-btn"
        onClick={handleLogout}
        disabled={loggingOut}
      >
        <LogOut size={18} />
        {loggingOut ? "Keluar..." : "Keluar dari Aplikasi"}
      </button>

    </div>
  );
}

export default Profil;
