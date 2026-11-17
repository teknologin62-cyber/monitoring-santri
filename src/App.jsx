import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Welcome from "./pages/Welcome";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicOnlyRoute from "./components/PublicOnlyRoute";
import "./App.css";

/**
 * Struktur route:
 *
 *  /            → Welcome      (publik)
 *  /login       → Login        (publik, redirect ke /dashboard jika sudah login)
 *  /dashboard/* → Dashboard    (privat — dilindungi ProtectedRoute)
 *  *            → redirect /   (catch-all)
 *
 * CATATAN KEAMANAN (v3.2):
 *   Route /register telah dinonaktifkan (Opsi A — keputusan C-05).
 *   Pembuatan akun ustadz dilakukan HANYA oleh admin melalui:
 *     Supabase Dashboard → Authentication → Users → Invite User
 *   Atau melalui fitur manajemen akun yang akan dibangun di area admin.
 */
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── Halaman publik ── */}
        <Route path="/" element={<Welcome />} />

        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <Login />
            </PublicOnlyRoute>
          }
        />

        {/* /register dinonaktifkan — redirect ke /login */}
        <Route path="/register" element={<Navigate to="/login" replace />} />

        {/* ── Halaman privat ── */}
        <Route
          path="/dashboard/*"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* ── Catch-all ── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
