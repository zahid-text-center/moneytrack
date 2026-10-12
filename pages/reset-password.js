import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";

export default function ResetPassword() {
  const router = useRouter();
  // checking = memeriksa tautan, confirm = menunggu klik "Lanjutkan" (tautan baru dengan token_hash),
  // ready = form kata sandi tampil, invalid = tautan salah/kedaluwarsa
  const [status, setStatus] = useState("checking");
  const [tokenHash, setTokenHash] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let active = true;

    // Tautan baru: /reset-password?token_hash=...&type=recovery
    // Token TIDAK dipakai saat halaman dibuka, supaya pemindai email tidak menghabiskannya.
    const params = new URLSearchParams(window.location.search);
    const hash = params.get("token_hash");
    if (hash && params.get("type") === "recovery") {
      setTokenHash(hash);
      setStatus("confirm");
      return () => {
        active = false;
      };
    }

    // Cadangan untuk tautan lama berbentuk #access_token=... (alur bawaan Supabase)
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
        setStatus("ready");
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (active && data.session) setStatus("ready");
    });

    const timer = setTimeout(() => {
      if (active) setStatus((s) => (s === "checking" ? "invalid" : s));
    }, 3000);

    return () => {
      active = false;
      clearTimeout(timer);
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleVerify = async () => {
    setVerifying(true);
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: "recovery",
    });
    setVerifying(false);
    if (error) {
      setStatus("invalid");
      return;
    }
    // Bersihkan token dari alamat browser
    window.history.replaceState({}, "", "/reset-password");
    setStatus("ready");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("Kata sandi minimal 6 karakter.");
      return;
    }
    if (password !== confirmPw) {
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

  if (status === "confirm") {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center px-4">
        <div className="max-w-sm text-center">
          <p className="font-display text-3xl font-semibold text-ink mb-1">
            Ledgy<span className="text-ledger">.</span>
          </p>
          <p className="text-sm text-muted mb-8">
            Klik tombol di bawah untuk melanjutkan membuat kata sandi baru.
          </p>
          <button
            onClick={handleVerify}
            disabled={verifying}
            className="w-full bg-ledger text-white rounded py-2 text-sm font-medium hover:bg-ledgerDark transition-colors disabled:opacity-60"
          >
            {verifying ? "Memeriksa…" : "Lanjutkan"}
          </button>
        </div>
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
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
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
