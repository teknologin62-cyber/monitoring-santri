import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

/**
 * ProtectedRoute
 *
 * Membungkus halaman yang hanya boleh diakses pengguna yang sudah login.
 *
 * Alur:
 *  1. Mount → cek session aktif via getSession()
 *  2. Pasang listener onAuthStateChange untuk menangkap logout / token refresh
 *  3. Selama pengecekan: tampilkan layar loading
 *  4. Tidak ada session → redirect ke /login (replace agar tidak masuk history)
 *  5. Session ada → render children
 *  6. Unmount → bersihkan subscription (mencegah memory leak & infinite loop)
 */
function ProtectedRoute({ children }) {
  // null  = belum tahu (sedang cek)
  // false = tidak ada session
  // true  = session valid
  const [authState, setAuthState] = useState(null);

  useEffect(() => {
    let mounted = true;

    // ── 1. Cek session awal dari localStorage ──
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) {
        setAuthState(!!session);
      }
    });

    // ── 2. Listener perubahan auth (login, logout, token refresh) ──
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setAuthState(!!session);
      }
    });

    // ── 3. Cleanup saat komponen dilepas ──
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); // array kosong → hanya jalan sekali saat mount

  // ── Sedang memeriksa session ──
  if (authState === null) {
    return (
      <div className="auth-loading" role="status" aria-label="Memeriksa sesi">
        <div className="auth-loading__spinner" aria-hidden="true" />
        <p>Memeriksa sesi&hellip;</p>
      </div>
    );
  }

  // ── Tidak ada session → ke /login ──
  if (authState === false) {
    return <Navigate to="/login" replace />;
  }

  // ── Session valid → render halaman ──
  return children;
}

export default ProtectedRoute;
