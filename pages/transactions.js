import { useEffect, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import Layout from "../components/Layout";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../lib/AuthContext";
import { CATEGORIES, mergeCategories } from "../lib/categories";
import { localDateStr } from "../lib/date";

function formatRp(n) {
  return "Rp " + Number(n || 0).toLocaleString("id-ID");
}

const ACTION_WIDTH = 132;
const emptyForm = (accountId) => ({
  type: "expense",
  amount: "",
  category: CATEGORIES[1],
  account_id: accountId || "",
  note: "",
  date: localDateStr(),
});

function TransactionRow({ t, onEdit, onDelete }) {
  const [dragX, setDragX] = useState(0);
  const [startX, setStartX] = useState(null);
  const [open, setOpen] = useState(false);

  const handleTouchStart = (e) => setStartX(e.touches[0].clientX);
  const handleTouchMove = (e) => {
    if (startX === null) return;
    const diff = e.touches[0].clientX - startX;
    const base = open ? -ACTION_WIDTH : 0;
    let next = base + diff;
    next = Math.max(-ACTION_WIDTH, Math.min(0, next));
    setDragX(next);
  };
  const handleTouchEnd = () => {
    if (dragX < -ACTION_WIDTH / 2) {
      setDragX(-ACTION_WIDTH);
      setOpen(true);
    } else {
      setDragX(0);
      setOpen(false);
    }
    setStartX(null);
  };

  return (
    <div className="relative border-b border-line overflow-hidden md:overflow-visible">
      <div
        className="md:hidden absolute right-0 top-0 bottom-0 flex"
        style={{ width: ACTION_WIDTH }}
      >
        <button
          onClick={() => { onEdit(t); setDragX(0); setOpen(false); }}
          className="flex-1 bg-ledger text-white flex flex-col items-center justify-center gap-1 text-[11px]"
        >
          <Pencil size={16} /> Edit
        </button>
        <button
          onClick={() => onDelete(t)}
          className="flex-1 bg-rust text-white flex flex-col items-center justify-center gap-1 text-[11px]"
        >
          <Trash2 size={16} /> Hapus
        </button>
      </div>

      <div
        className="relative bg-paper flex items-center justify-between py-3"
        style={{
          transform: `translateX(${dragX}px)`,
          transition: startX === null ? "transform 0.2s ease" : "none",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="min-w-0">
          <p className="text-sm text-ink font-medium truncate">
            {t.category}
            {t.note ? ` — ${t.note}` : ""}
          </p>
          <p className="text-xs text-muted">
            {new Date(t.date).toLocaleDateString("id-ID")} · {t.accounts?.name}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <p
            className={`num font-medium ${
              t.type === "income" ? "text-ledgerDark" : "text-rust"
            }`}
          >
            {t.type === "income" ? "+" : "-"}
            {formatRp(t.amount)}
          </p>
          <div className="hidden md:flex items-center gap-1">
            <button
              onClick={() => onEdit(t)}
              aria-label="Edit"
              className="w-7 h-7 flex items-center justify-center rounded text-muted hover:text-ledgerDark hover:bg-ledger/10"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={() => onDelete(t)}
              aria-label="Hapus"
              className="w-7 h-7 flex items-center justify-center rounded text-muted hover:text-rust hover:bg-rust/10"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Transactions() {
  const { session } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [items, setItems] = useState([]);
  const [customCategories, setCustomCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm());
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

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
  const pageSize = isDesktop ? 20 : 15;
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedItems = items.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const shownCount = pagedItems.length;

  useEffect(() => {
    setPage(1);
  }, [items.length, pageSize]);

  const applyBalanceDeltas = async (deltas) => {
    // deltas: { account_id: number }
    for (const [accId, delta] of Object.entries(deltas)) {
      if (!delta) continue;
      const acc = accounts.find((a) => a.id === accId);
      if (!acc) continue;
      await supabase
        .from("accounts")
        .update({ balance: Number(acc.balance) + delta })
        .eq("id", accId);
    }
  };

  const startEdit = (t) => {
    setEditingId(t.id);
    setForm({
      type: t.type,
      amount: String(t.amount),
      category: t.category,
      account_id: t.account_id,
      note: t.note || "",
      date: t.date,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm(accounts[0]?.id));
    setError("");
  };

  const handleDelete = async (t) => {
    if (!window.confirm(`Hapus transaksi "${t.category}" sebesar ${formatRp(t.amount)}?`)) return;
    const reverseDelta = t.type === "income" ? -Number(t.amount) : Number(t.amount);
    await applyBalanceDeltas({ [t.account_id]: reverseDelta });
    await supabase.from("transactions").delete().eq("id", t.id);
    if (editingId === t.id) cancelEdit();
    load();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.account_id || !form.amount) {
      setError("Lengkapi jumlah dan rekening.");
      return;
    }
    const amount = Number(form.amount);

    if (editingId) {
      const original = items.find((t) => t.id === editingId);
      if (!original) return;

      const deltas = {};
      const reverseDelta = original.type === "income" ? -Number(original.amount) : Number(original.amount);
      deltas[original.account_id] = (deltas[original.account_id] || 0) + reverseDelta;
      const newDelta = form.type === "income" ? amount : -amount;
      deltas[form.account_id] = (deltas[form.account_id] || 0) + newDelta;

      await applyBalanceDeltas(deltas);

      const { error: txError } = await supabase
        .from("transactions")
        .update({
          account_id: form.account_id,
          type: form.type,
          amount,
          category: form.category,
          note: form.note,
          date: form.date,
        })
        .eq("id", editingId);

      if (txError) {
        setError(txError.message);
        return;
      }
      cancelEdit();
      load();
      return;
    }

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

    await applyBalanceDeltas({
      [form.account_id]: form.type === "income" ? amount : -amount,
    });

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
        <p className="text-xs text-muted mt-1 md:hidden">
          Geser riwayat ke kiri untuk edit atau hapus.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        <div className="md:col-span-2 order-2 md:order-1">
          <div className="ledger-rule mb-4" />
          {loading ? (
            <p className="text-sm text-muted">Memuat…</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted">Belum ada transaksi.</p>
          ) : (
            <>
              <div>
                {pagedItems.map((t) => (
                  <TransactionRow
                    key={t.id}
                    t={t}
                    onEdit={startEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4 pt-4 border-t border-line">
                <p className="text-xs text-muted">
                  Menampilkan {shownCount} dari {items.length} catatan transaksi
                </p>
                {totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 text-xs border border-line rounded disabled:opacity-40 hover:bg-line"
                    >
                      Sebelumnya
                    </button>
                    <p className="text-xs text-muted font-mono">
                      {currentPage} / {totalPages}
                    </p>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 text-xs border border-line rounded disabled:opacity-40 hover:bg-line"
                    >
                      Selanjutnya
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="order-1 md:order-2">
          <form
            onSubmit={handleSubmit}
            className="bg-surface border border-line rounded-lg p-5 space-y-3"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-ink">
                {editingId ? "Edit transaksi" : "Transaksi baru"}
              </p>
              {editingId && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="text-xs text-muted hover:text-rust"
                >
                  Batal
                </button>
              )}
            </div>

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
              {editingId ? "Update transaksi" : "Simpan transaksi"}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
