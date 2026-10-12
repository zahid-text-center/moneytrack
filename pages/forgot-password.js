import { useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabaseClient";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      setError("Gagal mengirim email. Coba lagi sebentar lagi.");
      return;
    }
    setSent(true);
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center px-4">
        <div className="max-w-sm text-center">
          <p className="font-display text-2xl font-semibold text-ink mb-2">
            Cek email kamu
          </p>
          <p className="text-sm text-muted mb-6">
            Jika {email} terdaftar, kami sudah mengirim tautan untuk mengatur
            ulang kata sandi. Cek juga folder spam.
          </p>
          <Link href="/login" className="text-ledger font-medium text-sm">
            Kembali ke halaman masuk
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
          Atur ulang kata sandi
        </p>
        <form
          onSubmit={handleSubmit}
          className="bg-surface border border-line rounded-lg p-6 space-y-4"
        >
          <p className="text-sm text-muted">
            Masukkan email akunmu, nanti kami kirimkan tautan untuk membuat
            kata sandi baru.
          </p>
          <div>
            <label className="text-xs text-muted">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full border border-line rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ledger"
            />
          </div>
          {error && <p className="text-sm text-rust">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-ledger text-white rounded py-2 text-sm font-medium hover:bg-ledgerDark transition-colors disabled:opacity-60"
          >
            {loading ? "Mengirim…" : "Kirim tautan reset"}
          </button>
        </form>
        <p className="text-sm text-muted text-center mt-4">
          Ingat kata sandimu?{" "}
          <Link href="/login" className="text-ledger font-medium">
            Masuk
          </Link>
        </p>
      </div>
    </div>
  );
}
