import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft, Save, CheckCircle2, Circle,
  MessageSquare, User,
} from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import useAuth from "../../hooks/useAuth";
import "./CatatanAkhlak.css";

/* ─── Item checklist akhlak ─── */
const AKHLAK_ITEMS = [
  { key: "menyapa_teman",  label: "Menyapa Teman",     desc: "Menyapa dengan ramah saat bertemu teman"      },
  { key: "mengucap_salam", label: "Mengucapkan Salam", desc: "Mengucapkan salam saat masuk/keluar ruangan"  },
  { key: "tersenyum",      label: "Tersenyum",          desc: "Menunjukkan wajah ceria dan bersahabat"       },
];

const PERILAKU_OPTIONS = [
  { value: "sangat_baik",     label: "Sangat Baik",    color: "green" },
  { value: "baik",            label: "Baik",           color: "blue"  },
  { value: "cukup",           label: "Cukup",          color: "amber" },
  { value: "perlu_bimbingan", label: "Perlu Bimbingan",color: "red"   },
];

function formatTanggal(dateStr) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

function getTodayString() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,"0")}-${String(n.getDate()).padStart(2,"0")}`;
}

function emptyChecked() {
  return Object.fromEntries(AKHLAK_ITEMS.map((i) => [i.key, false]));
}

/* ════════════════════════════════════════════
   KOMPONEN UTAMA
════════════════════════════════════════════ */
function CatatanAkhlak() {
  const navigate = useNavigate();
  const { user } = useAuth();

  /* ── Daftar santri ── */
  const [santriList,    setSantriList]    = useState([]);
  const [santriLoading, setSantriLoading] = useState(true);
  const [santriError,   setSantriError]   = useState("");
  const [selectedSantri, setSelectedSantri] = useState(null);

  /* ── Form ── */
  const [tanggal,         setTanggal]         = useState(getTodayString());
  const [checked,         setChecked]         = useState(emptyChecked());
  const [perilaku,        setPerilaku]        = useState("");
  const [catatanPerilaku, setCatatanPerilaku] = useState("");
  const [loading,         setLoading]         = useState(false);
  const [msg,             setMsg]             = useState({ type: "", text: "" });

  const totalChecked = Object.values(checked).filter(Boolean).length;

  /* ── Load santri ── */
  useEffect(() => {
    if (!user?.id) return;
    setSantriLoading(true);
    supabase
      .from("santri_diasuh")
      .select("id, nama_santri, kelas")
      .eq("ustadz_id", user.id)
      .order("nama_santri", { ascending: true })
      .then(({ data, error }) => {
        setSantriLoading(false);
        if (error) {
          const m = error.message?.toLowerCase() ?? "";
          setSantriError(
            m.includes("does not exist") || m.includes("relation")
              ? "Tabel santri belum tersedia. Jalankan SQL migration."
              : "Gagal memuat daftar santri."
          );
          return;
        }
        setSantriList(data ?? []);
        if (data?.length === 1) setSelectedSantri(data[0]);
      });
  }, [user?.id]);

  /* ── Pilih santri — reset form ── */
  function pilihSantri(s) {
    setSelectedSantri(s);
    setChecked(emptyChecked());
    setPerilaku("");
    setCatatanPerilaku("");
    setMsg({ type: "", text: "" });
  }

  function toggle(key) {
    setChecked((prev) => ({ ...prev, [key]: !prev[key] }));
    setMsg({ type: "", text: "" });
  }

  /* ── Simpan ── */
  async function handleSave() {
    setMsg({ type: "", text: "" });
    if (!user?.id) {
      setMsg({ type: "error", text: "Sesi tidak ditemukan. Silakan login ulang." });
      return;
    }
    if (!selectedSantri) {
      setMsg({ type: "error", text: "Pilih santri terlebih dahulu sebelum menyimpan." });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ustadz_id:          user.id,
        santri_id:          selectedSantri.id,
        tanggal,
        menyapa_teman:      checked.menyapa_teman,
        mengucap_salam:     checked.mengucap_salam,
        tersenyum:          checked.tersenyum,
        penilaian_perilaku: perilaku || null,
        catatan_perilaku:   catatanPerilaku.trim() || null,
      };

      const { error } = await supabase
        .from("catatan_akhlak")
        .upsert(payload, { onConflict: "santri_id,tanggal" });

      if (error) throw error;

      setMsg({
        type: "success",
        text: `Catatan akhlak ${selectedSantri.nama_santri} berhasil disimpan! 🎉`,
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      const m = err?.message?.toLowerCase() ?? "";
      if (m.includes("does not exist") || m.includes("relation")) {
        setMsg({ type: "error", text: "Tabel belum tersedia. Jalankan SQL migration." });
      } else if (m.includes("column") && m.includes("santri_id")) {
        setMsg({ type: "error", text: "Kolom santri_id belum ada. Jalankan SQL migration tambahan." });
      } else {
        setMsg({ type: "error", text: `Gagal menyimpan: ${err?.message ?? "Silakan coba lagi."}` });
      }
    } finally {
      setLoading(false);
    }
  }

  /* ══════════════════════════════
     RENDER
  ══════════════════════════════ */
  return (
    <div className="akhlak-root">

      {/* ── Header ── */}
      <div className="akhlak-header">
        <button
          type="button"
          className="akhlak-back-btn"
          onClick={() => navigate("/dashboard")}
          aria-label="Kembali ke beranda"
        >
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="akhlak-title">Catatan Akhlak</h1>
          <p className="akhlak-subtitle">Catat perilaku dan karakter santri</p>
        </div>
      </div>

      {/* ── Banner pesan ── */}
      {msg.text && (
        <div className={`akhlak-msg akhlak-msg--${msg.type}`} role={msg.type === "error" ? "alert" : "status"}>
          {msg.type === "success" ? "✓" : "⚠"} {msg.text}
        </div>
      )}

      {/* ═══════════════════════════════
          PILIH SANTRI
      ═══════════════════════════════ */}
      <div className="akhlak-santri-section">
        <p className="akhlak-santri-section__title">
          <User size={14} style={{ display:"inline", marginRight:6, verticalAlign:"middle" }} />
          Pilih Santri
        </p>

        {santriError && (
          <div className="akhlak-msg akhlak-msg--error" role="alert">⚠ {santriError}</div>
        )}

        {santriLoading && (
          <div className="akhlak-santri-loading">
            <span className="akhlak-spinner-sm" aria-hidden="true" />
            Memuat santri...
          </div>
        )}

        {!santriLoading && !santriError && santriList.length === 0 && (
          <div className="akhlak-santri-empty">
            Belum ada santri. Tambahkan santri di halaman{" "}
            <button
              type="button"
              className="akhlak-santri-empty__link"
              onClick={() => navigate("/dashboard/profil")}
            >
              Profil
            </button>.
          </div>
        )}

        {!santriLoading && santriList.length > 0 && (
          <div className="akhlak-santri-grid">
            {santriList.map((s) => (
              <button
                key={s.id}
                type="button"
                className={`akhlak-santri-card ${selectedSantri?.id === s.id ? "akhlak-santri-card--active" : ""}`}
                onClick={() => pilihSantri(s)}
                aria-pressed={selectedSantri?.id === s.id}
              >
                <div className="akhlak-santri-card__avatar" aria-hidden="true">
                  {s.nama_santri?.[0]?.toUpperCase() ?? "?"}
                </div>
                <div className="akhlak-santri-card__info">
                  <span className="akhlak-santri-card__nama">{s.nama_santri}</span>
                  <span className="akhlak-santri-card__kelas">{s.kelas}</span>
                </div>
                {selectedSantri?.id === s.id && (
                  <CheckCircle2 size={18} className="akhlak-santri-card__check" aria-hidden="true" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tampilkan form setelah santri dipilih */}
      {selectedSantri && (
        <>
          {/* ── Pilih tanggal ── */}
          <div className="akhlak-date-card">
            <div>
              <p className="akhlak-date-card__label">Tanggal</p>
              <p className="akhlak-date-card__display">{formatTanggal(tanggal)}</p>
            </div>
            <input
              type="date"
              className="akhlak-date-input"
              value={tanggal}
              max={getTodayString()}
              onChange={(e) => { setTanggal(e.target.value); setMsg({ type:"",text:"" }); }}
              aria-label="Pilih tanggal"
            />
          </div>

          {/* ── Checklist akhlak ── */}
          <div className="akhlak-group">
            <h2 className="akhlak-group__title">
              Akhlak Harian
              <span className="akhlak-group__count">{totalChecked}/{AKHLAK_ITEMS.length} tercatat</span>
            </h2>
            <div className="akhlak-group__card">
              {AKHLAK_ITEMS.map((item, idx) => (
                <div key={item.key}>
                  <button
                    type="button"
                    className={`akhlak-item ${checked[item.key] ? "akhlak-item--checked" : ""}`}
                    onClick={() => toggle(item.key)}
                    aria-pressed={checked[item.key]}
                  >
                    <span className="akhlak-item__icon" aria-hidden="true">
                      {checked[item.key] ? <CheckCircle2 size={22} /> : <Circle size={22} />}
                    </span>
                    <span className="akhlak-item__body">
                      <span className="akhlak-item__label">{item.label}</span>
                      <span className="akhlak-item__desc">{item.desc}</span>
                    </span>
                  </button>
                  {idx < AKHLAK_ITEMS.length - 1 && <div className="akhlak-item__divider" />}
                </div>
              ))}
            </div>
          </div>

          {/* ── Penilaian perilaku ── */}
          <div className="akhlak-group">
            <h2 className="akhlak-group__title">Penilaian Perilaku</h2>
            <div className="akhlak-perilaku-grid">
              {PERILAKU_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`akhlak-perilaku-btn akhlak-perilaku-btn--${opt.color} ${
                    perilaku === opt.value ? "akhlak-perilaku-btn--active" : ""
                  }`}
                  onClick={() => setPerilaku(perilaku === opt.value ? "" : opt.value)}
                  aria-pressed={perilaku === opt.value}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Catatan perilaku ── */}
          <div className="akhlak-group">
            <h2 className="akhlak-group__title">
              <MessageSquare size={14} style={{ display:"inline", marginRight:6, verticalAlign:"middle" }} />
              Catatan Perilaku
            </h2>
            <div className="akhlak-group__card akhlak-group__card--pad">
              <textarea
                className="akhlak-catatan"
                placeholder="Tuliskan catatan perkembangan akhlak santri secara singkat... (opsional)"
                value={catatanPerilaku}
                onChange={(e) => setCatatanPerilaku(e.target.value)}
                rows={4}
                maxLength={1000}
              />
              <p className="akhlak-catatan__count">{catatanPerilaku.length}/1000</p>
            </div>
          </div>

          {/* ── Tombol Simpan ── */}
          <button
            type="button"
            className="akhlak-save-btn"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="akhlak-spinner" aria-hidden="true" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save size={19} />
                Simpan Akhlak — {selectedSantri.nama_santri}
              </>
            )}
          </button>
        </>
      )}

    </div>
  );
}

export default CatatanAkhlak;
