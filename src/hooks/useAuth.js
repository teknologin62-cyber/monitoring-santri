import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

/**
 * useAuth — hook terpusat untuk membaca session dan data pengguna.
 *
 * Mengembalikan:
 *  - user       : objek user Supabase (null jika belum login)
 *  - fullName   : string nama lengkap dari user_metadata.full_name
 *  - email      : string email pengguna
 *  - role       : string role dari user_metadata.role ('admin' | 'ustadz' | null)
 *  - initials   : 1–2 huruf kapital untuk avatar teks
 *  - loading    : true selama session awal belum selesai dicek
 *
 * Cara pakai:
 *   const { fullName, email, role, initials, loading } = useAuth();
 */
function useAuth() {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Cek session awal dari localStorage
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    });

    // Pantau perubahan auth (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (mounted) {
          setUser(session?.user ?? null);
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  /* ── data turunan ── */
  const fullName = user?.user_metadata?.full_name ?? "";
  const email    = user?.email ?? "";
  const role     = user?.user_metadata?.role ?? null;

  // Buat inisial: ambil huruf pertama tiap kata, maks 2
  const initials = fullName
    ? fullName
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((w) => w[0].toUpperCase())
        .join("")
    : (email ? email[0].toUpperCase() : "?");

  return { user, fullName, email, role, initials, loading };
}

export default useAuth;
