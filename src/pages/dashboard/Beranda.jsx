import { useState, useEffect } from "react";
import { BookOpen, Users, ClipboardCheck, Award } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import useAuth from "../../hooks/useAuth";
import "./Beranda.css";

function Beranda() {
  const navigate             = useNavigate();
  const { user, fullName, role } = useAuth();
  const displayName          = fullName || "Pengguna";

  const roleLabel = role === "admin"
    ? "Administrator"
    : role === "ustadz"
    ? "Ustadz / Ustadzah"
    : "Pengguna";

  /* ── Ambil jumlah santri yang diasuh ── */
  const [totalSantri, setTotalSantri] = useState(null); // null = sedang loading

  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from("santri_diasuh")
      .select("id", { count: "exact", head: true })
      .eq("ustadz_id", user.id)
      .then(({ count, error }) => {
        if (!error) setTotalSantri(count ?? 0);
        /* Jika tabel belum ada, biarkan null — ditampilkan sebagai "—" */
      });
  }, [user?.id]);

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
              <p className="beranda-stat-card__value">
                {totalSantri === null ? "…" : totalSantri}
              </p>
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

          <button
            type="button"
            className="beranda-menu-card"
            onClick={() => navigate("/dashboard/amal")}
          >
            <div className="beranda-menu-card__icon beranda-menu-card__icon--green">
              <ClipboardCheck size={28} />
            </div>
            <span className="beranda-menu-card__label">Input Amal Santri</span>
          </button>          <button
            type="button"
            className="beranda-menu-card"
            onClick={() => navigate("/dashboard/akhlak")}
          >
            <div className="beranda-menu-card__icon beranda-menu-card__icon--blue">
              <BookOpen size={28} />
            </div>
            <span className="beranda-menu-card__label">Catatan Akhlak</span>
          </button>

          <button
            type="button"
            className="beranda-menu-card"
            onClick={() => navigate("/dashboard/akademik")}
          >
            <div className="beranda-menu-card__icon beranda-menu-card__icon--amber">
              <BookOpen size={28} />
            </div>
            <span className="beranda-menu-card__label">Catatan Akademik</span>
          </button>

          <button
            type="button"
            className="beranda-menu-card"
            onClick={() => navigate("/dashboard/raport")}
          >
            <div className="beranda-menu-card__icon beranda-menu-card__icon--purple">
              <Award size={28} />
            </div>
            <span className="beranda-menu-card__label">Raport Santri</span>
          </button>

        </div>
      </section>

    </div>
  );
}

export default Beranda;
