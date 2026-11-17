import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mail, User, Shield, LogOut,
  Pencil, KeyRound, Check, X, Eye, EyeOff,
} from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import useAuth from "../../hooks/useAuth";
import "./Profil.css";

/* ─── helpers ─── */
function isStrongEnough(pw) {
  return pw.length >= 8;
}

/* ════════════════════════════════════════════
   KOMPONEN UTAMA
════════════════════════════════════════════ */
function Profil() {
  const navigate = useNavigate();
  const { fullName, email, role, initials, loading: authLoading } = useAuth();

  /* ── label role ── */
  const roleLabel =
    role === "admin" ? "Administrator" :
    role === "ustadz" ? "Ustadz / Ustadzah" : "Pengguna";

  /* ══════════════════════════════
     STATE — edit nama
  ══════════════════════════════ */
  const [editingName, setEditingName] = useState(false);
  const [newName,     setNewName]     = useState("");
  const [nameLoading, setNameLoading] = useState(false);
  const [nameMsg,     setNameMsg]     = useState({ type: "", text: "" });

  function startEditName() {
    setNewName(fullName);
    setNameMsg({ type: "", text: "" });
    setEditingName(true);
  }

  function cancelEditName() {
    setEditingName(false);
    setNameMsg({ type: "", text: "" });
  }

  async function saveName() {
    const trimmed = newName.trim();
    if (!trimmed) {
      setNameMsg({ type: "error", text: "Nama tidak boleh kosong." });
      return;
    }
    if (trimmed.length < 2) {
      setNameMsg({ type: "error", text: "Nama minimal 2 karakter." });
      return;
    }
    if (trimmed === fullName) {
      setEditingName(false);
      return;
    }

    setNameLoading(true);
    setNameMsg({ type: "", text: "" });
    try {
      /* 1. Update user_metadata di Supabase Auth */
      const { error: authErr } = await supabase.auth.updateUser({
        data: { full_name: trimmed },
      });
      if (authErr) throw authErr;

      /* 2. Update kolom full_name di tabel profiles */
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        const { error: dbErr } = await supabase
          .from("profiles")
          .update({ full_name: trimmed })
          .eq("id", session.user.id);
        if (dbErr) throw dbErr;
      }

      setNameMsg({ type: "success", text: "Nama berhasil diperbarui." });
      setEditingName(false);
      /* onAuthStateChange di useAuth akan memperbarui fullName otomatis */
    } catch (err) {
      setNameMsg({
        type: "error",
        text: err?.message?.includes("network")
          ? "Tidak dapat terhubung. Periksa koneksi Anda."
          : "Gagal memperbarui nama. Silakan coba lagi.",
      });
    } finally {
      setNameLoading(false);
    }
  }

  /* ══════════════════════════════
     STATE — ganti password
  ══════════════════════════════ */
  const [changingPw,  setChangingPw]  = useState(false);
  const [newPw,       setNewPw]       = useState("");
  const [confirmPw,   setConfirmPw]   = useState("");
  const [showNewPw,   setShowNewPw]   = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwLoading,   setPwLoading]   = useState(false);
  const [pwMsg,       setPwMsg]       = useState({ type: "", text: "" });

  function startChangePw() {
    setNewPw("");
    setConfirmPw("");
    setPwMsg({ type: "", text: "" });
    setChangingPw(true);
  }

  function cancelChangePw() {
    setChangingPw(false);
    setPwMsg({ type: "", text: "" });
  }

  async function savePassword() {
    setPwMsg({ type: "", text: "" });
    if (!newPw) {
      setPwMsg({ type: "error", text: "Kata sandi baru tidak boleh kosong." });
      return;
    }
    if (!isStrongEnough(newPw)) {
      setPwMsg({ type: "error", text: "Kata sandi minimal 8 karakter." });
      return;
    }
    if (newPw !== confirmPw) {
      setPwMsg({ type: "error", text: "Konfirmasi kata sandi tidak cocok." });
      return;
    }

    setPwLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPw });
      if (error) throw error;
      setPwMsg({ type: "success", text: "Kata sandi berhasil diperbarui." });
      setChangingPw(false);
      setNewPw("");
      setConfirmPw("");
    } catch (err) {
      const m = err?.message?.toLowerCase() ?? "";
      if (m.includes("same password"))
        setPwMsg({ type: "error", text: "Kata sandi baru tidak boleh sama dengan yang lama." });
      else if (m.includes("weak"))
        setPwMsg({ type: "error", text: "Kata sandi terlalu lemah. Gunakan kombinasi huruf dan angka." });
      else
        setPwMsg({ type: "error", text: "Gagal memperbarui kata sandi. Silakan coba lagi." });
    } finally {
      setPwLoading(false);
    }
  }

  /* ══════════════════════════════
     STATE — logout
  ══════════════════════════════ */
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [loggingOut,    setLoggingOut]    = useState(false);

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  }

  /* ══════════════════════════════
     RENDER
  ══════════════════════════════ */
  if (authLoading) {
    return (
      <div className="profil-loading" aria-label="Memuat profil">
        <div className="profil-loading__spinner" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className="profil-root">
      <h1 className="profil-title">Profil Saya</h1>

      {/* ── Kartu identitas ── */}
      <div className="profil-hero">
        <div className="profil-hero__avatar" aria-label={`Avatar ${fullName}`}>
          {initials}
        </div>
        <div className="profil-hero__info">
          <p className="profil-hero__name">{fullName || "—"}</p>
          <span className="profil-hero__badge">{roleLabel}</span>
        </div>
      </div>

      {/* ── Pesan global (nama / password) ── */}
      {(nameMsg.text && !editingName) && (
        <div
          className={`profil-msg profil-msg--${nameMsg.type}`}
          role={nameMsg.type === "error" ? "alert" : "status"}
        >
          {nameMsg.type === "success" ? "✓" : "⚠"} {nameMsg.text}
        </div>
      )}
      {(pwMsg.text && !changingPw) && (
        <div
          className={`profil-msg profil-msg--${pwMsg.type}`}
          role={pwMsg.type === "error" ? "alert" : "status"}
        >
          {pwMsg.type === "success" ? "✓" : "⚠"} {pwMsg.text}
        </div>
      )}

      {/* ══════════════════════════════
          DETAIL INFORMASI
      ══════════════════════════════ */}
      <div className="profil-section">

        {/* ── Nama Lengkap ── */}
        <div className="profil-row">
          <div className="profil-row__icon" aria-hidden="true">
            <User size={18} />
          </div>
          <div className="profil-row__body">
            <p className="profil-row__label">Nama Lengkap</p>

            {editingName ? (
              /* ─ Mode edit ─ */
              <div className="profil-edit-name">
                <input
                  className="profil-edit-name__input"
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  autoFocus
                  maxLength={80}
                  placeholder="Nama lengkap"
                  aria-label="Nama lengkap baru"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveName();
                    if (e.key === "Escape") cancelEditName();
                  }}
                />
                {nameMsg.text && (
                  <p className="profil-edit-name__hint profil-edit-name__hint--error">
                    {nameMsg.text}
                  </p>
                )}
                <div className="profil-edit-name__actions">
                  <button
                    type="button"
                    className="profil-action-btn profil-action-btn--save"
                    onClick={saveName}
                    disabled={nameLoading}
                    aria-label="Simpan nama"
                  >
                    {nameLoading
                      ? <span className="profil-spinner" aria-hidden="true" />
                      : <Check size={16} />}
                    {nameLoading ? "Menyimpan..." : "Simpan"}
                  </button>
                  <button
                    type="button"
                    className="profil-action-btn profil-action-btn--cancel"
                    onClick={cancelEditName}
                    disabled={nameLoading}
                    aria-label="Batal edit nama"
                  >
                    <X size={16} />
                    Batal
                  </button>
                </div>
              </div>
            ) : (
              /* ─ Mode tampil ─ */
              <div className="profil-row__display">
                <p className="profil-row__value">{fullName || "Belum diatur"}</p>
                <button
                  type="button"
                  className="profil-inline-btn"
                  onClick={startEditName}
                  aria-label="Edit nama lengkap"
                >
                  <Pencil size={14} />
                  Edit
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="profil-divider" />

        {/* ── Email (read-only) ── */}
        <div className="profil-row">
          <div className="profil-row__icon" aria-hidden="true">
            <Mail size={18} />
          </div>
          <div className="profil-row__body">
            <p className="profil-row__label">Email</p>
            <p className="profil-row__value">{email || "—"}</p>
            <p className="profil-row__note">Email tidak dapat diubah langsung.</p>
          </div>
        </div>

        <div className="profil-divider" />

        {/* ── Role (read-only) ── */}
        <div className="profil-row">
          <div className="profil-row__icon" aria-hidden="true">
            <Shield size={18} />
          </div>
          <div className="profil-row__body">
            <p className="profil-row__label">Peran</p>
            <p className="profil-row__value">{roleLabel}</p>
            <p className="profil-row__note">Peran hanya dapat diubah oleh administrator.</p>
          </div>
        </div>

      </div>

      {/* ══════════════════════════════
          GANTI KATA SANDI
      ══════════════════════════════ */}
      <div className="profil-section">
        <div className="profil-section__header">
          <div className="profil-row__icon profil-row__icon--sm" aria-hidden="true">
            <KeyRound size={18} />
          </div>
          <p className="profil-section__title">Kata Sandi</p>
        </div>

        {changingPw ? (
          /* ─ Form ganti password ─ */
          <div className="profil-pw-form">

            {/* Password baru */}
            <div className="profil-pw-field">
              <label htmlFor="profil-new-pw" className="profil-pw-field__label">
                Kata Sandi Baru
              </label>
              <div className="profil-pw-field__wrap">
                <input
                  id="profil-new-pw"
                  type={showNewPw ? "text" : "password"}
                  className="profil-pw-field__input"
                  placeholder="Minimal 8 karakter"
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="profil-pw-toggle"
                  onClick={() => setShowNewPw((v) => !v)}
                  aria-label={showNewPw ? "Sembunyikan" : "Tampilkan"}
                >
                  {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Konfirmasi password baru */}
            <div className="profil-pw-field">
              <label htmlFor="profil-confirm-pw" className="profil-pw-field__label">
                Konfirmasi Kata Sandi Baru
              </label>
              <div className="profil-pw-field__wrap">
                <input
                  id="profil-confirm-pw"
                  type={showConfirm ? "text" : "password"}
                  className="profil-pw-field__input"
                  placeholder="Ulangi kata sandi baru"
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="profil-pw-toggle"
                  onClick={() => setShowConfirm((v) => !v)}
                  aria-label={showConfirm ? "Sembunyikan" : "Tampilkan"}
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {/* Indikator kecocokan */}
              {confirmPw && (
                <p className={`profil-pw-match ${newPw === confirmPw ? "profil-pw-match--ok" : "profil-pw-match--err"}`}>
                  {newPw === confirmPw ? "✓ Kata sandi cocok" : "✗ Kata sandi tidak cocok"}
                </p>
              )}
            </div>

            {/* Pesan error/sukses dalam form */}
            {pwMsg.text && (
              <p className={`profil-pw-msg profil-pw-msg--${pwMsg.type}`} role="alert">
                {pwMsg.text}
              </p>
            )}

            <div className="profil-pw-actions">
              <button
                type="button"
                className="profil-action-btn profil-action-btn--save"
                onClick={savePassword}
                disabled={pwLoading}
              >
                {pwLoading
                  ? <span className="profil-spinner" aria-hidden="true" />
                  : <Check size={16} />}
                {pwLoading ? "Menyimpan..." : "Simpan Kata Sandi"}
              </button>
              <button
                type="button"
                className="profil-action-btn profil-action-btn--cancel"
                onClick={cancelChangePw}
                disabled={pwLoading}
              >
                <X size={16} />
                Batal
              </button>
            </div>
          </div>
        ) : (
          /* ─ Tombol buka form ─ */
          <div className="profil-pw-idle">
            <p className="profil-pw-idle__desc">
              Disarankan menggunakan kata sandi yang kuat dan unik.
            </p>
            <button
              type="button"
              className="profil-change-pw-btn"
              onClick={startChangePw}
            >
              <KeyRound size={16} />
              Ganti Kata Sandi
            </button>
          </div>
        )}
      </div>

      {/* ══════════════════════════════
          TOMBOL LOGOUT
      ══════════════════════════════ */}
      {confirmLogout ? (
        /* ─ Konfirmasi logout ─ */
        <div className="profil-logout-confirm">
          <p className="profil-logout-confirm__text">
            Yakin ingin keluar dari aplikasi?
          </p>
          <div className="profil-logout-confirm__actions">
            <button
              type="button"
              className="profil-action-btn profil-action-btn--danger"
              onClick={handleLogout}
              disabled={loggingOut}
            >
              {loggingOut
                ? <span className="profil-spinner profil-spinner--white" aria-hidden="true" />
                : <LogOut size={16} />}
              {loggingOut ? "Keluar..." : "Ya, Keluar"}
            </button>
            <button
              type="button"
              className="profil-action-btn profil-action-btn--cancel"
              onClick={() => setConfirmLogout(false)}
              disabled={loggingOut}
            >
              <X size={16} />
              Batal
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="profil-logout-btn"
          onClick={() => setConfirmLogout(true)}
        >
          <LogOut size={18} />
          Keluar dari Aplikasi
        </button>
      )}

    </div>
  );
}

export default Profil;
