import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mail, User, Shield, LogOut,
  Pencil, KeyRound, Check, X, Eye, EyeOff,
  Camera, Trash2, Users, Plus, GraduationCap,
} from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import useAuth from "../../hooks/useAuth";
import "./Profil.css";

/* ─── konstanta ─── */
const BUCKET        = "avatars";
const MAX_SIZE_MB   = 2;
const MAX_SIZE_BYTE = MAX_SIZE_MB * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

/* ─── helpers ─── */
function isStrongEnough(pw) { return pw.length >= 8; }

function getAvatarUrl(path) {
  if (!path) return null;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data?.publicUrl ?? null;
}

/* ════════════════════════════════════════════
   KOMPONEN UTAMA
════════════════════════════════════════════ */
function Profil() {
  const navigate  = useNavigate();
  const fileInput = useRef(null);

  const {
    user,
    fullName,
    email,
    role,
    initials,
    loading: authLoading,
  } = useAuth();

  const roleLabel =
    role === "admin"   ? "Administrator"      :
    role === "ustadz"  ? "Ustadz / Ustadzah"  : "Pengguna";

  /* Avatar URL dari user_metadata atau tabel profiles */
  const savedAvatarPath = user?.user_metadata?.avatar_path ?? null;
  const avatarUrl       = getAvatarUrl(savedAvatarPath);

  /* ══════════════════════════════
     STATE — foto profil
  ══════════════════════════════ */
  const [preview,      setPreview]      = useState(null);   // blob URL sementara
  const [selectedFile, setSelectedFile] = useState(null);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [photoMsg,     setPhotoMsg]     = useState({ type: "", text: "" });
  const [showPhotoMenu, setShowPhotoMenu] = useState(false);

  /* Validasi dan buat preview lokal */
  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!e.target.files?.length) return;
    e.target.value = "";           // reset input agar bisa pilih file sama

    setPhotoMsg({ type: "", text: "" });

    if (!ALLOWED_TYPES.includes(file.type)) {
      setPhotoMsg({ type: "error", text: "Format tidak didukung. Gunakan JPG, PNG, atau WebP." });
      return;
    }
    if (file.size > MAX_SIZE_BYTE) {
      setPhotoMsg({ type: "error", text: `Ukuran file maksimal ${MAX_SIZE_MB} MB.` });
      return;
    }

    /* Revoke URL lama agar tidak bocor memori */
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(file));
    setSelectedFile(file);
    setShowPhotoMenu(false);
  }

  /* Upload ke Supabase Storage, simpan path ke metadata + profiles */
  const uploadPhoto = useCallback(async () => {
    if (!selectedFile || !user?.id) return;

    setPhotoLoading(true);
    setPhotoMsg({ type: "", text: "" });
    try {
      /* 1. Tentukan path: avatars/{user_id}/{timestamp}.{ext} */
      const ext  = selectedFile.name.split(".").pop().toLowerCase();
      const path = `${user.id}/${Date.now()}.${ext}`;

      /* 2. Upload (upsert agar file lama tertimpa) */
      const { error: uploadErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, selectedFile, { upsert: true, contentType: selectedFile.type });
      if (uploadErr) throw uploadErr;

      /* 3. Hapus foto lama jika ada */
      if (savedAvatarPath && savedAvatarPath !== path) {
        await supabase.storage.from(BUCKET).remove([savedAvatarPath]);
      }

      /* 4. Simpan path ke user_metadata */
      const { error: authErr } = await supabase.auth.updateUser({
        data: { avatar_path: path },
      });
      if (authErr) throw authErr;

      /* 5. Simpan path ke tabel profiles */
      const { error: dbErr } = await supabase
        .from("profiles")
        .update({ avatar_url: getAvatarUrl(path) })
        .eq("id", user.id);
      /* Abaikan error DB jika tabel belum punya kolom — tidak critical */
      if (dbErr) console.warn("profiles.avatar_url update skipped:", dbErr.message);

      /* Bersihkan state preview */
      if (preview) URL.revokeObjectURL(preview);
      setPreview(null);
      setSelectedFile(null);
      setPhotoMsg({ type: "success", text: "Foto profil berhasil diperbarui." });
    } catch (err) {
      setPhotoMsg({
        type: "error",
        text: err?.message?.includes("not found")
          ? "Bucket storage belum dikonfigurasi. Jalankan SQL migration terlebih dahulu."
          : "Gagal mengunggah foto. Silakan coba lagi.",
      });
    } finally {
      setPhotoLoading(false);
    }
  }, [selectedFile, user, savedAvatarPath, preview]);

  /* Hapus foto profil */
  async function removePhoto() {
    if (!savedAvatarPath || !user?.id) return;
    setPhotoLoading(true);
    setPhotoMsg({ type: "", text: "" });
    setShowPhotoMenu(false);
    try {
      await supabase.storage.from(BUCKET).remove([savedAvatarPath]);

      await supabase.auth.updateUser({ data: { avatar_path: null } });

      await supabase
        .from("profiles")
        .update({ avatar_url: null })
        .eq("id", user.id);

      if (preview) { URL.revokeObjectURL(preview); setPreview(null); }
      setSelectedFile(null);
      setPhotoMsg({ type: "success", text: "Foto profil berhasil dihapus." });
    } catch {
      setPhotoMsg({ type: "error", text: "Gagal menghapus foto. Silakan coba lagi." });
    } finally {
      setPhotoLoading(false);
    }
  }

  function cancelPreview() {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setSelectedFile(null);
    setPhotoMsg({ type: "", text: "" });
  }

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
    if (!trimmed) { setNameMsg({ type: "error", text: "Nama tidak boleh kosong." }); return; }
    if (trimmed.length < 2) { setNameMsg({ type: "error", text: "Nama minimal 2 karakter." }); return; }
    if (trimmed === fullName) { setEditingName(false); return; }

    setNameLoading(true);
    setNameMsg({ type: "", text: "" });
    try {
      const { error: authErr } = await supabase.auth.updateUser({ data: { full_name: trimmed } });
      if (authErr) throw authErr;

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        const { error: dbErr } = await supabase
          .from("profiles").update({ full_name: trimmed }).eq("id", session.user.id);
        if (dbErr) throw dbErr;
      }
      setNameMsg({ type: "success", text: "Nama berhasil diperbarui." });
      setEditingName(false);
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

  function startChangePw() { setNewPw(""); setConfirmPw(""); setPwMsg({ type: "", text: "" }); setChangingPw(true); }
  function cancelChangePw() { setChangingPw(false); setPwMsg({ type: "", text: "" }); }

  async function savePassword() {
    setPwMsg({ type: "", text: "" });
    if (!newPw) { setPwMsg({ type: "error", text: "Kata sandi baru tidak boleh kosong." }); return; }
    if (!isStrongEnough(newPw)) { setPwMsg({ type: "error", text: "Kata sandi minimal 8 karakter." }); return; }
    if (newPw !== confirmPw) { setPwMsg({ type: "error", text: "Konfirmasi kata sandi tidak cocok." }); return; }

    setPwLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPw });
      if (error) throw error;
      setPwMsg({ type: "success", text: "Kata sandi berhasil diperbarui." });
      setChangingPw(false);
      setNewPw(""); setConfirmPw("");
    } catch (err) {
      const m = err?.message?.toLowerCase() ?? "";
      setPwMsg({
        type: "error",
        text: m.includes("same password") ? "Kata sandi baru tidak boleh sama dengan yang lama."
            : m.includes("weak")          ? "Kata sandi terlalu lemah. Gunakan kombinasi huruf dan angka."
            : "Gagal memperbarui kata sandi. Silakan coba lagi.",
      });
    } finally {
      setPwLoading(false);
    }
  }

  /* ══════════════════════════════
     STATE — santri yang diasuh
  ══════════════════════════════ */
  const [santriList,    setSantriList]    = useState([]);
  const [santriLoading, setSantriLoading] = useState(false);
  const [santriMsg,     setSantriMsg]     = useState({ type: "", text: "" });

  /* Form tambah santri */
  const [showAddForm,   setShowAddForm]   = useState(false);
  const [newNama,       setNewNama]       = useState("");
  const [newKelas,      setNewKelas]      = useState("");
  const [addLoading,    setAddLoading]    = useState(false);
  const [addMsg,        setAddMsg]        = useState({ type: "", text: "" });

  /* Muat daftar santri dari Supabase */
  const loadSantri = useCallback(async () => {
    if (!user?.id) return;
    setSantriLoading(true);
    setSantriMsg({ type: "", text: "" });
    try {
      const { data, error } = await supabase
        .from("santri_diasuh")
        .select("*")
        .eq("ustadz_id", user.id)
        .order("nama_santri", { ascending: true });
      if (error) throw error;
      setSantriList(data ?? []);
    } catch (err) {
      const m = err?.message?.toLowerCase() ?? "";
      if (m.includes("does not exist") || m.includes("relation")) {
        setSantriMsg({ type: "info", text: "Tabel santri belum tersedia. Jalankan SQL migration." });
      } else {
        setSantriMsg({ type: "error", text: "Gagal memuat daftar santri." });
      }
    } finally {
      setSantriLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { loadSantri(); }, [loadSantri]);

  /* Tambah santri baru */
  async function handleAddSantri() {
    setAddMsg({ type: "", text: "" });
    const nama  = newNama.trim();
    const kelas = newKelas.trim();
    if (!nama)  { setAddMsg({ type: "error", text: "Nama santri tidak boleh kosong." }); return; }
    if (!kelas) { setAddMsg({ type: "error", text: "Kelas tidak boleh kosong." }); return; }

    setAddLoading(true);
    try {
      const { error } = await supabase
        .from("santri_diasuh")
        .insert({ ustadz_id: user.id, nama_santri: nama, kelas });
      if (error) throw error;
      setNewNama("");
      setNewKelas("");
      setShowAddForm(false);
      await loadSantri();
      setSantriMsg({ type: "success", text: `Santri "${nama}" berhasil ditambahkan.` });
    } catch (err) {
      const m = err?.message?.toLowerCase() ?? "";
      if (m.includes("duplicate") || m.includes("unique")) {
        setAddMsg({ type: "error", text: "Santri dengan nama ini sudah ada." });
      } else {
        setAddMsg({ type: "error", text: `Gagal menambahkan: ${err?.message ?? "Silakan coba lagi."}` });
      }
    } finally {
      setAddLoading(false);
    }
  }

  /* Hapus santri */
  async function handleDeleteSantri(id, nama) {
    if (!window.confirm(`Hapus santri "${nama}" dari daftar Anda?`)) return;
    try {
      const { error } = await supabase
        .from("santri_diasuh")
        .delete()
        .eq("id", id)
        .eq("ustadz_id", user.id);
      if (error) throw error;
      await loadSantri();
      setSantriMsg({ type: "success", text: `Santri "${nama}" dihapus dari daftar.` });
    } catch {
      setSantriMsg({ type: "error", text: "Gagal menghapus santri." });
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

  /* Tentukan gambar yang ditampilkan di hero */
  const displaySrc = preview || avatarUrl;

  return (
    <div className="profil-root">
      <h1 className="profil-title">Profil Saya</h1>

      {/* ═══════════════════════════════
          KARTU HERO — foto + nama
      ═══════════════════════════════ */}
      <div className="profil-hero">

        {/* Avatar / foto */}
        <div className="profil-avatar-wrap">
          {displaySrc ? (
            <img
              src={displaySrc}
              alt={`Foto ${fullName}`}
              className="profil-avatar-img"
            />
          ) : (
            <div className="profil-avatar-initials" aria-label={`Avatar ${fullName}`}>
              {initials}
            </div>
          )}

          {/* Tombol kamera — buka menu */}
          <button
            type="button"
            className="profil-avatar-camera-btn"
            onClick={() => setShowPhotoMenu((v) => !v)}
            disabled={photoLoading}
            aria-label="Ubah foto profil"
          >
            {photoLoading
              ? <span className="profil-spinner-sm" aria-hidden="true" />
              : <Camera size={14} />}
          </button>

          {/* Input file tersembunyi */}
          <input
            ref={fileInput}
            type="file"
            accept={ALLOWED_TYPES.join(",")}
            className="profil-file-input"
            onChange={handleFileChange}
            aria-hidden="true"
            tabIndex={-1}
          />

          {/* Dropdown menu foto */}
          {showPhotoMenu && (
            <div className="profil-photo-menu" role="menu">
              <button
                type="button"
                role="menuitem"
                className="profil-photo-menu__item"
                onClick={() => { setShowPhotoMenu(false); fileInput.current?.click(); }}
              >
                <Camera size={15} />
                {avatarUrl || preview ? "Ganti Foto" : "Unggah Foto"}
              </button>
              {(avatarUrl || preview) && (
                <button
                  type="button"
                  role="menuitem"
                  className="profil-photo-menu__item profil-photo-menu__item--danger"
                  onClick={removePhoto}
                >
                  <Trash2 size={15} />
                  Hapus Foto
                </button>
              )}
            </div>
          )}
        </div>

        {/* Info nama + role */}
        <div className="profil-hero__info">
          <p className="profil-hero__name">{fullName || "—"}</p>
          <span className="profil-hero__badge">{roleLabel}</span>
        </div>
      </div>

      {/* ── Overlay backdrop menu foto ── */}
      {showPhotoMenu && (
        <div
          className="profil-photo-backdrop"
          onClick={() => setShowPhotoMenu(false)}
          aria-hidden="true"
        />
      )}

      {/* ═══════════════════════════════
          PREVIEW + AKSI FOTO BARU
      ═══════════════════════════════ */}
      {selectedFile && (
        <div className="profil-photo-preview-bar">
          <div className="profil-photo-preview-bar__left">
            <img src={preview} alt="Preview" className="profil-photo-preview-bar__thumb" />
            <div>
              <p className="profil-photo-preview-bar__filename">{selectedFile.name}</p>
              <p className="profil-photo-preview-bar__size">
                {(selectedFile.size / 1024).toFixed(0)} KB
              </p>
            </div>
          </div>
          <div className="profil-photo-preview-bar__actions">
            <button
              type="button"
              className="profil-action-btn profil-action-btn--save"
              onClick={uploadPhoto}
              disabled={photoLoading}
            >
              {photoLoading
                ? <span className="profil-spinner" aria-hidden="true" />
                : <Check size={15} />}
              {photoLoading ? "Mengunggah..." : "Simpan"}
            </button>
            <button
              type="button"
              className="profil-action-btn profil-action-btn--cancel"
              onClick={cancelPreview}
              disabled={photoLoading}
            >
              <X size={15} />
              Batal
            </button>
          </div>
        </div>
      )}

      {/* ── Pesan foto ── */}
      {photoMsg.text && (
        <div
          className={`profil-msg profil-msg--${photoMsg.type}`}
          role={photoMsg.type === "error" ? "alert" : "status"}
        >
          {photoMsg.type === "success" ? "✓" : "⚠"} {photoMsg.text}
        </div>
      )}

      {/* ── Pesan global nama ── */}
      {(nameMsg.text && !editingName) && (
        <div className={`profil-msg profil-msg--${nameMsg.type}`}
          role={nameMsg.type === "error" ? "alert" : "status"}>
          {nameMsg.type === "success" ? "✓" : "⚠"} {nameMsg.text}
        </div>
      )}
      {(pwMsg.text && !changingPw) && (
        <div className={`profil-msg profil-msg--${pwMsg.type}`}
          role={pwMsg.type === "error" ? "alert" : "status"}>
          {pwMsg.type === "success" ? "✓" : "⚠"} {pwMsg.text}
        </div>
      )}

      {/* ═══════════════════════════════
          DETAIL INFORMASI
      ═══════════════════════════════ */}
      <div className="profil-section">

        {/* Nama Lengkap */}
        <div className="profil-row">
          <div className="profil-row__icon" aria-hidden="true"><User size={18} /></div>
          <div className="profil-row__body">
            <p className="profil-row__label">Nama Lengkap</p>
            {editingName ? (
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
                  onKeyDown={(e) => { if (e.key === "Enter") saveName(); if (e.key === "Escape") cancelEditName(); }}
                />
                {nameMsg.text && <p className="profil-edit-name__hint profil-edit-name__hint--error">{nameMsg.text}</p>}
                <div className="profil-edit-name__actions">
                  <button type="button" className="profil-action-btn profil-action-btn--save" onClick={saveName} disabled={nameLoading}>
                    {nameLoading ? <span className="profil-spinner" aria-hidden="true" /> : <Check size={16} />}
                    {nameLoading ? "Menyimpan..." : "Simpan"}
                  </button>
                  <button type="button" className="profil-action-btn profil-action-btn--cancel" onClick={cancelEditName} disabled={nameLoading}>
                    <X size={16} /> Batal
                  </button>
                </div>
              </div>
            ) : (
              <div className="profil-row__display">
                <p className="profil-row__value">{fullName || "Belum diatur"}</p>
                <button type="button" className="profil-inline-btn" onClick={startEditName} aria-label="Edit nama lengkap">
                  <Pencil size={14} /> Edit
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="profil-divider" />

        {/* Email */}
        <div className="profil-row">
          <div className="profil-row__icon" aria-hidden="true"><Mail size={18} /></div>
          <div className="profil-row__body">
            <p className="profil-row__label">Email</p>
            <p className="profil-row__value">{email || "—"}</p>
            <p className="profil-row__note">Email tidak dapat diubah langsung.</p>
          </div>
        </div>

        <div className="profil-divider" />

        {/* Role */}
        <div className="profil-row">
          <div className="profil-row__icon" aria-hidden="true"><Shield size={18} /></div>
          <div className="profil-row__body">
            <p className="profil-row__label">Peran</p>
            <p className="profil-row__value">{roleLabel}</p>
            <p className="profil-row__note">Peran hanya dapat diubah oleh administrator.</p>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════
          GANTI KATA SANDI
      ═══════════════════════════════ */}
      <div className="profil-section">
        <div className="profil-section__header">
          <div className="profil-row__icon profil-row__icon--sm" aria-hidden="true"><KeyRound size={18} /></div>
          <p className="profil-section__title">Kata Sandi</p>
        </div>

        {changingPw ? (
          <div className="profil-pw-form">
            <div className="profil-pw-field">
              <label htmlFor="profil-new-pw" className="profil-pw-field__label">Kata Sandi Baru</label>
              <div className="profil-pw-field__wrap">
                <input id="profil-new-pw" type={showNewPw ? "text" : "password"} className="profil-pw-field__input"
                  placeholder="Minimal 8 karakter" value={newPw} onChange={(e) => setNewPw(e.target.value)} autoComplete="new-password" />
                <button type="button" className="profil-pw-toggle" onClick={() => setShowNewPw((v) => !v)} aria-label={showNewPw ? "Sembunyikan" : "Tampilkan"}>
                  {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="profil-pw-field">
              <label htmlFor="profil-confirm-pw" className="profil-pw-field__label">Konfirmasi Kata Sandi Baru</label>
              <div className="profil-pw-field__wrap">
                <input id="profil-confirm-pw" type={showConfirm ? "text" : "password"} className="profil-pw-field__input"
                  placeholder="Ulangi kata sandi baru" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} autoComplete="new-password" />
                <button type="button" className="profil-pw-toggle" onClick={() => setShowConfirm((v) => !v)} aria-label={showConfirm ? "Sembunyikan" : "Tampilkan"}>
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {confirmPw && (
                <p className={`profil-pw-match ${newPw === confirmPw ? "profil-pw-match--ok" : "profil-pw-match--err"}`}>
                  {newPw === confirmPw ? "✓ Kata sandi cocok" : "✗ Kata sandi tidak cocok"}
                </p>
              )}
            </div>
            {pwMsg.text && <p className={`profil-pw-msg profil-pw-msg--${pwMsg.type}`} role="alert">{pwMsg.text}</p>}
            <div className="profil-pw-actions">
              <button type="button" className="profil-action-btn profil-action-btn--save" onClick={savePassword} disabled={pwLoading}>
                {pwLoading ? <span className="profil-spinner" aria-hidden="true" /> : <Check size={16} />}
                {pwLoading ? "Menyimpan..." : "Simpan Kata Sandi"}
              </button>
              <button type="button" className="profil-action-btn profil-action-btn--cancel" onClick={cancelChangePw} disabled={pwLoading}>
                <X size={16} /> Batal
              </button>
            </div>
          </div>
        ) : (
          <div className="profil-pw-idle">
            <p className="profil-pw-idle__desc">Disarankan menggunakan kata sandi yang kuat dan unik.</p>
            <button type="button" className="profil-change-pw-btn" onClick={startChangePw}>
              <KeyRound size={16} /> Ganti Kata Sandi
            </button>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════
          SANTRI YANG DIASUH
      ═══════════════════════════════ */}
      <div className="profil-section">
        <div className="profil-section__header">
          <div className="profil-row__icon profil-row__icon--sm" aria-hidden="true">
            <Users size={18} />
          </div>
          <p className="profil-section__title">Santri yang Diasuh</p>
          <span className="profil-santri-count">{santriList.length}</span>
        </div>

        {/* Pesan santri */}
        {santriMsg.text && (
          <div className={`profil-santri-msg profil-santri-msg--${santriMsg.type}`}
            role={santriMsg.type === "error" ? "alert" : "status"}>
            {santriMsg.type === "success" ? "✓" : santriMsg.type === "info" ? "ℹ" : "⚠"} {santriMsg.text}
          </div>
        )}

        {/* Loading */}
        {santriLoading && (
          <div className="profil-santri-loading">
            <span className="profil-spinner-sm profil-spinner-sm--dark" aria-hidden="true" />
            <span>Memuat...</span>
          </div>
        )}

        {/* Daftar santri */}
        {!santriLoading && santriList.length > 0 && (
          <ul className="profil-santri-list">
            {santriList.map((s, idx) => (
              <li key={s.id}>
                <div className="profil-santri-item">
                  <div className="profil-santri-item__avatar" aria-hidden="true">
                    {s.nama_santri?.[0]?.toUpperCase() ?? "?"}
                  </div>
                  <div className="profil-santri-item__info">
                    <p className="profil-santri-item__nama">{s.nama_santri}</p>
                    <p className="profil-santri-item__kelas">
                      <GraduationCap size={12} style={{ display:"inline", marginRight:4, verticalAlign:"middle" }} />
                      {s.kelas}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="profil-santri-item__hapus"
                    onClick={() => handleDeleteSantri(s.id, s.nama_santri)}
                    aria-label={`Hapus ${s.nama_santri}`}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
                {idx < santriList.length - 1 && <div className="profil-divider" />}
              </li>
            ))}
          </ul>
        )}

        {/* Empty state */}
        {!santriLoading && santriList.length === 0 && !santriMsg.text && (
          <p className="profil-santri-empty">
            Belum ada santri yang ditambahkan.
          </p>
        )}

        {/* Form tambah santri */}
        {showAddForm ? (
          <div className="profil-santri-form">
            <div className="profil-santri-form__fields">
              <div className="profil-santri-form__field">
                <label className="profil-santri-form__label" htmlFor="santri-nama">
                  Nama Santri
                </label>
                <input
                  id="santri-nama"
                  type="text"
                  className="profil-santri-form__input"
                  placeholder="Nama lengkap santri"
                  value={newNama}
                  onChange={(e) => setNewNama(e.target.value)}
                  maxLength={80}
                  autoFocus
                  onKeyDown={(e) => { if (e.key === "Enter") handleAddSantri(); if (e.key === "Escape") setShowAddForm(false); }}
                />
              </div>
              <div className="profil-santri-form__field">
                <label className="profil-santri-form__label" htmlFor="santri-kelas">
                  Kelas
                </label>
                <input
                  id="santri-kelas"
                  type="text"
                  className="profil-santri-form__input"
                  placeholder="Contoh: Kelas 7A"
                  value={newKelas}
                  onChange={(e) => setNewKelas(e.target.value)}
                  maxLength={40}
                  onKeyDown={(e) => { if (e.key === "Enter") handleAddSantri(); if (e.key === "Escape") setShowAddForm(false); }}
                />
              </div>
            </div>
            {addMsg.text && (
              <p className="profil-santri-form__error" role="alert">{addMsg.text}</p>
            )}
            <div className="profil-santri-form__actions">
              <button
                type="button"
                className="profil-action-btn profil-action-btn--save"
                onClick={handleAddSantri}
                disabled={addLoading}
              >
                {addLoading ? <span className="profil-spinner" aria-hidden="true" /> : <Check size={15} />}
                {addLoading ? "Menyimpan..." : "Simpan"}
              </button>
              <button
                type="button"
                className="profil-action-btn profil-action-btn--cancel"
                onClick={() => { setShowAddForm(false); setAddMsg({ type:"",text:"" }); }}
                disabled={addLoading}
              >
                <X size={15} /> Batal
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="profil-santri-add-btn"
            onClick={() => { setShowAddForm(true); setAddMsg({ type:"",text:"" }); setSantriMsg({ type:"",text:"" }); }}
          >
            <Plus size={16} />
            Tambah Santri
          </button>
        )}
      </div>

      {/* ═══════════════════════════════
          LOGOUT
      ═══════════════════════════════ */}
      {confirmLogout ? (
        <div className="profil-logout-confirm">
          <p className="profil-logout-confirm__text">Yakin ingin keluar dari aplikasi?</p>
          <div className="profil-logout-confirm__actions">
            <button type="button" className="profil-action-btn profil-action-btn--danger" onClick={handleLogout} disabled={loggingOut}>
              {loggingOut ? <span className="profil-spinner profil-spinner--white" aria-hidden="true" /> : <LogOut size={16} />}
              {loggingOut ? "Keluar..." : "Ya, Keluar"}
            </button>
            <button type="button" className="profil-action-btn profil-action-btn--cancel" onClick={() => setConfirmLogout(false)} disabled={loggingOut}>
              <X size={16} /> Batal
            </button>
          </div>
        </div>
      ) : (
        <button type="button" className="profil-logout-btn" onClick={() => setConfirmLogout(true)}>
          <LogOut size={18} /> Keluar dari Aplikasi
        </button>
      )}

    </div>
  );
}

export default Profil;
