import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

/**
 * PublicOnlyRoute
 *
 * Membungkus halaman yang hanya boleh diakses pengguna yang BELUM login
 * (contoh: /login, /register).
 *
 * - Sudah login → redirect ke /dashboard
 * - Belum login → render children
 * - Sedang cek session → tampilkan loading (sama dengan ProtectedRoute)
 */
function PublicOnlyRoute({ children }) {
  const [authState, setAuthState] = useState(null);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) setAuthState(!!session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) setAuthState(!!session);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Sedang memeriksa
  if (authState === null) {
    return (
      <div className="auth-loading" role="status" aria-label="Memeriksa sesi">
        <div className="auth-loading__spinner" aria-hidden="true" />
        <p>Memeriksa sesi&hellip;</p>
      </div>
    );
  }

  // Sudah login → ke dashboard
  if (authState === true) {
    return <Navigate to="/dashboard" replace />;
  }

  // Belum login → tampilkan halaman
  return children;
}

export default PublicOnlyRoute;
