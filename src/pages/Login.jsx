import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import InputField from "../components/InputField";
import PrimaryButton from "../components/PrimaryButton";
import "./Login.css";

/* ─── helpers ─── */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

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
  const [email,        setEmail]        = useState("");
  const [password,     setPassword]     = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe,   setRememberMe]   = useState(false);

  /* ── state UI ── */
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");
  const [forgotSent,   setForgotSent]   = useState(false);

  /* ══════════════════════════════
     LOGIN EMAIL + PASSWORD
  ══════════════════════════════ */
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setForgotSent(false);

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

        {/* Banner sukses reset password */}
        {forgotSent && (
          <div className="login-banner login-banner--success" role="status">
            <span className="login-banner__icon">✓</span>
            Link reset password telah dikirim ke{" "}
            <strong>{email}</strong>. Periksa kotak masuk email Anda.
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

        {/* Link daftar */}
        <p className="login-card__footer">
          Belum punya akun?{" "}
          <Link to="/register" className="login-card__link">
            Daftar di sini
          </Link>
        </p>

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
