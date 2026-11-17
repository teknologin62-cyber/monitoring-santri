import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, User } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import "./Dashboard.css";

/**
 * Dashboard — halaman placeholder.
 * Menampilkan identitas pengguna yang sedang login dan tombol logout.
 * Halaman ini dilindungi oleh ProtectedRoute di App.jsx.
 */
function Dashboard() {
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  // Ambil email pengguna dari session aktif
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) {
        setUserEmail(session.user.email);
      }
    });
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    await supabase.auth.signOut();
    // onAuthStateChange di ProtectedRoute akan menangkap perubahan ini
    // dan redirect ke /login secara otomatis, tapi kita juga navigate
    // langsung agar transisi terasa cepat.
    navigate("/login", { replace: true });
  }

  return (
    <div className="dashboard-root">

      {/* ── Header ── */}
      <header className="dashboard-header">
        <div className="dashboard-header__brand">
          <img
            src="/images/logo.png"
            alt="Logo Monitoring Santri"
            className="dashboard-header__logo"
            draggable="false"
          />
          <span className="dashboard-header__name">Monitoring Santri</span>
        </div>

        <button
          type="button"
          className="dashboard-logout-btn"
          onClick={handleLogout}
          disabled={loggingOut}
        >
          <LogOut size={16} />
          {loggingOut ? "Keluar..." : "Keluar"}
        </button>
      </header>

      {/* ── Konten utama ── */}
      <main className="dashboard-main">

        <div className="dashboard-welcome-card">
          <div className="dashboard-welcome-card__icon" aria-hidden="true">
            <User size={32} />
          </div>
          <div>
            <h1 className="dashboard-welcome-card__title">
              Selamat datang! 👋
            </h1>
            {userEmail && (
              <p className="dashboard-welcome-card__email">{userEmail}</p>
            )}
            <p className="dashboard-welcome-card__note">
              Anda berhasil masuk ke aplikasi Monitoring Santri.
              Halaman dashboard sedang dalam pengembangan.
            </p>
          </div>
        </div>

        {/* Placeholder info fitur */}
        <div className="dashboard-placeholder">
          <p>🚧 Fitur dashboard akan segera tersedia.</p>
        </div>

      </main>

    </div>
  );
}

export default Dashboard;
