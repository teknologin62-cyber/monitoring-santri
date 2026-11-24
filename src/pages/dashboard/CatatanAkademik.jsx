import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Save, Plus, Trash2, GraduationCap } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import useAuth from "../../hooks/useAuth";
import "./CatatanAkademik.css";

/* ─── Mata pelajaran default ─── */
const MAPEL_DEFAULT = [
  "Al-Qur'an",
  "Tajwid",
  "Fiqih",
  "Aqidah",
  "Hadits",
  "Bahasa Arab",
  "Bahasa Indonesia",
  "Matematika",
  "IPA",
  "IPS",
];

/* ─── Konversi nilai → predikat ─── */
function getPredikat(nilai) {
  const n = Number(nilai);
  if (isNaN(n) || nilai === "") return null;
  if (n >= 90) return { label: "A", keterangan: "Sangat Baik",    color: "green"  };
  if (n >= 75) return { label: "B", keterangan: "Baik",           color: "blue"   };
  if (n >= 60) return { label: "C", keterangan: "Cukup",          color: "amber"  };
  return          { label: "D", keterangan: "Perlu Bimbingan", color: "red"    };
}

function formatTanggal(dateStr) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

function getTodayString() {
  const now  = new Date();
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
}

/* ─── Baris nilai tunggal ─── */
function NilaiRow({ row, index, onChange, onRemove, showRemove }) {
  const predikat = getPredikat(row.nilai);

  return (
    <div className="akademik-row">

      {/* Pilih mapel */}
      <div className="akademik-row__mapel">
        <label className="akademik-row__label" htmlFor={`mapel-${index}`}>
          Mata Pelajaran
        </label>
        <div className="akademik-row__mapel-wrap">
          <select
            id={`mapel-${index}`}
            className="akademik-select"
            value={row.mapel === "__custom__" ? "__custom__" : (MAPEL_DEFAULT.includes(row.mapel) ? row.mapel : "__custom__")}
            onChange={(e) => {
              if (e.target.value === "__custom__") {
                onChange(index, "mapel", "");
                onChange(index, "isCustom", true);
              } else {
                onChange(index, "mapel", e.target.value);
                onChange(index, "isCustom", false);
              }
            }}
          >
            <option value="">— Pilih mapel —</option>
            {MAPEL_DEFAULT.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
            <option value="__custom__">+ Mapel lainnya...</option>
          </select>
          {row.isCustom && (
            <input
              type="text"
              className="akademik-input-text"
              placeholder="Nama mata pelajaran"
              value={row.mapel}
              onChange={(e) => onChange(index, "mapel", e.target.value)}
              maxLength={80}
              autoFocus
            />
          )}
        </div>
      </div>

      {/* Input nilai + predikat */}
      <div className="akademik-row__nilai-wrap">
        <div className="akademik-row__nilai">
          <label className="akademik-row__label" htmlFor={`nilai-${index}`}>
            Nilai (0–100)
          </label>
          <input
            id={`nilai-${index}`}
            type="number"
            className="akademik-input-nilai"
            min={0}
            max={100}
            step={1}
            placeholder="0–100"
            value={row.nilai}
            onChange={(e) => {
              let v = e.target.value;
              if (v !== "" && (Number(v) < 0 || Number(v) > 100)) return;
              onChange(index, "nilai", v);
            }}
          />
        </div>

        {/* Badge predikat otomatis */}
        {predikat && (
          <div className={`akademik-predikat akademik-predikat--${predikat.color}`}>
            <span className="akademik-predikat__label">{predikat.label}</span>
            <span className="akademik-predikat__ket">{predikat.keterangan}</span>
          </div>
        )}
      </div>

      {/* Catatan per mapel */}
      <div className="akademik-row__catatan">
        <label className="akademik-row__label" htmlFor={`catatan-${index}`}>
          Catatan (opsional)
        </label>
        <input
          id={`catatan-${index}`}
          type="text"
          className="akademik-input-text"
          placeholder="Catatan perkembangan..."
          value={row.catatan}
          onChange={(e) => onChange(index, "catatan", e.target.value)}
          maxLength={200}
        />
      </div>

      {/* Tombol hapus baris */}
      {showRemove && (
        <button
          type="button"
          className="akademik-row__remove"
          onClick={() => onRemove(index)}
          aria-label={`Hapus baris ${row.mapel || "ini"}`}
        >
          <Trash2 size={16} />
        </button>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════
   KOMPONEN UTAMA
════════════════════════════════════════════ */
function CatatanAkademik() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [tanggal,  setTanggal]  = useState(getTodayString());
  const [loading,  setLoading]  = useState(false);
  const [msg,      setMsg]      = useState({ type: "", text: "" });

  /* Daftar baris — satu baris = satu mapel */
  const [rows, setRows] = useState([
    { mapel: "", isCustom: false, nilai: "", catatan: "" },
  ]);

  /* ── Manipulasi baris ── */
  const handleChange = useCallback((idx, field, val) => {
    setRows((prev) => prev.map((r, i) => i === idx ? { ...r, [field]: val } : r));
    setMsg({ type: "", text: "" });
  }, []);

  function addRow() {
    setRows((prev) => [...prev, { mapel: "", isCustom: false, nilai: "", catatan: "" }]);
  }

  function removeRow(idx) {
    setRows((prev) => prev.filter((_, i) => i !== idx));
  }

  /* ── Simpan ── */
  async function handleSave() {
    setMsg({ type: "", text: "" });

    if (!user?.id) {
      setMsg({ type: "error", text: "Sesi tidak ditemukan. Silakan login ulang." });
      return;
    }

    /* Validasi: semua baris harus punya mapel dan nilai */
    const invalid = rows.filter((r) => !r.mapel.trim() || r.nilai === "");
    if (invalid.length > 0) {
      setMsg({ type: "error", text: "Semua baris harus diisi: nama mapel dan nilai." });
      return;
    }

    /* Duplikat nama mapel */
    const mapelList = rows.map((r) => r.mapel.trim().toLowerCase());
    const duplikat  = mapelList.filter((m, i) => mapelList.indexOf(m) !== i);
    if (duplikat.length > 0) {
      setMsg({ type: "error", text: `Terdapat mata pelajaran duplikat: ${duplikat[0]}.` });
      return;
    }

    setLoading(true);
    try {
      /* Cek apakah tabel pelajaran perlu diquery atau gunakan nama langsung */
      const payloads = rows.map((r) => ({
        ustadz_id:    user.id,
        tanggal,
        nama_pelajaran: r.mapel.trim(),
        nilai:          Number(r.nilai),
        keterangan:     r.catatan.trim() || null,
      }));

      /* Upsert semua baris sekaligus */
      const { error } = await supabase
        .from("catatan_akademik_harian")
        .upsert(payloads, { onConflict: "ustadz_id,tanggal,nama_pelajaran" });

      if (error) throw error;

      setMsg({ type: "success", text: `${rows.length} catatan akademik berhasil disimpan! 🎉` });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      const m = err?.message?.toLowerCase() ?? "";
      if (m.includes("does not exist") || m.includes("relation")) {
        setMsg({ type: "error", text: "Tabel belum tersedia. Jalankan SQL migration terlebih dahulu." });
      } else if (m.includes("violates") || m.includes("constraint")) {
        setMsg({ type: "error", text: "Terdapat data duplikat untuk mapel yang sama pada tanggal ini." });
      } else {
        setMsg({ type: "error", text: `Gagal menyimpan: ${err?.message ?? "Silakan coba lagi."}` });
      }
    } finally {
      setLoading(false);
    }
  }

  /* ── Hitung ringkasan nilai ── */
  const nilaiTerisi  = rows.filter((r) => r.nilai !== "");
  const nilaiRataRata = nilaiTerisi.length > 0
    ? (nilaiTerisi.reduce((s, r) => s + Number(r.nilai), 0) / nilaiTerisi.length).toFixed(1)
    : null;
  const predikatRata = nilaiRataRata !== null ? getPredikat(nilaiRataRata) : null;

  return (
    <div className="akademik-root">

      {/* ── Header ── */}
      <div className="akademik-header">
        <button
          type="button"
          className="akademik-back-btn"
          onClick={() => navigate("/dashboard")}
          aria-label="Kembali ke beranda"
        >
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="akademik-title">Catatan Akademik</h1>
          <p className="akademik-subtitle">Input nilai dan perkembangan belajar santri</p>
        </div>
      </div>

      {/* ── Banner pesan ── */}
      {msg.text && (
        <div
          className={`akademik-msg akademik-msg--${msg.type}`}
          role={msg.type === "error" ? "alert" : "status"}
        >
          {msg.type === "success" ? "✓" : "⚠"} {msg.text}
        </div>
      )}

      {/* ── Pilih tanggal ── */}
      <div className="akademik-date-card">
        <div>
          <p className="akademik-date-card__label">Tanggal</p>
          <p className="akademik-date-card__display">{formatTanggal(tanggal)}</p>
        </div>
        <input
          type="date"
          className="akademik-date-input"
          value={tanggal}
          max={getTodayString()}
          onChange={(e) => { setTanggal(e.target.value); setMsg({ type: "", text: "" }); }}
          aria-label="Pilih tanggal"
        />
      </div>

      {/* ── Ringkasan nilai ── */}
      {nilaiRataRata !== null && (
        <div className="akademik-summary">
          <div className="akademik-summary__item">
            <p className="akademik-summary__value">{nilaiTerisi.length}</p>
            <p className="akademik-summary__label">Mapel diisi</p>
          </div>
          <div className="akademik-summary__divider" />
          <div className="akademik-summary__item">
            <p className="akademik-summary__value">{nilaiRataRata}</p>
            <p className="akademik-summary__label">Rata-rata nilai</p>
          </div>
          {predikatRata && (
            <>
              <div className="akademik-summary__divider" />
              <div className="akademik-summary__item">
                <p className={`akademik-summary__predikat akademik-summary__predikat--${predikatRata.color}`}>
                  {predikatRata.label}
                </p>
                <p className="akademik-summary__label">Predikat</p>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Baris nilai per mapel ── */}
      <div className="akademik-group">
        <div className="akademik-group__header">
          <h2 className="akademik-group__title">
            <GraduationCap size={15} style={{ display:"inline", marginRight:6, verticalAlign:"middle" }} />
            Nilai Mata Pelajaran
          </h2>
          <span className="akademik-group__count">{rows.length} mapel</span>
        </div>

        <div className="akademik-rows-list">
          {rows.map((row, idx) => (
            <NilaiRow
              key={idx}
              row={row}
              index={idx}
              onChange={handleChange}
              onRemove={removeRow}
              showRemove={rows.length > 1}
            />
          ))}
        </div>

        {/* Tombol tambah baris */}
        <button
          type="button"
          className="akademik-add-btn"
          onClick={addRow}
          disabled={rows.length >= 20}
        >
          <Plus size={16} />
          Tambah Mata Pelajaran
        </button>
      </div>

      {/* ── Tombol Simpan ── */}
      <button
        type="button"
        className="akademik-save-btn"
        onClick={handleSave}
        disabled={loading}
      >
        {loading ? (
          <>
            <span className="akademik-spinner" aria-hidden="true" />
            Menyimpan...
          </>
        ) : (
          <>
            <Save size={19} />
            Simpan Catatan Akademik
          </>
        )}
      </button>

    </div>
  );
}

export default CatatanAkademik;
