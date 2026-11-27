import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft, RefreshCw,
  ClipboardCheck, Heart, GraduationCap, FileText,
  TrendingUp, Calendar, Users, CheckCircle2,
} from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import useAuth from "../../hooks/useAuth";
import "./RaportSantri.css";

/* ═══════════════════════════════════════
   HELPERS
═══════════════════════════════════════ */
function getTodayString() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,"0")}-${String(n.getDate()).padStart(2,"0")}`;
}
function getMonthStart() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,"0")}-01`;
}
function formatTanggal(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr + "T00:00:00").toLocaleDateString("id-ID", {
    day: "numeric", month: "long", year: "numeric",
  });
}
function formatTanggalPendek(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr + "T00:00:00").toLocaleDateString("id-ID", {
    day: "numeric", month: "short",
  });
}
function getPredikat(nilai) {
  const n = Number(nilai);
  if (isNaN(n)) return null;
  if (n >= 90) return { label: "A", keterangan: "Sangat Baik",    color: "green"  };
  if (n >= 75) return { label: "B", keterangan: "Baik",           color: "blue"   };
  if (n >= 60) return { label: "C", keterangan: "Cukup",          color: "amber"  };
  return          { label: "D", keterangan: "Perlu Bimbingan", color: "red"    };
}

const AMAL_LABELS = {
  subuh: "Sholat Subuh", dzuhur: "Sholat Dzuhur", ashar: "Sholat Ashar",
  maghrib: "Sholat Maghrib", isya: "Sholat Isya'", sunnah_tahajjud: "Sholat Tahajjud",
  sunnah_dhuha: "Sholat Dhuha", dzikir_pagi: "Dzikir Pagi", dzikir_sore: "Dzikir Sore",
  tilawah_setengah_juz: "Tilawah ½ Juz", doa_orang_tua: "Mendoakan Orang Tua",
};
const AMAL_KEYS = Object.keys(AMAL_LABELS);

/* ════════════════════════════════════════════
   HOOK — ambil data raport dengan filter santri
════════════════════════════════════════════ */
function useRaportData(userId, santriId, dari, sampai) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const fetch = useCallback(async () => {
    if (!userId || !dari || !sampai) return;
    setLoading(true);
    setError("");
    setData(null);

    try {
      /* Builder query — filter santri jika dipilih */
      function buildQuery(table) {
        let q = supabase
          .from(table)
          .select("*")
          .eq("ustadz_id", userId)
          .gte("tanggal", dari)
          .lte("tanggal", sampai)
          .order("tanggal", { ascending: true });
        if (santriId) q = q.eq("santri_id", santriId);
        return q;
      }

      const [amalRes, akhlakRes, akademikRes] = await Promise.all([
        buildQuery("monitoring_amal"),
        buildQuery("catatan_akhlak"),
        buildQuery("catatan_akademik_harian"),
      ]);

      if (amalRes.error)     throw amalRes.error;
      if (akhlakRes.error)   throw akhlakRes.error;
      if (akademikRes.error) throw akademikRes.error;

      setData({
        amal:     amalRes.data     ?? [],
        akhlak:   akhlakRes.data   ?? [],
        akademik: akademikRes.data ?? [],
      });
    } catch (err) {
      const m = err?.message?.toLowerCase() ?? "";
      if (m.includes("does not exist") || m.includes("relation")) {
        setError("Satu atau lebih tabel belum tersedia. Jalankan SQL migration.");
      } else {
        setError(`Gagal memuat data: ${err?.message ?? "Silakan coba lagi."}`);
      }
    } finally {
      setLoading(false);
    }
  }, [userId, santriId, dari, sampai]);

  useEffect(() => { fetch(); }, [fetch]);
  return { data, loading, error, refetch: fetch };
}

/* ════════════════════════════════════════════
   SUB-KOMPONEN: Seksi Amal
════════════════════════════════════════════ */
function SeksiAmal({ rows, dari, sampai }) {
  if (!rows.length)
    return <EmptyState icon={<ClipboardCheck size={28}/>} teks="Belum ada data amal pada periode ini." />;

  const total  = rows.length;
  const stats  = AMAL_KEYS.map((key) => ({
    key, label: AMAL_LABELS[key],
    count: rows.filter((r) => r[key]).length,
    pct:   Math.round((rows.filter((r) => r[key]).length / total) * 100),
  }));
  const avgPct = Math.round(stats.reduce((s, i) => s + i.pct, 0) / stats.length);

  return (
    <div className="raport-seksi">
      <div className="raport-skor-card">
        <div className={`raport-skor-card__ring raport-skor-card__ring--${avgPct >= 80 ? "green" : avgPct >= 60 ? "amber" : "red"}`}>
          <span className="raport-skor-card__nilai">{avgPct}%</span>
          <span className="raport-skor-card__sub">kepatuhan</span>
        </div>
        <div className="raport-skor-card__info">
          <p className="raport-skor-card__title">Rata-rata Amal Harian</p>
          <p className="raport-skor-card__periode">{formatTanggal(dari)} – {formatTanggal(sampai)}</p>
          <p className="raport-skor-card__hari">{total} hari tercatat</p>
        </div>
      </div>
      <div className="raport-amal-list">
        {stats.map((s) => (
          <div key={s.key} className="raport-amal-item">
            <div className="raport-amal-item__header">
              <span className="raport-amal-item__label">{s.label}</span>
              <span className={`raport-amal-item__pct ${s.pct >= 80 ? "pct--green" : s.pct >= 60 ? "pct--amber" : "pct--red"}`}>
                {s.count}/{total} ({s.pct}%)
              </span>
            </div>
            <div className="raport-amal-item__track">
              <div className={`raport-amal-item__fill ${s.pct >= 80 ? "fill--green" : s.pct >= 60 ? "fill--amber" : "fill--red"}`}
                style={{ width: `${s.pct}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   SUB-KOMPONEN: Seksi Akhlak
════════════════════════════════════════════ */
function SeksiAkhlak({ rows }) {
  if (!rows.length)
    return <EmptyState icon={<Heart size={28}/>} teks="Belum ada catatan akhlak pada periode ini." />;

  const total = rows.length;
  const items = [
    { key: "menyapa_teman",  label: "Menyapa Teman" },
    { key: "mengucap_salam", label: "Mengucapkan Salam" },
    { key: "tersenyum",      label: "Tersenyum" },
  ];
  const penilaianMap = {
    sangat_baik:     { label: "Sangat Baik",    color: "green",  count: 0 },
    baik:            { label: "Baik",           color: "blue",   count: 0 },
    cukup:           { label: "Cukup",          color: "amber",  count: 0 },
    perlu_bimbingan: { label: "Perlu Bimbingan",color: "red",    count: 0 },
  };
  rows.forEach((r) => { if (r.penilaian_perilaku && penilaianMap[r.penilaian_perilaku]) penilaianMap[r.penilaian_perilaku].count++; });

  return (
    <div className="raport-seksi">
      <div className="raport-akhlak-grid">
        {items.map((item) => {
          const count = rows.filter((r) => r[item.key]).length;
          const pct   = Math.round((count / total) * 100);
          return (
            <div key={item.key} className="raport-akhlak-card">
              <p className="raport-akhlak-card__nilai">{pct}%</p>
              <p className="raport-akhlak-card__label">{item.label}</p>
              <p className="raport-akhlak-card__sub">{count}/{total} hari</p>
            </div>
          );
        })}
      </div>
      {Object.values(penilaianMap).some((v) => v.count > 0) && (
        <>
          <p className="raport-label-kecil">Distribusi Penilaian Perilaku</p>
          <div className="raport-penilaian-grid">
            {Object.values(penilaianMap).map((p) => p.count > 0 && (
              <div key={p.label} className={`raport-penilaian-pill raport-penilaian-pill--${p.color}`}>
                <span className="raport-penilaian-pill__label">{p.label}</span>
                <span className="raport-penilaian-pill__count">{p.count}×</span>
              </div>
            ))}
          </div>
        </>
      )}
      {rows.filter((r) => r.catatan_perilaku).length > 0 && (
        <>
          <p className="raport-label-kecil">Catatan Perilaku Terbaru</p>
          <div className="raport-catatan-list">
            {rows.filter((r) => r.catatan_perilaku).slice(-3).reverse().map((r) => (
              <div key={r.id} className="raport-catatan-item">
                <span className="raport-catatan-item__tanggal">{formatTanggalPendek(r.tanggal)}</span>
                <span className="raport-catatan-item__teks">{r.catatan_perilaku}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════
   SUB-KOMPONEN: Seksi Akademik
════════════════════════════════════════════ */
function SeksiAkademik({ rows }) {
  if (!rows.length)
    return <EmptyState icon={<GraduationCap size={28}/>} teks="Belum ada catatan akademik pada periode ini." />;

  const perMapel = {};
  rows.forEach((r) => {
    if (!perMapel[r.nama_pelajaran]) perMapel[r.nama_pelajaran] = [];
    perMapel[r.nama_pelajaran].push(Number(r.nilai));
  });
  const mapelStats = Object.entries(perMapel).map(([nama, arr]) => {
    const rata = arr.reduce((s, v) => s + v, 0) / arr.length;
    return { nama, rata: rata.toFixed(1), predikat: getPredikat(rata) };
  }).sort((a, b) => Number(b.rata) - Number(a.rata));

  const allNilai = rows.map((r) => Number(r.nilai));
  const rataAll  = (allNilai.reduce((s, v) => s + v, 0) / allNilai.length).toFixed(1);
  const predAll  = getPredikat(rataAll);

  return (
    <div className="raport-seksi">
      <div className="raport-akademik-summary">
        <div>
          <p className="raport-akademik-summary__label">Rata-rata Keseluruhan</p>
          <p className="raport-akademik-summary__nilai">{rataAll}</p>
        </div>
        {predAll && (
          <div className={`raport-akademik-summary__predikat raport-akademik-summary__predikat--${predAll.color}`}>
            <span className="raport-akademik-summary__predikat-label">{predAll.label}</span>
            <span className="raport-akademik-summary__predikat-ket">{predAll.keterangan}</span>
          </div>
        )}
      </div>
      <div className="raport-mapel-table">
        <div className="raport-mapel-table__head">
          <span>Mata Pelajaran</span><span>Rata-rata</span><span>Predikat</span>
        </div>
        {mapelStats.map((m) => (
          <div key={m.nama} className="raport-mapel-table__row">
            <span className="raport-mapel-table__nama">{m.nama}</span>
            <span className="raport-mapel-table__nilai">{m.rata}</span>
            {m.predikat && (
              <span className={`raport-mapel-table__predikat raport-mapel-table__predikat--${m.predikat.color}`}>
                {m.predikat.label}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyState({ icon, teks }) {
  return (
    <div className="raport-empty">
      <div className="raport-empty__icon">{icon}</div>
      <p className="raport-empty__teks">{teks}</p>
    </div>
  );
}

const TABS = [
  { key: "amal",     label: "Amal",     icon: <ClipboardCheck size={16}/> },
  { key: "akhlak",   label: "Akhlak",   icon: <Heart          size={16}/> },
  { key: "akademik", label: "Akademik", icon: <GraduationCap  size={16}/> },
];

/* ════════════════════════════════════════════
   KOMPONEN UTAMA
════════════════════════════════════════════ */
function RaportSantri() {
  const navigate    = useNavigate();
  const { user }    = useAuth();

  /* ── Daftar santri ── */
  const [santriList,     setSantriList]     = useState([]);
  const [santriLoading,  setSantriLoading]  = useState(true);
  const [selectedSantri, setSelectedSantri] = useState(null); // null = semua santri

  /* ── Filter & tab ── */
  const [dari,   setDari]   = useState(getMonthStart());
  const [sampai, setSampai] = useState(getTodayString());
  const [tab,    setTab]    = useState("amal");

  /* Ambil santri saat mount */
  useEffect(() => {
    if (!user?.id) return;
    setSantriLoading(true);
    supabase
      .from("santri_diasuh")
      .select("id, nama_santri, kelas")
      .eq("ustadz_id", user.id)
      .order("nama_santri", { ascending: true })
      .then(({ data }) => {
        setSantriLoading(false);
        setSantriList(data ?? []);
      });
  }, [user?.id]);

  const { data, loading, error, refetch } = useRaportData(
    user?.id,
    selectedSantri?.id ?? null,
    dari,
    sampai
  );

  function handleDariChange(e) {
    const v = e.target.value;
    if (v > sampai) setSampai(v);
    setDari(v);
  }
  function handleSampaiChange(e) {
    const v = e.target.value;
    if (v < dari) setDari(v);
    setSampai(v);
  }

  /* ══════════════════════════════
     RENDER
  ══════════════════════════════ */
  return (
    <div className="raport-root">

      {/* ── Header ── */}
      <div className="raport-header">
        <button type="button" className="raport-back-btn"
          onClick={() => navigate("/dashboard")} aria-label="Kembali ke beranda">
          <ChevronLeft size={20} />
        </button>
        <div className="raport-header__text">
          <h1 className="raport-title">Raport Santri</h1>
          <p className="raport-subtitle">Rekap amal, akhlak & akademik</p>
        </div>
        <button type="button"
          className={`raport-refresh-btn ${loading ? "raport-refresh-btn--spin" : ""}`}
          onClick={refetch} disabled={loading} aria-label="Muat ulang data">
          <RefreshCw size={18} />
        </button>
      </div>

      {/* ═══════════════════════════════
          FILTER SANTRI
      ═══════════════════════════════ */}
      <div className="raport-santri-section">
        <p className="raport-santri-section__title">
          <Users size={13} style={{ display:"inline", marginRight:6, verticalAlign:"middle" }} />
          Santri
        </p>

        {!santriLoading && (
          <div className="raport-santri-grid">
            {/* Kartu "Semua Santri" */}
            <button
              type="button"
              className={`raport-santri-card ${selectedSantri === null ? "raport-santri-card--active" : ""}`}
              onClick={() => setSelectedSantri(null)}
              aria-pressed={selectedSantri === null}
            >
              <div className="raport-santri-card__avatar raport-santri-card__avatar--all" aria-hidden="true">
                <Users size={16} />
              </div>
              <div className="raport-santri-card__info">
                <span className="raport-santri-card__nama">Semua Santri</span>
                <span className="raport-santri-card__kelas">{santriList.length} santri</span>
              </div>
              {selectedSantri === null && (
                <CheckCircle2 size={16} className="raport-santri-card__check" aria-hidden="true" />
              )}
            </button>

            {/* Kartu per santri */}
            {santriList.map((s) => (
              <button
                key={s.id} type="button"
                className={`raport-santri-card ${selectedSantri?.id === s.id ? "raport-santri-card--active" : ""}`}
                onClick={() => setSelectedSantri(selectedSantri?.id === s.id ? null : s)}
                aria-pressed={selectedSantri?.id === s.id}
              >
                <div className="raport-santri-card__avatar" aria-hidden="true">
                  {s.nama_santri?.[0]?.toUpperCase() ?? "?"}
                </div>
                <div className="raport-santri-card__info">
                  <span className="raport-santri-card__nama">{s.nama_santri}</span>
                  <span className="raport-santri-card__kelas">{s.kelas}</span>
                </div>
                {selectedSantri?.id === s.id && (
                  <CheckCircle2 size={16} className="raport-santri-card__check" aria-hidden="true" />
                )}
              </button>
            ))}
          </div>
        )}

        {santriLoading && (
          <div className="raport-santri-loading">
            <span className="raport-santri-spinner" aria-hidden="true" />
            Memuat santri...
          </div>
        )}
      </div>

      {/* ── Filter rentang tanggal ── */}
      <div className="raport-filter-card">
        <div className="raport-filter-card__icon" aria-hidden="true">
          <Calendar size={18} />
        </div>
        <div className="raport-filter-card__fields">
          <div className="raport-filter-field">
            <label className="raport-filter-label" htmlFor="raport-dari">Dari</label>
            <input id="raport-dari" type="date" className="raport-date-input"
              value={dari} max={getTodayString()} onChange={handleDariChange} />
          </div>
          <span className="raport-filter-sep">—</span>
          <div className="raport-filter-field">
            <label className="raport-filter-label" htmlFor="raport-sampai">Sampai</label>
            <input id="raport-sampai" type="date" className="raport-date-input"
              value={sampai} max={getTodayString()} onChange={handleSampaiChange} />
          </div>
        </div>
      </div>

      {/* ── Error banner ── */}
      {error && <div className="raport-msg raport-msg--error" role="alert">⚠ {error}</div>}

      {/* ── Loading ── */}
      {loading && (
        <div className="raport-loading">
          <div className="raport-loading__spinner" aria-hidden="true" />
          <p>Memuat data raport{selectedSantri ? ` ${selectedSantri.nama_santri}` : ""}...</p>
        </div>
      )}

      {/* ── Konten ── */}
      {!loading && data && (
        <>
          <div className="raport-overview-grid">
            <div className="raport-overview-card raport-overview-card--green">
              <ClipboardCheck size={20} />
              <div>
                <p className="raport-overview-card__nilai">{data.amal.length}</p>
                <p className="raport-overview-card__label">Hari Amal</p>
              </div>
            </div>
            <div className="raport-overview-card raport-overview-card--blue">
              <Heart size={20} />
              <div>
                <p className="raport-overview-card__nilai">{data.akhlak.length}</p>
                <p className="raport-overview-card__label">Catatan Akhlak</p>
              </div>
            </div>
            <div className="raport-overview-card raport-overview-card--amber">
              <GraduationCap size={20} />
              <div>
                <p className="raport-overview-card__nilai">
                  {[...new Set(data.akademik.map((r) => r.tanggal))].length}
                </p>
                <p className="raport-overview-card__label">Hari Akademik</p>
              </div>
            </div>
            <div className="raport-overview-card raport-overview-card--purple">
              <TrendingUp size={20} />
              <div>
                <p className="raport-overview-card__nilai">
                  {data.amal.length + data.akhlak.length + data.akademik.length}
                </p>
                <p className="raport-overview-card__label">Total Entri</p>
              </div>
            </div>
          </div>

          <div className="raport-tabs" role="tablist">
            {TABS.map((t) => (
              <button key={t.key} type="button" role="tab"
                className={`raport-tab ${tab === t.key ? "raport-tab--active" : ""}`}
                onClick={() => setTab(t.key)} aria-selected={tab === t.key}>
                {t.icon}{t.label}
              </button>
            ))}
          </div>

          <div role="tabpanel">
            {tab === "amal"     && <SeksiAmal     rows={data.amal}     dari={dari} sampai={sampai} />}
            {tab === "akhlak"   && <SeksiAkhlak   rows={data.akhlak}   />}
            {tab === "akademik" && <SeksiAkademik rows={data.akademik} />}
          </div>
        </>
      )}

      {!loading && data &&
        data.amal.length === 0 && data.akhlak.length === 0 && data.akademik.length === 0 && (
        <div className="raport-no-data">
          <FileText size={36} />
          <p>Tidak ada data pada periode ini{selectedSantri ? ` untuk ${selectedSantri.nama_santri}` : ""}.</p>
          <p className="raport-no-data__hint">Mulai input amal, akhlak, dan akademik terlebih dahulu.</p>
        </div>
      )}

    </div>
  );
}

export default RaportSantri;
