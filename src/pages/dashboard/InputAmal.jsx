import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Save, CheckCircle2, Circle, User } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import useAuth from "../../hooks/useAuth";
import "./InputAmal.css";

/* ─── Daftar item amal ─── */
const AMAL_ITEMS = [
  { key: "subuh",         label: "Sholat Subuh",        kategori: "Sholat Wajib"  },
  { key: "dzuhur",        label: "Sholat Dzuhur",        kategori: "Sholat Wajib"  },
  { key: "ashar",         label: "Sholat Ashar",         kategori: "Sholat Wajib"  },
  { key: "maghrib",       label: "Sholat Maghrib",       kategori: "Sholat Wajib"  },
  { key: "isya",          label: "Sholat Isya'",         kategori: "Sholat Wajib"  },
  { key: "tahajjud",      label: "Sholat Tahajjud",      kategori: "Sholat Sunnah" },
  { key: "dhuha",         label: "Sholat Dhuha",         kategori: "Sholat Sunnah" },
  { key: "dzikir_pagi",   label: "Dzikir Pagi",          kategori: "Dzikir & Doa"  },
  { key: "dzikir_sore",   label: "Dzikir Sore",          kategori: "Dzikir & Doa"  },
  { key: "tilawah",       label: "Tilawah ½ Juz",        kategori: "Tilawah"       },
  { key: "doa_ortu",      label: "Mendoakan Orang Tua",  kategori: "Doa"           },
];

const GROUPED = AMAL_ITEMS.reduce((acc, item) => {
  if (!acc[item.kategori]) acc[item.kategori] = [];
  acc[item.kategori].push(item);
  return acc;
}, {});

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
  return Object.fromEntries(AMAL_ITEMS.map((i) => [i.key, false]));
}

/* ════════════════════════════════════════════
   KOMPONEN UTAMA
════════════════════════════════════════════ */
function InputAmal() {
  const navigate  = useNavigate();
  const { user }  = useAuth();

  /* ── Daftar santri ── */
  const [santriList,    setSantriList]    = useState([]);
  const [santriLoading, setSantriLoading] = useState(true);
  const [santriError,   setSantriError]   = useState("");

  /* ── Santri terpilih ── */
  const [selectedSantri, setSelectedSantri] = useState(null); // { id, nama_santri, kelas }

  /* ── Form amal ── */
  const [tanggal, setTanggal] = useState(getTodayString());
  const [catatan, setCatatan] = useState("");
  const [checked, setChecked] = useState(emptyChecked());
  const [loading, setLoading] = useState(false);
  const [msg,     setMsg]     = useState({ type: "", text: "" });

  const totalChecked = Object.values(checked).filter(Boolean).length;
  const totalItems   = AMAL_ITEMS.length;

  /* ── Load daftar santri ── */
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
          if (m.includes("does not exist") || m.includes("relation")) {
            setSantriError("Tabel santri belum tersedia. Jalankan SQL migration.");
          } else {
            setSantriError("Gagal memuat daftar santri.");
          }
          return;
        }
        setSantriList(data ?? []);
        /* Auto-pilih santri pertama jika hanya ada satu */
        if (data?.length === 1) setSelectedSantri(data[0]);
      });
  }, [user?.id]);

  /* ── Ketika santri berganti, reset form amal ── */
  function pilihSantri(s) {
    setSelectedSantri(s);
    setChecked(emptyChecked());
    setCatatan("");
    setMsg({ type: "", text: "" });
  }

  function toggle(key) {
    setChecked((prev) => ({ ...prev, [key]: !prev[key] }));
    setMsg({ type: "", text: "" });
  }

  function toggleAll() {
    const all = totalChecked === totalItems;
    setChecked(Object.fromEntries(AMAL_ITEMS.map((i) => [i.key, !all])));
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
        ustadz_id:            user.id,
        santri_id:            selectedSantri.id,
        tanggal,
        catatan:              catatan.trim() || null,
        subuh:                checked.subuh,
        dzuhur:               checked.dzuhur,
        ashar:                checked.ashar,
        maghrib:              checked.maghrib,
        isya:                 checked.isya,
        sunnah_tahajjud:      checked.tahajjud,
        sunnah_dhuha:         checked.dhuha,
        dzikir_pagi:          checked.dzikir_pagi,
        dzikir_sore:          checked.dzikir_sore,
        tilawah_setengah_juz: checked.tilawah,
        doa_orang_tua:        checked.doa_ortu,
      };

      const { error } = await supabase
        .from("monitoring_amal")
        .upsert(payload, { onConflict: "santri_id,tanggal" });

      if (error) throw error;

      setMsg({
        type: "success",
        text: `Amal ${selectedSantri.nama_santri} pada ${formatTanggal(tanggal)} berhasil disimpan! 🎉`,
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      const m = err?.message?.toLowerCase() ?? "";
      if (m.includes("does not exist") || m.includes("relation")) {
        setMsg({ type: "error", text: "Tabel belum tersedia. Jalankan SQL schema." });
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
    <div className="amal-root">

      {/* ── Header ── */}
      <div className="amal-header">
        <button
          type="button"
          className="amal-back-btn"
          onClick={() => navigate("/dashboard")}
          aria-label="Kembali ke beranda"
        >
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="amal-title">Input Amal Santri</h1>
          <p className="amal-subtitle">Catat ibadah harian</p>
        </div>
      </div>

      {/* ── Banner pesan ── */}
      {msg.text && (
        <div className={`amal-msg amal-msg--${msg.type}`} role={msg.type === "error" ? "alert" : "status"}>
          {msg.type === "success" ? "✓" : "⚠"} {msg.text}
        </div>
      )}

      {/* ═══════════════════════════════
          PILIH SANTRI
      ═══════════════════════════════ */}
      <div className="amal-santri-section">
        <p className="amal-santri-section__title">
          <User size={14} style={{ display:"inline", marginRight:6, verticalAlign:"middle" }} />
          Pilih Santri
        </p>

        {santriError && (
          <div className="amal-msg amal-msg--error" role="alert">⚠ {santriError}</div>
        )}

        {santriLoading && (
          <div className="amal-santri-loading">
            <span className="amal-spinner amal-spinner--sm amal-spinner--dark" aria-hidden="true" />
            Memuat santri...
          </div>
        )}

        {!santriLoading && !santriError && santriList.length === 0 && (
          <div className="amal-santri-empty">
            Belum ada santri. Tambahkan santri di halaman{" "}
            <button
              type="button"
              className="amal-santri-empty__link"
              onClick={() => navigate("/dashboard/profil")}
            >
              Profil
            </button>
            .
          </div>
        )}

        {!santriLoading && santriList.length > 0 && (
          <div className="amal-santri-grid">
            {santriList.map((s) => (
              <button
                key={s.id}
                type="button"
                className={`amal-santri-card ${selectedSantri?.id === s.id ? "amal-santri-card--active" : ""}`}
                onClick={() => pilihSantri(s)}
                aria-pressed={selectedSantri?.id === s.id}
              >
                <div className="amal-santri-card__avatar" aria-hidden="true">
                  {s.nama_santri?.[0]?.toUpperCase() ?? "?"}
                </div>
                <div className="amal-santri-card__info">
                  <span className="amal-santri-card__nama">{s.nama_santri}</span>
                  <span className="amal-santri-card__kelas">{s.kelas}</span>
                </div>
                {selectedSantri?.id === s.id && (
                  <CheckCircle2 size={18} className="amal-santri-card__check" aria-hidden="true" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tampilkan form hanya setelah santri dipilih */}
      {selectedSantri && (
        <>
          {/* ── Tanggal ── */}
          <div className="amal-date-card">
            <div className="amal-date-card__left">
              <p className="amal-date-card__label">Tanggal</p>
              <p className="amal-date-card__display">{formatTanggal(tanggal)}</p>
            </div>
            <input
              type="date"
              className="amal-date-input"
              value={tanggal}
              max={getTodayString()}
              onChange={(e) => { setTanggal(e.target.value); setMsg({ type:"",text:"" }); }}
              aria-label="Pilih tanggal"
            />
          </div>

          {/* ── Progress bar ── */}
          <div className="amal-progress">
            <div className="amal-progress__header">
              <span className="amal-progress__label">
                {totalChecked} dari {totalItems} amal tercatat
              </span>
              <button type="button" className="amal-toggle-all" onClick={toggleAll}>
                {totalChecked === totalItems ? "Hapus Semua" : "Centang Semua"}
              </button>
            </div>
            <div className="amal-progress__track">
              <div
                className="amal-progress__fill"
                style={{ width: `${(totalChecked / totalItems) * 100}%` }}
                role="progressbar"
                aria-valuenow={totalChecked}
                aria-valuemin={0}
                aria-valuemax={totalItems}
              />
            </div>
          </div>

          {/* ── Daftar amal per kategori ── */}
          {Object.entries(GROUPED).map(([kategori, items]) => (
            <div key={kategori} className="amal-group">
              <h2 className="amal-group__title">{kategori}</h2>
              <div className="amal-group__card">
                {items.map((item, idx) => (
                  <div key={item.key}>
                    <button
                      type="button"
                      className={`amal-item ${checked[item.key] ? "amal-item--checked" : ""}`}
                      onClick={() => toggle(item.key)}
                      aria-pressed={checked[item.key]}
                    >
                      <span className="amal-item__icon" aria-hidden="true">
                        {checked[item.key]
                          ? <CheckCircle2 size={22} />
                          : <Circle size={22} />}
                      </span>
                      <span className="amal-item__label">{item.label}</span>
                    </button>
                    {idx < items.length - 1 && <div className="amal-item__divider" />}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* ── Catatan ── */}
          <div className="amal-group">
            <h2 className="amal-group__title">Catatan</h2>
            <div className="amal-group__card amal-group__card--pad">
              <textarea
                className="amal-catatan"
                placeholder="Tambahkan catatan (opsional)..."
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                rows={3}
                maxLength={500}
              />
              <p className="amal-catatan__count">{catatan.length}/500</p>
            </div>
          </div>

          {/* ── Tombol Simpan ── */}
          <button
            type="button"
            className="amal-save-btn"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="amal-spinner" aria-hidden="true" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save size={19} />
                Simpan Amal — {selectedSantri.nama_santri}
              </>
            )}
          </button>
        </>
      )}

    </div>
  );
}

export default InputAmal;
