import { Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout   from "../components/DashboardLayout";
import Beranda           from "./dashboard/Beranda";
import Riwayat           from "./dashboard/Riwayat";
import Profil            from "./dashboard/Profil";
import InputAmal         from "./dashboard/InputAmal";
import CatatanAkhlak     from "./dashboard/CatatanAkhlak";
import CatatanAkademik   from "./dashboard/CatatanAkademik";
import RaportSantri      from "./dashboard/RaportSantri";

/**
 *   /dashboard             → Beranda
 *   /dashboard/amal        → Input Amal Santri
 *   /dashboard/akhlak      → Catatan Akhlak
 *   /dashboard/akademik    → Catatan Akademik
 *   /dashboard/raport      → Raport Santri
 *   /dashboard/riwayat     → Riwayat
 *   /dashboard/profil      → Profil
 */
function Dashboard() {
  return (
    <DashboardLayout>
      <Routes>
        <Route index              element={<Beranda />}          />
        <Route path="amal"        element={<InputAmal />}        />
        <Route path="akhlak"      element={<CatatanAkhlak />}    />
        <Route path="akademik"    element={<CatatanAkademik />}  />
        <Route path="raport"      element={<RaportSantri />}     />
        <Route path="riwayat"     element={<Riwayat />}          />
        <Route path="profil"      element={<Profil />}           />
        <Route path="*"           element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </DashboardLayout>
  );
}

export default Dashboard;
