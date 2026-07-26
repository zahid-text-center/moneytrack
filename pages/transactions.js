import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../lib/AuthContext";
import { CATEGORIES, mergeCategories } from "../lib/categories";
import { localDateStr } from "../lib/date";

function formatRp(n) {
  return "Rp " + Number(n || 0).toLocaleString("id-ID");
}

export default function Transactions() {
  const { session } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [items, setItems] = useState([]);
  const [customCategories, setCustomCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    type: "expense",
    amount: "",
    category: CATEGORIES[0],
    account_id: "",
    note: "",
    date: localDateStr(),
  });
  const [error, setError] = useState("");

  const load = async () => {
    const [accRes, txRes, catRes] = await Promise.all([
      supabase.from("accounts").select("*").order("created_at"),
      supabase
        .from("transactions")
        .select("*, accounts(name)")
        .order("date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(200),
      supabase.from("categories").select("*").order("created_at"),
    ]);
    if (!accRes.error) setAccounts(accRes.data);
    if (!txRes.error) setItems(txRes.data);
    if (!catRes.error) setCustomCategories(catRes.data);
    setLoading(false);
  };

  useEffect(() => {
    if (session) load();
  }, [session]);

  useEffect(() => {
    if (accounts.length && !form.account_id) {
      setForm((f) => ({ ...f, account_id: accounts[0].id }));
    }
  }, [accounts]);

  const allCategories = mergeCategories(CATEGORIES, customCategories);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.account_id || !form.amount) {
      setError("Lengkapi jumlah dan rekening.");
      return;
    }
    const amount = Number(form.amount);
    const { error: txError } = await supabase.from("transactions").insert({
      user_id: session.user.id,
      account_id: form.account_id,
      type: form.type,
      amount,
      category: form.category,
      note: form.note,
      date: form.date,
    });
    if (txError) {
      setError(txError.message);
      return;
    }

    const account = accounts.find((a) => a.id === form.account_id);
    const delta = form.type === "income" ? amount : -amount;
    await supabase
      .from("accounts")
      .update({ balance: Number(account.balance) + delta })
      .eq("id", form.account_id);

    setForm((f) => ({ ...f, amount: "", note: "" }));
    load();
  };

  return (
    <Layout>
      <header className="mb-8">
        <p className="text-xs text-muted font-mono mb-1">02 / TRANSAKSI</p>
        <h1 className="font-display text-2xl md:text-3xl font-semibold text-ink">
          Catat transaksi
        </h1>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        <div className="md:col-span-2 order-2 md:order-1">
          <div className="ledger-rule mb-4" />
          {loading ? (
            <p className="text-sm text-muted">Memuat…</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted">Belum ada transaksi.</p>
          ) : (
            <div className="space-y-1">
              {items.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between py-3 border-b border-line"
                >
                  <div>
                    <p className="text-sm text-ink font-medium">
                      {t.category}
                      {t.note ? ` — ${t.note}` : ""}
                    </p>
                    <p className="text-xs text-muted">
                      {new Date(t.date).toLocaleDateString("id-ID")} ·{" "}
                      {t.accounts?.name}
                    </p>
                  </div>
                  <p
                    className={`num font-medium ${
                      t.type === "income" ? "text-ledgerDark" : "text-rust"
                    }`}
                  >
                    {t.type === "income" ? "+" : "-"}
                    {formatRp(t.amount)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="order-1 md:order-2">
          <form
            onSubmit={handleSubmit}
            className="bg-surface border border-line rounded-lg p-5 space-y-3"
          >
            <p className="text-sm font-medium text-ink">Transaksi baru</p>

            <div className="flex gap-2">
              {["expense", "income"].map((type) => (
                <button
                  type="button"
                  key={type}
                  onClick={() => setForm((f) => ({ ...f, type }))}
                  className={`flex-1 rounded py-2 text-sm font-medium border ${
                    form.type === type
                      ? type === "income"
                        ? "bg-ledger/10 border-ledger text-ledgerDark"
                        : "bg-rust/10 border-rust text-rust"
                      : "border-line text-muted"
                  }`}
                >
                  {type === "income" ? "Pemasukan" : "Pengeluaran"}
                </button>
              ))}
            </div>

            <div>
              <label className="text-xs text-muted">Jumlah</label>
              <input
                type="number"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                placeholder="0"
                className="mt-1 w-full border border-line rounded px-3 py-2 text-sm num focus:outline-none focus:ring-2 focus:ring-ledger"
              />
            </div>

            <div>
              <label className="text-xs text-muted">Rekening</label>
              <select
                value={form.account_id}
                onChange={(e) => setForm((f) => ({ ...f, account_id: e.target.value }))}
                className="mt-1 w-full border border-line rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ledger"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-muted">Kategori</label>
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="mt-1 w-full border border-line rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ledger"
              >
                {allCategories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-muted">Tanggal</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className="mt-1 w-full border border-line rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ledger"
              />
            </div>

            <div>
              <label className="text-xs text-muted">Catatan (opsional)</label>
              <input
                value={form.note}
                onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                className="mt-1 w-full border border-line rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ledger"
              />
            </div>

            {error && <p className="text-xs text-rust">{error}</p>}
            <button
              type="submit"
              className="w-full bg-ledger text-white rounded py-2 text-sm font-medium hover:bg-ledgerDark transition-colors"
            >
              Simpan transaksi
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
