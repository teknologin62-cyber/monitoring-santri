import { ClipboardList } from "lucide-react";
import "./Riwayat.css";

/**
 * Riwayat — tab riwayat monitoring.
 * Placeholder untuk Tahap 5 (setelah tabel monitoring tersedia).
 */
function Riwayat() {
  return (
    <div className="riwayat-root">
      <h1 className="riwayat-title">Riwayat Monitoring</h1>
      <p className="riwayat-sub">
        Semua catatan monitoring santri akan ditampilkan di sini.
      </p>

      <div className="riwayat-empty">
        <div className="riwayat-empty__icon" aria-hidden="true">
          <ClipboardList size={40} />
        </div>
        <p className="riwayat-empty__title">Belum ada riwayat</p>
        <p className="riwayat-empty__desc">
          Fitur riwayat akan tersedia setelah data monitoring mulai diinput.
        </p>
      </div>
    </div>
  );
}

export default Riwayat;
