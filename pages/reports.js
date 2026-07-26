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
  const [specificDate, setSpecificDate] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) return;
    setLoading(true);

    let start, end;
    if (specificDate) {
      start = specificDate;
      end = specificDate;
    } else {
      start = `${year}-${String(month + 1).padStart(2, "0")}-01`;
      const endDate = new Date(year, month + 1, 0).getDate();
      end = `${year}-${String(month + 1).padStart(2, "0")}-${endDate}`;
    }

    supabase
      .from("transactions")
      .select("*, accounts(name)")
      .gte("date", start)
      .lte("date", end)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!error) setItems(data);
        setLoading(false);
      });
  }, [session, month, year, specificDate]);

  const income = items.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const expense = items.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);

  const byCategory = items.reduce((acc, t) => {
    if (t.type !== "expense") return acc;
    acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
    return acc;
  }, {});

  return (
    <Layout>
      <header className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4 no-print">
        <div>
          <p className="text-xs text-muted font-mono mb-1">04 / LAPORAN</p>
          <h1 className="font-display text-2xl md:text-3xl font-semibold text-ink">
            Laporan bulanan
          </h1>
          <p className="text-xs text-muted mt-1">
            Terbaru di atas · pilih tanggal di kanan buat lihat 1 hari saja
          </p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <select
            value={month}
            onChange={(e) => { setMonth(Number(e.target.value)); setSpecificDate(""); }}
            disabled={!!specificDate}
            className="border border-line rounded px-3 py-2 text-sm flex-1 min-w-[8rem] disabled:opacity-50"
          >
            {MONTHS.map((m, idx) => (
              <option key={m} value={idx}>{m}</option>
            ))}
          </select>
          <input
            type="number"
            value={year}
            onChange={(e) => { setYear(Number(e.target.value)); setSpecificDate(""); }}
            disabled={!!specificDate}
            className="w-24 border border-line rounded px-3 py-2 text-sm num disabled:opacity-50"
          />
          <div className="flex items-center gap-1">
            <input
              type="date"
              value={specificDate}
              onChange={(e) => setSpecificDate(e.target.value)}
              className="border border-line rounded px-3 py-2 text-sm"
              title="Lihat transaksi tanggal tertentu saja"
            />
            {specificDate && (
              <button
                onClick={() => setSpecificDate("")}
                className="text-xs text-muted hover:text-rust px-2 py-2"
              >
                Reset
              </button>
            )}
          </div>
          <button
            onClick={() => window.print()}
            className="w-full md:w-auto bg-ledger text-white rounded px-4 py-2 text-sm font-medium hover:bg-ledgerDark transition-colors"
          >
            Print / Export PDF
          </button>
        </div>
      </header>

      <div className="hidden print:block mb-6">
        <h1 className="font-display text-2xl font-semibold text-ink">
          Laporan Keuangan — {specificDate
            ? new Date(specificDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
            : `${MONTHS[month]} ${year}`}
        </h1>
      </div>

      {loading ? (
        <p className="text-sm text-muted">Memuat…</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-8">
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
            <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
            <table className="w-full text-sm border-collapse min-w-[640px]">
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
          </div>
        </>
      )}
    </Layout>
  );
}
