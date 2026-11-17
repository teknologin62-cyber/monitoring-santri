import { Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import Beranda  from "./dashboard/Beranda";
import Riwayat  from "./dashboard/Riwayat";
import Profil   from "./dashboard/Profil";

/**
 * Dashboard — entry point area privat.
 *
 * Mengelola sub-routing di dalam area dashboard:
 *   /dashboard          → Beranda
 *   /dashboard/riwayat  → Riwayat
 *   /dashboard/profil   → Profil
 *   /dashboard/*        → redirect ke /dashboard
 *
 * DashboardLayout menyediakan header + bottom navigation
 * yang konsisten di semua tab.
 *
 * Halaman ini dilindungi ProtectedRoute di App.jsx —
 * tidak ada logika auth di sini.
 */
function Dashboard() {
  return (
    <DashboardLayout>
      <Routes>
        <Route index          element={<Beranda />} />
        <Route path="riwayat" element={<Riwayat />} />
        <Route path="profil"  element={<Profil />} />
        {/* Catch-all di dalam dashboard */}
        <Route path="*"       element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </DashboardLayout>
  );
}

export default Dashboard;
