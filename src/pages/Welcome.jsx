import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import "./Welcome.css";

function Welcome() {
  const navigate = useNavigate();

  return (
    <div className="welcome-root">

      {/* ── HERO SECTION ── */}
      <section className="welcome-hero">

        {/* Background photo */}
        <img
          src="/images/pondok.jpeg"
          alt="Foto Pondok Pesantren"
          className="welcome-hero__bg"
        />

        {/* Dark overlay agar teks tetap terbaca */}
        <div className="welcome-hero__overlay" />

        {/* Wave decoration — di dalam hero, menempel di dasar foto */}
        <div className="welcome-hero__wave" aria-hidden="true">
          <svg
            viewBox="0 0 1440 130"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
          >
            {/* Layer 1 — hijau muda */}
            <path
              d="M0,55 C180,105 360,15 540,65 C720,115 900,20 1080,70 C1260,115 1380,40 1440,65 L1440,130 L0,130 Z"
              fill="#78DCC0"
              fillOpacity="0.35"
            />
            {/* Layer 2 — hijau tua solid */}
            <path
              d="M0,80 C200,30 400,120 600,75 C800,30 1000,110 1200,65 C1320,40 1400,95 1440,85 L1440,130 L0,130 Z"
              fill="#064E3B"
            />
          </svg>
        </div>

        {/* Content */}
        <div className="welcome-hero__content">

          {/* Logo + identitas */}
          <div className="welcome-brand">
            <img
              src="/images/logo.png"
              alt="Logo Monitoring Santri"
              className="welcome-brand__logo"
              draggable="false"
            />
            <div className="welcome-brand__text">
              <span className="welcome-brand__name">Monitoring Santri</span>
              <span className="welcome-brand__tagline">
                Pantau · Bimbing · Raih Prestasi
              </span>
            </div>
          </div>

          {/* Judul utama */}
          <h1 className="welcome-title">
            Selamat Datang di<br />
            Aplikasi Monitoring Santri
          </h1>

          {/* Deskripsi */}
          <p className="welcome-desc">
            Bersama kita wujudkan proses pembinaan santri yang lebih mudah,
            terukur dan bermakna.
          </p>

          {/* Tombol CTA */}
          <button
            className="welcome-cta"
            onClick={() => navigate("/login")}
            type="button"
          >
            Mulai Sekarang
            <ArrowRight className="welcome-cta__icon" size={20} />
          </button>

          {/* Slogan */}
          <p className="welcome-slogan">Dari Desa Untuk Dunia</p>

        </div>
      </section>

    </div>
  );
}

export default Welcome;
