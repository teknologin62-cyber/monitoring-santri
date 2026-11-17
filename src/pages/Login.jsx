import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import InputField from "../components/InputField";
import PrimaryButton from "../components/PrimaryButton";
import "./Login.css";

/* ─── validasi email sederhana ─── */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/* ─── terjemahan pesan error Supabase ─── */
function translateError(msg) {
  const m = msg.toLowerCase();
  if (m.includes("invalid login credentials") || m.includes("invalid login"))
    return "Email atau kata sandi salah. Silakan coba lagi.";
  if (m.includes("email not confirmed"))
    return "Akun belum dikonfirmasi. Periksa kotak masuk email Anda.";
  if (m.includes("too many requests"))
    return "Terlalu banyak percobaan. Tunggu beberapa menit lalu coba lagi.";
  if (m.includes("user not found"))
    return "Akun dengan email ini tidak ditemukan.";
  if (m.includes("network"))
    return "Tidak dapat terhubung. Periksa koneksi internet Anda.";
  return "Terjadi kesalahan. Silakan coba beberapa saat lagi.";
}

function Login() {
  const navigate = useNavigate();

  /* ── state form ── */
  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe]     = useState(false);

  /* ── state UI ── */
  const [loading, setLoading]           = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError]               = useState("");
  const [forgotSent, setForgotSent]     = useState(false);

  /* ══════════════════════════════
     LOGIN EMAIL + PASSWORD
  ══════════════════════════════ */
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setForgotSent(false);

    /* Validasi sisi klien */
    if (!email.trim()) {
      setError("Email tidak boleh kosong.");
      return;
    }
    if (!isValidEmail(email)) {
      setError("Format email tidak valid.");
      return;
    }
    if (!password) {
      setError("Kata sandi tidak boleh kosong.");
      return;
    }
    if (password.length < 6) {
      setError("Kata sandi minimal 6 karakter.");
      return;
    }

    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
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
  ══════════════════════════════ */
  async function handleForgotPassword(e) {
    e.preventDefault();
    setError("");
    setForgotSent(false);

    if (!email.trim()) {
      setError("Isi email terlebih dahulu, lalu klik Lupa Password.");
      return;
    }
    if (!isValidEmail(email)) {
      setError("Format email tidak valid.");
      return;
    }

    setLoading(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        { redirectTo: `${window.location.origin}/reset-password` }
      );
      if (resetError) {
        setError(translateError(resetError.message));
        return;
      }
      setForgotSent(true);
    } catch {
      setError("Gagal mengirim email. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  /* ══════════════════════════════
     GOOGLE OAUTH
     Hanya berjalan jika provider Google
     sudah dikonfigurasi di Supabase dashboard.
  ══════════════════════════════ */
  async function handleGoogleLogin() {
    setError("");
    setGoogleLoading(true);
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (oauthError) {
        setError(
          "Login Google gagal. Pastikan provider Google sudah diaktifkan " +
          "di Supabase Authentication → Providers."
        );
      }
      /* Jika berhasil, Supabase akan redirect otomatis ke Google */
    } catch {
      setError("Terjadi kesalahan saat menghubungi Google.");
    } finally {
      setGoogleLoading(false);
    }
  }

  /* ══════════════════════════════
     RENDER
  ══════════════════════════════ */
  return (
    <div className="login-root">

      {/* ── Dekorasi lingkaran background ── */}
      <div className="login-bg-deco" aria-hidden="true">
        <div className="login-bg-deco__circle login-bg-deco__circle--tl" />
        <div className="login-bg-deco__circle login-bg-deco__circle--br" />
      </div>

      {/* ── Kartu utama ── */}
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

        {/* Banner sukses reset password */}
        {forgotSent && (
          <div className="login-banner login-banner--success" role="status">
            <span className="login-banner__icon">✓</span>
            Link reset password telah dikirim ke <strong>{email}</strong>.
            Periksa kotak masuk email Anda.
          </div>
        )}

        {/* Form login */}
        <form className="login-form" onSubmit={handleSubmit} noValidate>

          {/* Email */}
          <InputField
            label="Email"
            type="email"
            placeholder="contoh@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          {/* Password */}
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
                aria-label={
                  showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"
                }
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Ingat saya + Lupa password */}
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
          <PrimaryButton type="submit" disabled={loading || googleLoading}>
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

        {/* Pemisah "atau" */}
        <div className="login-divider" aria-hidden="true">
          <span />
          <p>atau</p>
          <span />
        </div>

        {/* Tombol Google */}
        <button
          type="button"
          className="login-google-btn"
          onClick={handleGoogleLogin}
          disabled={loading || googleLoading}
          aria-label="Masuk dengan Google"
        >
          {googleLoading ? (
            <span className="login-spinner login-spinner--dark" aria-hidden="true" />
          ) : (
            /* Google "G" icon SVG */
            <svg
              className="login-google-btn__icon"
              viewBox="0 0 24 24"
              aria-hidden="true"
              focusable="false"
            >
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
          )}
          {googleLoading ? "Menghubungkan..." : "Masuk dengan Google"}
        </button>

        {/* Link daftar — dihapus (register publik dinonaktifkan v3.2) */}

      </div>

      {/* ── Dekorasi gelombang bawah ── */}
      <div className="login-wave" aria-hidden="true">
        <svg
          viewBox="0 0 1440 110"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
        >
          {/* Layer hijau muda */}
          <path
            d="M0,50 C180,95 360,10 540,55 C720,100 900,15 1080,60 C1260,100 1380,30 1440,55 L1440,110 L0,110 Z"
            fill="#78DCC0"
            fillOpacity="0.4"
          />
          {/* Layer hijau tua */}
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
