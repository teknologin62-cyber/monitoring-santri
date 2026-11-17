import { BookOpen, Users, ClipboardCheck, Award } from "lucide-react";
import useAuth from "../../hooks/useAuth";
import "./Beranda.css";

/**
 * Beranda — tab utama dashboard.
 *
 * Tahap 1: menampilkan sapaan kontekstual dan grid menu aksi cepat.
 * Kartu statistik akan diisi data nyata setelah tabel Supabase dibuat (Tahap 2).
 */
function Beranda() {
  const { fullName, role } = useAuth();
  const displayName = fullName || "Pengguna";

  /* Label role untuk ditampilkan */
  const roleLabel = role === "admin"
    ? "Administrator"
    : role === "ustadz"
    ? "Ustadz / Ustadzah"
    : "Pengguna";

  return (
    <div className="beranda-root">

      {/* ── Banner sapaan ── */}
      <section className="beranda-banner">
        <div className="beranda-banner__text">
          <h1 className="beranda-banner__title">
            Hai, {displayName}! 👋
          </h1>
          <p className="beranda-banner__role">{roleLabel}</p>
          <p className="beranda-banner__sub">
            Pantau perkembangan santri dengan mudah dan terukur.
          </p>
        </div>
        <img
          src="/images/logo.png"
          alt=""
          className="beranda-banner__logo"
          aria-hidden="true"
          draggable="false"
        />
      </section>

      {/* ── Kartu statistik — placeholder (data menyusul Tahap 2) ── */}
      <section aria-label="Ringkasan data">
        <h2 className="beranda-section-title">Ringkasan</h2>
        <div className="beranda-stats-grid">

          <div className="beranda-stat-card">
            <div className="beranda-stat-card__icon beranda-stat-card__icon--blue">
              <Users size={20} />
            </div>
            <div>
              <p className="beranda-stat-card__value">—</p>
              <p className="beranda-stat-card__label">Total Santri</p>
            </div>
          </div>

          <div className="beranda-stat-card">
            <div className="beranda-stat-card__icon beranda-stat-card__icon--green">
              <ClipboardCheck size={20} />
            </div>
            <div>
              <p className="beranda-stat-card__value">—</p>
              <p className="beranda-stat-card__label">Monitoring Hari Ini</p>
            </div>
          </div>

          <div className="beranda-stat-card">
            <div className="beranda-stat-card__icon beranda-stat-card__icon--amber">
              <BookOpen size={20} />
            </div>
            <div>
              <p className="beranda-stat-card__value">—</p>
              <p className="beranda-stat-card__label">Catatan Belum Diisi</p>
            </div>
          </div>

          <div className="beranda-stat-card">
            <div className="beranda-stat-card__icon beranda-stat-card__icon--purple">
              <Award size={20} />
            </div>
            <div>
              <p className="beranda-stat-card__value">—</p>
              <p className="beranda-stat-card__label">Raport Tersedia</p>
            </div>
          </div>

        </div>
      </section>

      {/* ── Menu aksi cepat ── */}
      <section aria-label="Menu utama">
        <h2 className="beranda-section-title">Menu</h2>
        <div className="beranda-menu-grid">

          <button type="button" className="beranda-menu-card" disabled>
            <div className="beranda-menu-card__icon beranda-menu-card__icon--green">
              <ClipboardCheck size={28} />
            </div>
            <span className="beranda-menu-card__label">Input Amal Santri</span>
            <span className="beranda-menu-card__badge">Segera</span>
          </button>

          <button type="button" className="beranda-menu-card" disabled>
            <div className="beranda-menu-card__icon beranda-menu-card__icon--blue">
              <BookOpen size={28} />
            </div>
            <span className="beranda-menu-card__label">Catatan Akhlak</span>
            <span className="beranda-menu-card__badge">Segera</span>
          </button>

          <button type="button" className="beranda-menu-card" disabled>
            <div className="beranda-menu-card__icon beranda-menu-card__icon--amber">
              <BookOpen size={28} />
            </div>
            <span className="beranda-menu-card__label">Catatan Akademik</span>
            <span className="beranda-menu-card__badge">Segera</span>
          </button>

          <button type="button" className="beranda-menu-card" disabled>
            <div className="beranda-menu-card__icon beranda-menu-card__icon--purple">
              <Award size={28} />
            </div>
            <span className="beranda-menu-card__label">Raport Santri</span>
            <span className="beranda-menu-card__badge">Segera</span>
          </button>

        </div>
      </section>

    </div>
  );
}

export default Beranda;
