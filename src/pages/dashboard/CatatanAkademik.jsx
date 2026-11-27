import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft, Save, Plus, Trash2, GraduationCap, User, CheckCircle2,
} from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import useAuth from "../../hooks/useAuth";
import "./CatatanAkademik.css";

/* ─── Mata pelajaran default ─── */
const MAPEL_DEFAULT = [
  "Al-Qur'an","Tajwid","Fiqih","Aqidah","Hadits",
  "Bahasa Arab","Bahasa Indonesia","Matematika","IPA","IPS",
];

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
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,"0")}-${String(n.getDate()).padStart(2,"0")}`;
}

function emptyRows() {
  return [{ mapel: "", isCustom: false, nilai: "", catatan: "" }];
}

/* ─── Baris nilai tunggal ─── */
function NilaiRow({ row, index, onChange, onRemove, showRemove }) {
  const predikat = getPredikat(row.nilai);
  return (
    <div className="akademik-row">
      <div className="akademik-row__mapel">
        <label className="akademik-row__label" htmlFor={`mapel-${index}`}>Mata Pelajaran</label>
        <div className="akademik-row__mapel-wrap">
          <select
            id={`mapel-${index}`}
            className="akademik-select"
            value={row.isCustom ? "__custom__" : (MAPEL_DEFAULT.includes(row.mapel) ? row.mapel : (row.mapel ? "__custom__" : ""))}
            onChange={(e) => {
              if (e.target.value === "__custom__") {
                onChange(index, "mapel", ""); onChange(index, "isCustom", true);
              } else {
                onChange(index, "mapel", e.target.value); onChange(index, "isCustom", false);
              }
            }}
          >
            <option value="">— Pilih mapel —</option>
            {MAPEL_DEFAULT.map((m) => <option key={m} value={m}>{m}</option>)}
            <option value="__custom__">+ Mapel lainnya...</option>
          </select>
          {row.isCustom && (
            <input
              type="text" className="akademik-input-text"
              placeholder="Nama mata pelajaran" value={row.mapel}
              onChange={(e) => onChange(index, "mapel", e.target.value)}
              maxLength={80} autoFocus
            />
          )}
        </div>
      </div>

      <div className="akademik-row__nilai-wrap">
        <div className="akademik-row__nilai">
          <label className="akademik-row__label" htmlFor={`nilai-${index}`}>Nilai (0–100)</label>
          <input
            id={`nilai-${index}`} type="number" className="akademik-input-nilai"
            min={0} max={100} step={1} placeholder="0–100" value={row.nilai}
            onChange={(e) => {
              const v = e.target.value;
              if (v !== "" && (Number(v) < 0 || Number(v) > 100)) return;
              onChange(index, "nilai", v);
            }}
          />
        </div>
        {predikat && (
          <div className={`akademik-predikat akademik-predikat--${predikat.color}`}>
            <span className="akademik-predikat__label">{predikat.label}</span>
            <span className="akademik-predikat__ket">{predikat.keterangan}</span>
          </div>
        )}
      </div>

      <div className="akademik-row__catatan">
        <label className="akademik-row__label" htmlFor={`catatan-${index}`}>Catatan (opsional)</label>
        <input
          id={`catatan-${index}`} type="text" className="akademik-input-text"
          placeholder="Catatan perkembangan..." value={row.catatan}
          onChange={(e) => onChange(index, "catatan", e.target.value)} maxLength={200}
        />
      </div>

      {showRemove && (
        <button type="button" className="akademik-row__remove"
          onClick={() => onRemove(index)} aria-label={`Hapus baris ${row.mapel || "ini"}`}>
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

  /* ── Daftar santri ── */
  const [santriList,     setSantriList]     = useState([]);
  const [santriLoading,  setSantriLoading]  = useState(true);
  const [santriError,    setSantriError]    = useState("");
  const [selectedSantri, setSelectedSantri] = useState(null);

  /* ── Form akademik ── */
  const [tanggal, setTanggal] = useState(getTodayString());
  const [loading, setLoading] = useState(false);
  const [msg,     setMsg]     = useState({ type: "", text: "" });
  const [rows,    setRows]    = useState(emptyRows());

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

  /* ── Pilih santri — reset rows ── */
  function pilihSantri(s) {
    setSelectedSantri(s);
    setRows(emptyRows());
    setMsg({ type: "", text: "" });
  }

  /* ── Manipulasi rows ── */
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
    if (!user?.id) { setMsg({ type:"error", text:"Sesi tidak ditemukan. Silakan login ulang." }); return; }
    if (!selectedSantri) { setMsg({ type:"error", text:"Pilih santri terlebih dahulu sebelum menyimpan." }); return; }

    const invalid = rows.filter((r) => !r.mapel.trim() || r.nilai === "");
    if (invalid.length > 0) { setMsg({ type:"error", text:"Semua baris harus diisi: nama mapel dan nilai." }); return; }

    const mapelList = rows.map((r) => r.mapel.trim().toLowerCase());
    const duplikat  = mapelList.filter((m, i) => mapelList.indexOf(m) !== i);
    if (duplikat.length > 0) { setMsg({ type:"error", text:`Terdapat mata pelajaran duplikat: ${duplikat[0]}.` }); return; }

    setLoading(true);
    try {
      const payloads = rows.map((r) => ({
        ustadz_id:      user.id,
        santri_id:      selectedSantri.id,
        tanggal,
        nama_pelajaran: r.mapel.trim(),
        nilai:          Number(r.nilai),
        keterangan:     r.catatan.trim() || null,
      }));

      const { error } = await supabase
        .from("catatan_akademik_harian")
        .upsert(payloads, { onConflict: "santri_id,tanggal,nama_pelajaran" });

      if (error) throw error;

      setMsg({
        type: "success",
        text: `${rows.length} catatan akademik ${selectedSantri.nama_santri} berhasil disimpan! 🎉`,
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      const m = err?.message?.toLowerCase() ?? "";
      if (m.includes("does not exist") || m.includes("relation")) {
        setMsg({ type:"error", text:"Tabel belum tersedia. Jalankan SQL migration." });
      } else if (m.includes("column") && m.includes("santri_id")) {
        setMsg({ type:"error", text:"Kolom santri_id belum ada. Jalankan SQL migration tambahan." });
      } else if (m.includes("violates") || m.includes("constraint")) {
        setMsg({ type:"error", text:"Terdapat data duplikat untuk mapel yang sama pada tanggal ini." });
      } else {
        setMsg({ type:"error", text:`Gagal menyimpan: ${err?.message ?? "Silakan coba lagi."}` });
      }
    } finally {
      setLoading(false);
    }
  }

  /* ── Ringkasan nilai ── */
  const nilaiTerisi   = rows.filter((r) => r.nilai !== "");
  const nilaiRataRata = nilaiTerisi.length > 0
    ? (nilaiTerisi.reduce((s, r) => s + Number(r.nilai), 0) / nilaiTerisi.length).toFixed(1)
    : null;
  const predikatRata  = nilaiRataRata !== null ? getPredikat(nilaiRataRata) : null;

  /* ══════════════════════════════
     RENDER
  ══════════════════════════════ */
  return (
    <div className="akademik-root">

      {/* ── Header ── */}
      <div className="akademik-header">
        <button type="button" className="akademik-back-btn"
          onClick={() => navigate("/dashboard")} aria-label="Kembali ke beranda">
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="akademik-title">Catatan Akademik</h1>
          <p className="akademik-subtitle">Input nilai dan perkembangan belajar santri</p>
        </div>
      </div>

      {/* ── Banner pesan ── */}
      {msg.text && (
        <div className={`akademik-msg akademik-msg--${msg.type}`} role={msg.type === "error" ? "alert" : "status"}>
          {msg.type === "success" ? "✓" : "⚠"} {msg.text}
        </div>
      )}

      {/* ═══════════════════════════════
          PILIH SANTRI
      ═══════════════════════════════ */}
      <div className="akademik-santri-section">
        <p className="akademik-santri-section__title">
          <User size={14} style={{ display:"inline", marginRight:6, verticalAlign:"middle" }} />
          Pilih Santri
        </p>

        {santriError && (
          <div className="akademik-msg akademik-msg--error" role="alert">⚠ {santriError}</div>
        )}

        {santriLoading && (
          <div className="akademik-santri-loading">
            <span className="akademik-santri-spinner" aria-hidden="true" />
            Memuat santri...
          </div>
        )}

        {!santriLoading && !santriError && santriList.length === 0 && (
          <div className="akademik-santri-empty">
            Belum ada santri. Tambahkan santri di halaman{" "}
            <button type="button" className="akademik-santri-empty__link"
              onClick={() => navigate("/dashboard/profil")}>
              Profil
            </button>.
          </div>
        )}

        {!santriLoading && santriList.length > 0 && (
          <div className="akademik-santri-grid">
            {santriList.map((s) => (
              <button
                key={s.id} type="button"
                className={`akademik-santri-card ${selectedSantri?.id === s.id ? "akademik-santri-card--active" : ""}`}
                onClick={() => pilihSantri(s)}
                aria-pressed={selectedSantri?.id === s.id}
              >
                <div className="akademik-santri-card__avatar" aria-hidden="true">
                  {s.nama_santri?.[0]?.toUpperCase() ?? "?"}
                </div>
                <div className="akademik-santri-card__info">
                  <span className="akademik-santri-card__nama">{s.nama_santri}</span>
                  <span className="akademik-santri-card__kelas">{s.kelas}</span>
                </div>
                {selectedSantri?.id === s.id && (
                  <CheckCircle2 size={18} className="akademik-santri-card__check" aria-hidden="true" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tampilkan form setelah santri dipilih */}
      {selectedSantri && (
        <>
          {/* ── Tanggal ── */}
          <div className="akademik-date-card">
            <div>
              <p className="akademik-date-card__label">Tanggal</p>
              <p className="akademik-date-card__display">{formatTanggal(tanggal)}</p>
            </div>
            <input type="date" className="akademik-date-input" value={tanggal}
              max={getTodayString()}
              onChange={(e) => { setTanggal(e.target.value); setMsg({ type:"",text:"" }); }}
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

          {/* ── Baris nilai ── */}
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
                <NilaiRow key={idx} row={row} index={idx}
                  onChange={handleChange} onRemove={removeRow}
                  showRemove={rows.length > 1} />
              ))}
            </div>
            <button type="button" className="akademik-add-btn"
              onClick={addRow} disabled={rows.length >= 20}>
              <Plus size={16} />
              Tambah Mata Pelajaran
            </button>
          </div>

          {/* ── Tombol Simpan ── */}
          <button type="button" className="akademik-save-btn"
            onClick={handleSave} disabled={loading}>
            {loading ? (
              <><span className="akademik-spinner" aria-hidden="true" />Menyimpan...</>
            ) : (
              <><Save size={19} />Simpan Akademik — {selectedSantri.nama_santri}</>
            )}
          </button>
        </>
      )}

    </div>
  );
}

export default CatatanAkademik;
