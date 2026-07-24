import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../lib/AuthContext";

function formatRp(n) {
  return "Rp " + Number(n || 0).toLocaleString("id-ID");
}

export default function Accounts() {
  const { session } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [name, setName] = useState("");
  const [balance, setBalance] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    const { data, error } = await supabase
      .from("accounts")
      .select("*")
      .order("created_at", { ascending: true });
    if (!error) setAccounts(data);
    setLoading(false);
  };

  useEffect(() => {
    if (session) load();
  }, [session]);

  const addAccount = async (e) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) return;
    const { error } = await supabase.from("accounts").insert({
      user_id: session.user.id,
      name: name.trim(),
      balance: Number(balance) || 0,
    });
    if (error) {
      setError(error.message);
      return;
    }
    setName("");
    setBalance("");
    load();
  };

  const total = accounts.reduce((sum, a) => sum + Number(a.balance), 0);

  return (
    <Layout>
      <header className="mb-8">
        <p className="text-xs text-muted font-mono mb-1">03 / REKENING</p>
        <h1 className="font-display text-2xl md:text-3xl font-semibold text-ink">
          Rekening & saldo
        </h1>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        <div className="md:col-span-2 order-2 md:order-1">
          <div className="ledger-rule mb-4" />
          {loading ? (
            <p className="text-sm text-muted">Memuat…</p>
          ) : accounts.length === 0 ? (
            <p className="text-sm text-muted">
              Belum ada rekening. Tambahkan di sebelah kanan.
            </p>
          ) : (
            <div className="space-y-3">
              {accounts.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between bg-surface border border-line rounded-lg px-5 py-4"
                >
                  <p className="font-medium text-ink">{a.name}</p>
                  <p className="num text-ink font-medium">{formatRp(a.balance)}</p>
                </div>
              ))}
              <div className="flex items-center justify-between px-5 pt-2">
                <p className="text-sm text-muted">Total saldo</p>
                <p className="num text-ledgerDark font-semibold">
                  {formatRp(total)}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="order-1 md:order-2">
          <form
            onSubmit={addAccount}
            className="bg-surface border border-line rounded-lg p-5 space-y-3"
          >
            <p className="text-sm font-medium text-ink">Tambah rekening</p>
            <div>
              <label className="text-xs text-muted">Nama rekening</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="mis. BCA, Dompet, GoPay"
                className="mt-1 w-full border border-line rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ledger"
              />
            </div>
            <div>
              <label className="text-xs text-muted">Saldo awal</label>
              <input
                type="number"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                placeholder="0"
                className="mt-1 w-full border border-line rounded px-3 py-2 text-sm num focus:outline-none focus:ring-2 focus:ring-ledger"
              />
            </div>
            {error && <p className="text-xs text-rust">{error}</p>}
            <button
              type="submit"
              className="w-full bg-ledger text-white rounded py-2 text-sm font-medium hover:bg-ledgerDark transition-colors"
            >
              Simpan
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
