import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, LogIn, User } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import PrimaryButton from "../components/PrimaryButton";
import "./Login.css";

/* ─── terjemahan pesan error Supabase ─── */
function translateError(msg) {
  const m = msg.toLowerCase();
  if (m.includes("invalid login credentials") || m.includes("invalid login"))
    return "Nama pengguna atau kata sandi salah.";
  if (m.includes("email not confirmed"))
    return "Akun belum dikonfirmasi. Hubungi administrator.";
  if (m.includes("too many requests"))
    return "Terlalu banyak percobaan. Tunggu beberapa menit lalu coba lagi.";
  if (m.includes("network"))
    return "Tidak dapat terhubung. Periksa koneksi internet Anda.";
  return "Terjadi kesalahan. Silakan coba beberapa saat lagi.";
}

function Login() {
  const navigate = useNavigate();

  /* ── state form ── */
  const [username,     setUsername]     = useState("");
  const [password,     setPassword]     = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe,   setRememberMe]   = useState(false);

  /* ── state UI ── */
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");
  const [forgotNote,   setForgotNote]   = useState(false);

  /* ══════════════════════════════
     LOGIN — cari email dari username
     lalu signInWithPassword
  ══════════════════════════════ */
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setForgotNote(false);

    const usernameClean = username.trim().toLowerCase();

    if (!usernameClean) {
      setError("Nama pengguna tidak boleh kosong.");
      return;
    }
    if (!password) {
      setError("Kata sandi tidak boleh kosong.");
      return;
    }

    setLoading(true);
    try {
      /* ── Langkah 1: cari email dari tabel profiles ── */
      const { data: profile, error: lookupError } = await supabase
        .from("profiles")
        .select("email, is_active")
        .eq("username", usernameClean)
        .maybeSingle();

      if (lookupError) {
        /* Tunjukkan pesan lebih spesifik untuk membantu debug */
        const m = lookupError.message?.toLowerCase() ?? "";
        if (m.includes("column") && m.includes("username")) {
          setError("Konfigurasi belum selesai: kolom username belum tersedia. Hubungi administrator.");
        } else if (m.includes("relation") || m.includes("does not exist")) {
          setError("Konfigurasi belum selesai: tabel profil belum tersedia. Hubungi administrator.");
        } else if (m.includes("permission") || m.includes("rls") || m.includes("policy")) {
          setError("Akses ditolak saat mencari akun. Hubungi administrator.");
        } else {
          setError(`Gagal mencari akun: ${lookupError.message}`);
        }
        return;
      }

      if (!profile) {
        /* Username tidak ditemukan — pesan generik agar tidak bocor info */
        setError("Nama pengguna atau kata sandi salah.");
        return;
      }

      if (!profile.is_active) {
        setError("Akun Anda telah dinonaktifkan. Hubungi administrator.");
        return;
      }

      /* ── Langkah 2: login dengan email yang ditemukan ── */
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: profile.email,
        password,
      });

      if (authError) {
        setError(translateError(authError.message));
        return;
      }

      /* Login berhasil */
      navigate("/dashboard");
    } catch {
      setError("Terjadi kesalahan jaringan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  /* ══════════════════════════════
     LUPA PASSWORD
     Karena pengguna tidak tahu emailnya,
     tampilkan petunjuk menghubungi admin.
  ══════════════════════════════ */
  function handleForgotPassword() {
    setForgotNote((v) => !v);
  }

  /* ══════════════════════════════
     RENDER
  ══════════════════════════════ */
  return (
    <div className="login-root">

      {/* Dekorasi lingkaran background */}
      <div className="login-bg-deco" aria-hidden="true">
        <div className="login-bg-deco__circle login-bg-deco__circle--tl" />
        <div className="login-bg-deco__circle login-bg-deco__circle--br" />
      </div>

      {/* Kartu utama */}
      <div className="login-card">

        {/* Header */}
        <div className="login-card__header">
          <img
            src="/images/logo.png"
            alt="Logo Monitoring Santri"
            className="login-card__logo"
            draggable="false"
          />
          <div>
            <p className="login-card__app-name">Monitoring Santri</p>
            <p className="login-card__app-tagline">
              Pantau · Bimbing · Raih Prestasi
            </p>
          </div>
          <h1 className="login-card__title">Masuk ke Akun Anda</h1>
          <p className="login-card__subtitle">
            Silakan login untuk melanjutkan ke aplikasi Monitoring Santri
          </p>
        </div>

        {/* Banner error */}
        {error && (
          <div className="login-banner login-banner--error" role="alert">
            <span className="login-banner__icon">⚠</span>
            {error}
          </div>
        )}

        {/* Petunjuk lupa password */}
        {forgotNote && (
          <div className="login-banner login-banner--info" role="status">
            <span className="login-banner__icon">ℹ</span>
            Hubungi administrator untuk mereset kata sandi Anda.
          </div>
        )}

        {/* Form login */}
        <form className="login-form" onSubmit={handleSubmit} noValidate>

          {/* Nama Pengguna */}
          <div className="input-group">
            <label htmlFor="login-username">Nama Pengguna</label>
            <div className="login-username-wrap">
              <span className="login-username-wrap__icon" aria-hidden="true">
                <User size={17} />
              </span>
              <input
                id="login-username"
                type="text"
                placeholder="Masukkan nama pengguna"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                autoCapitalize="none"
                spellCheck="false"
              />
            </div>
          </div>

          {/* Kata Sandi */}
          <div className="input-group">
            <label htmlFor="login-password">Kata Sandi</label>
            <div className="login-pw-wrap">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                placeholder="Masukkan kata sandi"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="login-pw-toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Ingat Saya + Lupa Password */}
          <div className="login-row">
            <label className="login-remember">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>Ingat Saya</span>
            </label>
            <button
              type="button"
              className="login-forgot-btn"
              onClick={handleForgotPassword}
              disabled={loading}
            >
              Lupa Password?
            </button>
          </div>

          {/* Tombol masuk */}
          <PrimaryButton type="submit" disabled={loading}>
            {loading ? (
              <>
                <span className="login-spinner" aria-hidden="true" />
                Memproses...
              </>
            ) : (
              <>
                <LogIn size={18} />
                Masuk
              </>
            )}
          </PrimaryButton>

        </form>

      </div>

      {/* Gelombang bawah */}
      <div className="login-wave" aria-hidden="true">
        <svg
          viewBox="0 0 1440 110"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
        >
          <path
            d="M0,50 C180,95 360,10 540,55 C720,100 900,15 1080,60 C1260,100 1380,30 1440,55 L1440,110 L0,110 Z"
            fill="#78DCC0"
            fillOpacity="0.4"
          />
          <path
            d="M0,70 C240,20 480,110 720,65 C960,20 1200,100 1440,60 L1440,110 L0,110 Z"
            fill="#064E3B"
          />
        </svg>
      </div>

    </div>
  );
}

export default Login;
