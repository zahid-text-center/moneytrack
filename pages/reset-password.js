import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";

export default function ResetPassword() {
  const router = useRouter();
  // checking = menunggu sesi dari tautan email, ready = form tampil, invalid = tautan salah/kedaluwarsa
  const [status, setStatus] = useState("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let active = true;

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
        setStatus("ready");
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (active && data.session) setStatus("ready");
    });

    // Kalau sampai beberapa detik belum ada sesi, anggap tautan tidak valid
    const timer = setTimeout(() => {
      if (active) setStatus((s) => (s === "checking" ? "invalid" : s));
    }, 3000);

    return () => {
      active = false;
      clearTimeout(timer);
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("Kata sandi minimal 6 karakter.");
      return;
    }
    if (password !== confirm) {
      setError("Konfirmasi kata sandi tidak sama.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setDone(true);
    await supabase.auth.signOut();
    setTimeout(() => router.push("/login"), 2000);
  };

  if (done) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center px-4">
        <div className="max-w-sm text-center">
          <p className="font-display text-2xl font-semibold text-ink mb-2">
            Kata sandi berhasil diubah
          </p>
          <p className="text-sm text-muted mb-6">
            Kamu akan diarahkan ke halaman masuk. Silakan masuk dengan kata
            sandi baru.
          </p>
          <Link href="/login" className="text-ledger font-medium text-sm">
            Ke halaman masuk
          </Link>
        </div>
      </div>
    );
  }

  if (status === "checking") {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <p className="font-mono text-sm text-muted">Memeriksa tautan…</p>
      </div>
    );
  }

  if (status === "invalid") {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center px-4">
        <div className="max-w-sm text-center">
          <p className="font-display text-2xl font-semibold text-ink mb-2">
            Tautan tidak valid
          </p>
          <p className="text-sm text-muted mb-6">
            Tautan reset ini sudah kedaluwarsa atau sudah dipakai. Minta tautan
            yang baru, ya.
          </p>
          <Link href="/forgot-password" className="text-ledger font-medium text-sm">
            Minta tautan baru
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <p className="font-display text-3xl font-semibold text-ink text-center mb-1">
          Ledgy<span className="text-ledger">.</span>
        </p>
        <p className="text-sm text-muted text-center mb-8">
          Buat kata sandi baru
        </p>
        <form
          onSubmit={handleSubmit}
          className="bg-surface border border-line rounded-lg p-6 space-y-4"
        >
          <div>
            <label className="text-xs text-muted">Kata sandi baru</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full border border-line rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ledger"
            />
          </div>
          <div>
            <label className="text-xs text-muted">Ulangi kata sandi baru</label>
            <input
              type="password"
              required
              minLength={6}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="mt-1 w-full border border-line rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ledger"
            />
          </div>
          {error && <p className="text-sm text-rust">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-ledger text-white rounded py-2 text-sm font-medium hover:bg-ledgerDark transition-colors disabled:opacity-60"
          >
            {loading ? "Menyimpan…" : "Simpan kata sandi"}
          </button>
        </form>
      </div>
    </div>
  );
}
