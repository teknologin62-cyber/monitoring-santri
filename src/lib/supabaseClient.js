import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY harus diisi di file .env.local"
  );
}

/**
 * Satu instance Supabase client untuk seluruh aplikasi.
 * Dibuat sekali di sini dan di-import di tempat lain — tidak boleh
 * memanggil createClient() lagi di file lain.
 *
 * Opsi auth:
 *  - persistSession    : session disimpan di localStorage agar tetap ada setelah refresh
 *  - autoRefreshToken  : token diperbarui otomatis sebelum kedaluwarsa
 *  - detectSessionInUrl: membaca token dari URL hash setelah OAuth / magic link redirect
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
