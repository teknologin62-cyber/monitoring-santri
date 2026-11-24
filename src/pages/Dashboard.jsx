import { Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import Beranda       from "./dashboard/Beranda";
import Riwayat       from "./dashboard/Riwayat";
import Profil        from "./dashboard/Profil";
import InputAmal     from "./dashboard/InputAmal";
import CatatanAkhlak from "./dashboard/CatatanAkhlak";

/**
 * Dashboard — entry point area privat.
 *
 *   /dashboard           → Beranda
 *   /dashboard/amal      → Input Amal Santri
 *   /dashboard/akhlak    → Catatan Akhlak
 *   /dashboard/riwayat   → Riwayat
 *   /dashboard/profil    → Profil
 *   /dashboard/*         → redirect ke /dashboard
 */
function Dashboard() {
  return (
    <DashboardLayout>
      <Routes>
        <Route index           element={<Beranda />}       />
        <Route path="amal"     element={<InputAmal />}     />
        <Route path="akhlak"   element={<CatatanAkhlak />} />
        <Route path="riwayat"  element={<Riwayat />}       />
        <Route path="profil"   element={<Profil />}        />
        <Route path="*"        element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </DashboardLayout>
  );
}

export default Dashboard;
