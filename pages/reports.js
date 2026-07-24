import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../lib/AuthContext";

function formatRp(n) {
  return "Rp " + Number(n || 0).toLocaleString("id-ID");
}

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export default function Reports() {
  const { session } = useAuth();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) return;
    setLoading(true);
    const start = `${year}-${String(month + 1).padStart(2, "0")}-01`;
    const endDate = new Date(year, month + 1, 0).getDate();
    const end = `${year}-${String(month + 1).padStart(2, "0")}-${endDate}`;
    supabase
      .from("transactions")
      .select("*, accounts(name)")
      .gte("date", start)
      .lte("date", end)
      .order("date", { ascending: true })
      .then(({ data, error }) => {
        if (!error) setItems(data);
        setLoading(false);
      });
  }, [session, month, year]);

  const income = items.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const expense = items.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);

  const byCategory = items.reduce((acc, t) => {
    if (t.type !== "expense") return acc;
    acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
    return acc;
  }, {});

  return (
    <Layout>
      <header className="mb-6 flex items-end justify-between no-print">
        <div>
          <p className="text-xs text-muted font-mono mb-1">04 / LAPORAN</p>
          <h1 className="font-display text-3xl font-semibold text-ink">
            Laporan bulanan
          </h1>
        </div>
        <div className="flex gap-2 items-center">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="border border-line rounded px-3 py-2 text-sm"
          >
            {MONTHS.map((m, idx) => (
              <option key={m} value={idx}>{m}</option>
            ))}
          </select>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="w-24 border border-line rounded px-3 py-2 text-sm num"
          />
          <button
            onClick={() => window.print()}
            className="bg-ledger text-white rounded px-4 py-2 text-sm font-medium hover:bg-ledgerDark transition-colors"
          >
            Print / Export PDF
          </button>
        </div>
      </header>

      <div className="hidden print:block mb-6">
        <h1 className="font-display text-2xl font-semibold text-ink">
          Laporan Keuangan — {MONTHS[month]} {year}
        </h1>
      </div>

      {loading ? (
        <p className="text-sm text-muted">Memuat…</p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-surface border border-line rounded-lg p-5">
              <p className="text-xs text-muted mb-1">Total pemasukan</p>
              <p className="num text-lg font-semibold text-ledgerDark">{formatRp(income)}</p>
            </div>
            <div className="bg-surface border border-line rounded-lg p-5">
              <p className="text-xs text-muted mb-1">Total pengeluaran</p>
              <p className="num text-lg font-semibold text-rust">{formatRp(expense)}</p>
            </div>
            <div className="bg-surface border border-line rounded-lg p-5">
              <p className="text-xs text-muted mb-1">Selisih</p>
              <p className="num text-lg font-semibold text-ink">{formatRp(income - expense)}</p>
            </div>
          </div>

          <div className="mb-8">
            <p className="text-sm font-medium text-ink mb-3">Pengeluaran per kategori</p>
            <div className="bg-surface border border-line rounded-lg divide-y divide-line">
              {Object.entries(byCategory).length === 0 ? (
                <p className="text-sm text-muted p-4">Tidak ada pengeluaran bulan ini.</p>
              ) : (
                Object.entries(byCategory)
                  .sort((a, b) => b[1] - a[1])
                  .map(([cat, amt]) => (
                    <div key={cat} className="flex justify-between px-4 py-3">
                      <p className="text-sm text-ink">{cat}</p>
                      <p className="num text-sm text-rust">{formatRp(amt)}</p>
                    </div>
                  ))
              )}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-ink mb-3">Rincian transaksi</p>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-left text-xs text-muted border-b border-line">
                  <th className="py-2">Tanggal</th>
                  <th className="py-2">Kategori</th>
                  <th className="py-2">Rekening</th>
                  <th className="py-2">Catatan</th>
                  <th className="py-2 text-right">Jumlah</th>
                </tr>
              </thead>
              <tbody>
                {items.map((t) => (
                  <tr key={t.id} className="border-b border-line">
                    <td className="py-2">{new Date(t.date).toLocaleDateString("id-ID")}</td>
                    <td className="py-2">{t.category}</td>
                    <td className="py-2">{t.accounts?.name}</td>
                    <td className="py-2 text-muted">{t.note}</td>
                    <td
                      className={`py-2 text-right num ${
                        t.type === "income" ? "text-ledgerDark" : "text-rust"
                      }`}
                    >
                      {t.type === "income" ? "+" : "-"}
                      {formatRp(t.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Layout>
  );
}
