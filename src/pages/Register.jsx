import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, UserPlus } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import InputField from "../components/InputField";
import PrimaryButton from "../components/PrimaryButton";
import "./Register.css";

/* ─── helpers ─── */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/**
 * Ketentuan password Supabase default:
 *  - Minimal 6 karakter
 * Kita tambahkan satu level di atas itu untuk keamanan yang layak:
 *  - Minimal 8 karakter
 *  - Mengandung huruf dan angka
 */
function getPasswordStrength(pw) {
  if (!pw) return null;
  const hasLetter = /[a-zA-Z]/.test(pw);
  const hasDigit  = /\d/.test(pw);
  if (pw.length < 8)                   return { level: "weak",   label: "Lemah" };
  if (pw.length < 12 || !hasLetter || !hasDigit) return { level: "fair",   label: "Cukup" };
  return { level: "strong", label: "Kuat" };
}

function translateError(msg) {
  const m = msg.toLowerCase();
  if (m.includes("user already registered") || m.includes("already registered"))
    return "Email ini sudah terdaftar. Silakan masuk atau gunakan email lain.";
  if (m.includes("invalid email"))
    return "Format email tidak valid.";
  if (m.includes("password should be at least"))
    return "Kata sandi minimal 6 karakter.";
  if (m.includes("too many requests"))
    return "Terlalu banyak percobaan. Tunggu beberapa menit lalu coba lagi.";
  if (m.includes("network"))
    return "Tidak dapat terhubung. Periksa koneksi internet Anda.";
  return "Pendaftaran gagal. Silakan coba beberapa saat lagi.";
}

/* ════════════════════════════════════════════
   KOMPONEN UTAMA
════════════════════════════════════════════ */
function Register() {
  const navigate = useNavigate();

  /* ── state form ── */
  const [fullName,     setFullName]     = useState("");
  const [email,        setEmail]        = useState("");
  const [password,     setPassword]     = useState("");
  const [confirmPw,    setConfirmPw]    = useState("");
  const [showPw,       setShowPw]       = useState(false);
  const [showConfirm,  setShowConfirm]  = useState(false);

  /* ── state UI ── */
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");
  const [successEmail, setSuccessEmail] = useState(""); // konfirmasi email dikirim

  const pwStrength = getPasswordStrength(password);

  /* ══════════════════════════════
     SUBMIT PENDAFTARAN
  ══════════════════════════════ */
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccessEmail("");

    /* ── Validasi sisi klien ── */
    if (!fullName.trim()) {
      setError("Nama lengkap tidak boleh kosong.");
      return;
    }
    if (fullName.trim().length < 2) {
      setError("Nama lengkap minimal 2 karakter.");
      return;
    }
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
    if (password.length < 8) {
      setError("Kata sandi minimal 8 karakter.");
      return;
    }
    if (!confirmPw) {
      setError("Konfirmasi kata sandi tidak boleh kosong.");
      return;
    }
    if (password !== confirmPw) {
      setError("Kata sandi dan konfirmasi kata sandi tidak sama.");
      return;
    }

    setLoading(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email:    email.trim(),
        password,
        options: {
          data: {
            /* Disimpan di user_metadata — bukan role admin */
            full_name: fullName.trim(),
          },
        },
      });

      if (signUpError) {
        setError(translateError(signUpError.message));
        return;
      }

      /*
       * Dua skenario Supabase:
       *
       * A. Email confirmation AKTIF (default Supabase baru):
       *    data.session === null, data.user.email_confirmed_at === null
       *    → tampilkan pesan "cek email"
       *
       * B. Email confirmation NONAKTIF (dimatikan di dashboard):
       *    data.session ada
       *    → langsung masuk, redirect ke /dashboard
       */
      if (data.session) {
        /* Skenario B — langsung dapat session */
        navigate("/dashboard", { replace: true });
      } else {
        /* Skenario A — perlu konfirmasi email */
        setSuccessEmail(email.trim());
      }
    } catch {
      setError("Terjadi kesalahan jaringan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  /* ══════════════════════════════
     RENDER — layar sukses (email confirmation)
  ══════════════════════════════ */
  if (successEmail) {
    return (
      <div className="register-root">
        <div className="register-bg-deco" aria-hidden="true">
          <div className="register-bg-deco__circle register-bg-deco__circle--tl" />
          <div className="register-bg-deco__circle register-bg-deco__circle--br" />
        </div>

        <div className="register-card register-card--success">
          <div className="register-success__icon" aria-hidden="true">✉</div>
          <h1 className="register-success__title">Cek Email Anda</h1>
          <p className="register-success__body">
            Link konfirmasi telah dikirim ke
          </p>
          <p className="register-success__email">{successEmail}</p>
          <p className="register-success__note">
            Buka email tersebut dan klik link konfirmasi untuk mengaktifkan
            akun Anda. Periksa juga folder Spam jika tidak ada di kotak masuk.
          </p>
          <Link to="/login" className="register-success__back">
            Kembali ke halaman Masuk
          </Link>
        </div>

        <div className="register-wave" aria-hidden="true">
          <svg viewBox="0 0 1440 110" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <path d="M0,50 C180,95 360,10 540,55 C720,100 900,15 1080,60 C1260,100 1380,30 1440,55 L1440,110 L0,110 Z" fill="#78DCC0" fillOpacity="0.4"/>
            <path d="M0,70 C240,20 480,110 720,65 C960,20 1200,100 1440,60 L1440,110 L0,110 Z" fill="#064E3B"/>
          </svg>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════
     RENDER — form pendaftaran
  ══════════════════════════════ */
  return (
    <div className="register-root">

      {/* Dekorasi lingkaran background */}
      <div className="register-bg-deco" aria-hidden="true">
        <div className="register-bg-deco__circle register-bg-deco__circle--tl" />
        <div className="register-bg-deco__circle register-bg-deco__circle--br" />
      </div>

      {/* Kartu utama */}
      <div className="register-card">

        {/* Header */}
        <div className="register-card__header">
          <img
            src="/images/logo.png"
            alt="Logo Monitoring Santri"
            className="register-card__logo"
            draggable="false"
          />
          <div>
            <p className="register-card__app-name">Monitoring Santri</p>
            <p className="register-card__app-tagline">
              Pantau · Bimbing · Raih Prestasi
            </p>
          </div>
          <h1 className="register-card__title">Daftar Akun Baru</h1>
          <p className="register-card__subtitle">
            Lengkapi data berikut untuk membuat akun Monitoring Santri
          </p>
        </div>

        {/* Banner error */}
        {error && (
          <div className="register-banner register-banner--error" role="alert">
            <span className="register-banner__icon" aria-hidden="true">⚠</span>
            {error}
          </div>
        )}

        {/* Form */}
        <form className="register-form" onSubmit={handleSubmit} noValidate>

          {/* Nama Lengkap */}
          <InputField
            label="Nama Lengkap"
            type="text"
            placeholder="Masukkan nama lengkap"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />

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
            <label htmlFor="register-password">Kata Sandi</label>
            <div className="register-pw-wrap">
              <input
                id="register-password"
                type={showPw ? "text" : "password"}
                placeholder="Minimal 8 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="register-pw-toggle"
                onClick={() => setShowPw((v) => !v)}
                aria-label={showPw ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
              >
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Indikator kekuatan password */}
            {pwStrength && (
              <div className="register-pw-strength" aria-live="polite">
                <div className="register-pw-strength__bars">
                  <span className={`register-pw-strength__bar ${pwStrength.level !== "none" ? "active" : ""}`} />
                  <span className={`register-pw-strength__bar ${pwStrength.level === "fair" || pwStrength.level === "strong" ? "active" : ""}`} />
                  <span className={`register-pw-strength__bar ${pwStrength.level === "strong" ? "active" : ""}`} />
                </div>
                <span className={`register-pw-strength__label register-pw-strength__label--${pwStrength.level}`}>
                  {pwStrength.label}
                </span>
              </div>
            )}
          </div>

          {/* Konfirmasi Password */}
          <div className="input-group">
            <label htmlFor="register-confirm-password">Konfirmasi Kata Sandi</label>
            <div className="register-pw-wrap">
              <input
                id="register-confirm-password"
                type={showConfirm ? "text" : "password"}
                placeholder="Ulangi kata sandi"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="register-pw-toggle"
                onClick={() => setShowConfirm((v) => !v)}
                aria-label={showConfirm ? "Sembunyikan konfirmasi" : "Tampilkan konfirmasi"}
              >
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Indikator kecocokan password */}
            {confirmPw && (
              <p
                className={`register-match-hint ${password === confirmPw ? "register-match-hint--ok" : "register-match-hint--err"}`}
                aria-live="polite"
              >
                {password === confirmPw ? "✓ Kata sandi cocok" : "✗ Kata sandi tidak cocok"}
              </p>
            )}
          </div>

          {/* Tombol daftar */}
          <PrimaryButton type="submit" disabled={loading}>
            {loading ? (
              <>
                <span className="register-spinner" aria-hidden="true" />
                Mendaftarkan...
              </>
            ) : (
              <>
                <UserPlus size={18} />
                Daftar
              </>
            )}
          </PrimaryButton>

        </form>

        {/* Footer */}
        <p className="register-card__footer">
          Sudah punya akun?{" "}
          <Link to="/login" className="register-card__link">
            Masuk di sini
          </Link>
        </p>

      </div>

      {/* Gelombang bawah */}
      <div className="register-wave" aria-hidden="true">
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

export default Register;
