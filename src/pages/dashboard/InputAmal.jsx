import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Save, CheckCircle2, Circle } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import useAuth from "../../hooks/useAuth";
import "./InputAmal.css";

/* ─── Daftar item amal ─── */
const AMAL_ITEMS = [
  { key: "subuh",          label: "Sholat Subuh",        kategori: "Sholat Wajib" },
  { key: "dzuhur",         label: "Sholat Dzuhur",       kategori: "Sholat Wajib" },
  { key: "ashar",          label: "Sholat Ashar",        kategori: "Sholat Wajib" },
  { key: "maghrib",        label: "Sholat Maghrib",      kategori: "Sholat Wajib" },
  { key: "isya",           label: "Sholat Isya'",        kategori: "Sholat Wajib" },
  { key: "tahajjud",       label: "Sholat Tahajjud",     kategori: "Sholat Sunnah" },
  { key: "dhuha",          label: "Sholat Dhuha",        kategori: "Sholat Sunnah" },
  { key: "dzikir_pagi",    label: "Dzikir Pagi",         kategori: "Dzikir & Doa" },
  { key: "dzikir_sore",    label: "Dzikir Sore",         kategori: "Dzikir & Doa" },
  { key: "tilawah",        label: "Tilawah ½ Juz",       kategori: "Tilawah" },
  { key: "doa_ortu",       label: "Mendoakan Orang Tua", kategori: "Doa" },
];

/* ─── Kelompokkan item per kategori ─── */
const GROUPED = AMAL_ITEMS.reduce((acc, item) => {
  if (!acc[item.kategori]) acc[item.kategori] = [];
  acc[item.kategori].push(item);
  return acc;
}, {});

/* Format tanggal lokal Indonesia */
function formatTanggal(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

function getTodayString() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm   = String(now.getMonth() + 1).padStart(2, "0");
  const dd   = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/* ════════════════════════════════════════════
   KOMPONEN UTAMA
════════════════════════════════════════════ */
function InputAmal() {
  const navigate    = useNavigate();
  const { user }    = useAuth();

  const [tanggal,  setTanggal]  = useState(getTodayString());
  const [catatan,  setCatatan]  = useState("");
  const [checked,  setChecked]  = useState(() =>
    Object.fromEntries(AMAL_ITEMS.map((i) => [i.key, false]))
  );
  const [loading,  setLoading]  = useState(false);
  const [msg,      setMsg]      = useState({ type: "", text: "" });

  /* Hitung jumlah yang dicentang */
  const totalChecked = Object.values(checked).filter(Boolean).length;
  const totalItems   = AMAL_ITEMS.length;

  function toggle(key) {
    setChecked((prev) => ({ ...prev, [key]: !prev[key] }));
    setMsg({ type: "", text: "" });
  }

  /* Centang/hapus semua */
  function toggleAll() {
    const allChecked = totalChecked === totalItems;
    setChecked(Object.fromEntries(AMAL_ITEMS.map((i) => [i.key, !allChecked])));
  }

  async function handleSave() {
    setMsg({ type: "", text: "" });

    if (!user?.id) {
      setMsg({ type: "error", text: "Sesi tidak ditemukan. Silakan login ulang." });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ustadz_id:        user.id,
        tanggal,
        catatan:          catatan.trim() || null,
        /* Sholat Wajib */
        subuh:            checked.subuh,
        dzuhur:           checked.dzuhur,
        ashar:            checked.ashar,
        maghrib:          checked.maghrib,
        isya:             checked.isya,
        /* Sholat Sunnah */
        sunnah_tahajjud:  checked.tahajjud,
        sunnah_dhuha:     checked.dhuha,
        /* Dzikir & Doa */
        dzikir_pagi:      checked.dzikir_pagi,
        dzikir_sore:      checked.dzikir_sore,
        /* Tilawah */
        tilawah_setengah_juz: checked.tilawah,
        /* Doa */
        doa_orang_tua:    checked.doa_ortu,
      };

      /* Upsert — jika sudah ada catatan hari ini, perbarui */
      const { error } = await supabase
        .from("monitoring_amal")
        .upsert(payload, {
          onConflict:    "ustadz_id,tanggal",
          ignoreDuplicates: false,
        });

      if (error) throw error;

      setMsg({ type: "success", text: "Amal harian berhasil disimpan! 🎉" });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      const m = err?.message?.toLowerCase() ?? "";
      if (m.includes("does not exist") || m.includes("relation")) {
        setMsg({ type: "error", text: "Tabel belum tersedia. Jalankan SQL schema terlebih dahulu." });
      } else if (m.includes("violates") || m.includes("constraint")) {
        setMsg({ type: "error", text: "Data untuk tanggal ini sudah ada dan tidak dapat diduplikasi." });
      } else {
        setMsg({ type: "error", text: `Gagal menyimpan: ${err?.message ?? "Silakan coba lagi."}` });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="amal-root">

      {/* ── Header halaman ── */}
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

      {/* ── Pilih tanggal ── */}
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
          onChange={(e) => { setTanggal(e.target.value); setMsg({ type: "", text: "" }); }}
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

      {/* ── Catatan tambahan ── */}
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
            Simpan Amal Harian
          </>
        )}
      </button>

    </div>
  );
}

export default InputAmal;
