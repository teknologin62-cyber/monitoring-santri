import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Welcome from "./pages/Welcome";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicOnlyRoute from "./components/PublicOnlyRoute";
import "./App.css";

/**
 * Struktur route:
 *
 *  /            → Welcome          (publik)
 *  /login       → Login            (publik, redirect ke /dashboard jika sudah login)
 *  /register    → Register         (publik, redirect ke /dashboard jika sudah login)
 *  /dashboard   → Dashboard        (privat — dilindungi ProtectedRoute)
 *  *            → redirect ke /    (catch-all)
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

        <Route
          path="/register"
          element={
            <PublicOnlyRoute>
              <Register />
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

        {/* ── Catch-all ── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
