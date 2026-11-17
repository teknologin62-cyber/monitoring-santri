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
 *  /            → Welcome          (publik)
 *  /login       → Login            (publik, tapi redirect ke /dashboard jika sudah login)
 *  /dashboard   → Dashboard        (privat — dilindungi ProtectedRoute)
 *  *            → redirect ke /    (catch-all)
 */
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── Halaman publik ── */}
        <Route path="/" element={<Welcome />} />

        {/* /login: jika sudah login → langsung ke dashboard */}
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <Login />
            </PublicOnlyRoute>
          }
        />

        {/* ── Halaman privat ── */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* ── Catch-all: route tidak dikenal → halaman utama ── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
