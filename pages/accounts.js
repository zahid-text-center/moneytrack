import { useEffect, useState } from "react";
import { Pencil, Trash2, ArrowRightLeft, Check, X } from "lucide-react";
import Layout from "../components/Layout";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../lib/AuthContext";

function formatRp(n) {
  return "Rp " + Number(n || 0).toLocaleString("id-ID");
}

export default function Accounts() {
  const { session } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [name, setName] = useState("");
  const [balance, setBalance] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editBalance, setEditBalance] = useState("");

  const [transferForm, setTransferForm] = useState({ from: "", to: "", amount: "", note: "" });
  const [transferError, setTransferError] = useState("");
  const [transferSaving, setTransferSaving] = useState(false);

  const load = async () => {
    const [accRes, trRes] = await Promise.all([
      supabase.from("accounts").select("*").order("created_at", { ascending: true }),
      supabase
        .from("transfers")
        .select("*, from:accounts!transfers_from_account_id_fkey(name), to:accounts!transfers_to_account_id_fkey(name)")
        .order("created_at", { ascending: false })
        .limit(20),
    ]);
    if (!accRes.error) setAccounts(accRes.data);
    if (!trRes.error) setTransfers(trRes.data);
    setLoading(false);
  };

  useEffect(() => {
    if (session) load();
  }, [session]);

  useEffect(() => {
    if (accounts.length >= 2 && !transferForm.from) {
      setTransferForm((f) => ({ ...f, from: accounts[0].id, to: accounts[1].id }));
    }
  }, [accounts]);

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

  const startEdit = (a) => {
    setEditingId(a.id);
    setEditName(a.name);
    setEditBalance(String(a.balance));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditBalance("");
  };

  const saveEdit = async (id) => {
    await supabase
      .from("accounts")
      .update({ name: editName.trim(), balance: Number(editBalance) || 0 })
      .eq("id", id);
    cancelEdit();
    load();
  };

  const deleteAccount = async (a) => {
    if (
      !window.confirm(
        `Hapus rekening "${a.name}"? Semua transaksi yang tercatat di rekening ini juga akan ikut terhapus.`
      )
    )
      return;
    await supabase.from("accounts").delete().eq("id", a.id);
    load();
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    setTransferError("");
    const amount = Number(transferForm.amount);
    if (!transferForm.from || !transferForm.to) {
      setTransferError("Pilih rekening asal dan tujuan.");
      return;
    }
    if (transferForm.from === transferForm.to) {
      setTransferError("Rekening asal dan tujuan tidak boleh sama.");
      return;
    }
    if (!amount || amount <= 0) {
      setTransferError("Isi jumlah transfer.");
      return;
    }
    const fromAcc = accounts.find((a) => a.id === transferForm.from);
    if (Number(fromAcc.balance) < amount) {
      setTransferError("Saldo rekening asal tidak cukup.");
      return;
    }

    setTransferSaving(true);
    const toAcc = accounts.find((a) => a.id === transferForm.to);

    await supabase.from("accounts").update({ balance: Number(fromAcc.balance) - amount }).eq("id", fromAcc.id);
    await supabase.from("accounts").update({ balance: Number(toAcc.balance) + amount }).eq("id", toAcc.id);
    await supabase.from("transfers").insert({
      user_id: session.user.id,
      from_account_id: fromAcc.id,
      to_account_id: toAcc.id,
      amount,
      note: transferForm.note,
    });

    setTransferSaving(false);
    setTransferForm((f) => ({ ...f, amount: "", note: "" }));
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
        <div className="md:col-span-2 order-2 md:order-1 space-y-8">
          <div>
            <div className="ledger-rule mb-4" />
            {loading ? (
              <p className="text-sm text-muted">Memuat…</p>
            ) : accounts.length === 0 ? (
              <p className="text-sm text-muted">
                Belum ada rekening. Tambahkan di sebelah kanan.
              </p>
            ) : (
              <div className="space-y-3">
                {accounts.map((a) =>
                  editingId === a.id ? (
                    <div
                      key={a.id}
                      className="bg-surface border border-ledger rounded-lg px-4 py-3 space-y-2"
                    >
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full border border-line rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ledger"
                      />
                      <input
                        type="number"
                        value={editBalance}
                        onChange={(e) => setEditBalance(e.target.value)}
                        className="w-full border border-line rounded px-3 py-1.5 text-sm num focus:outline-none focus:ring-2 focus:ring-ledger"
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={cancelEdit}
                          className="w-8 h-8 flex items-center justify-center rounded text-muted hover:bg-line"
                        >
                          <X size={15} />
                        </button>
                        <button
                          onClick={() => saveEdit(a.id)}
                          className="w-8 h-8 flex items-center justify-center rounded bg-ledger text-white hover:bg-ledgerDark"
                        >
                          <Check size={15} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      key={a.id}
                      className="flex items-center justify-between bg-surface border border-line rounded-lg px-5 py-4"
                    >
                      <p className="font-medium text-ink">{a.name}</p>
                      <div className="flex items-center gap-3">
                        <p className="num text-ink font-medium">{formatRp(a.balance)}</p>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => startEdit(a)}
                            aria-label="Edit"
                            className="w-7 h-7 flex items-center justify-center rounded text-muted hover:text-ledgerDark hover:bg-ledger/10"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => deleteAccount(a)}
                            aria-label="Hapus"
                            className="w-7 h-7 flex items-center justify-center rounded text-muted hover:text-rust hover:bg-rust/10"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                )}
                <div className="flex items-center justify-between px-5 pt-2">
                  <p className="text-sm text-muted">Total saldo</p>
                  <p className="num text-ledgerDark font-semibold">
                    {formatRp(total)}
                  </p>
                </div>
              </div>
            )}
          </div>

          {transfers.length > 0 && (
            <div>
              <p className="text-sm font-medium text-ink mb-3">Riwayat transfer</p>
              <div className="space-y-1">
                {transfers.map((t) => (
                  <div key={t.id} className="flex items-center justify-between py-2.5 border-b border-line text-sm">
                    <div className="flex items-center gap-2 text-ink min-w-0">
                      <span className="truncate">{t.from?.name}</span>
                      <ArrowRightLeft size={13} className="text-muted shrink-0" />
                      <span className="truncate">{t.to?.name}</span>
                    </div>
                    <p className="num text-ink shrink-0 ml-2">{formatRp(t.amount)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="order-1 md:order-2 space-y-6">
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

          {accounts.length >= 2 && (
            <form
              onSubmit={handleTransfer}
              className="bg-surface border border-line rounded-lg p-5 space-y-3"
            >
              <p className="text-sm font-medium text-ink flex items-center gap-2">
                <ArrowRightLeft size={15} /> Transfer antar rekening
              </p>
              <div>
                <label className="text-xs text-muted">Dari</label>
                <select
                  value={transferForm.from}
                  onChange={(e) => setTransferForm((f) => ({ ...f, from: e.target.value }))}
                  className="mt-1 w-full border border-line rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ledger"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>{a.name} — {formatRp(a.balance)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted">Ke</label>
                <select
                  value={transferForm.to}
                  onChange={(e) => setTransferForm((f) => ({ ...f, to: e.target.value }))}
                  className="mt-1 w-full border border-line rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ledger"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted">Jumlah</label>
                <input
                  type="number"
                  value={transferForm.amount}
                  onChange={(e) => setTransferForm((f) => ({ ...f, amount: e.target.value }))}
                  placeholder="0"
                  className="mt-1 w-full border border-line rounded px-3 py-2 text-sm num focus:outline-none focus:ring-2 focus:ring-ledger"
                />
              </div>
              <div>
                <label className="text-xs text-muted">Catatan (opsional)</label>
                <input
                  value={transferForm.note}
                  onChange={(e) => setTransferForm((f) => ({ ...f, note: e.target.value }))}
                  className="mt-1 w-full border border-line rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ledger"
                />
              </div>
              {transferError && <p className="text-xs text-rust">{transferError}</p>}
              <button
                type="submit"
                disabled={transferSaving}
                className="w-full bg-ink text-white rounded py-2 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                {transferSaving ? "Memproses…" : "Transfer"}
              </button>
            </form>
          )}
        </div>
      </div>
    </Layout>
  );
}
