import { useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../lib/AuthContext";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

function formatRp(n) {
  return "Rp " + Number(n || 0).toLocaleString("id-ID");
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

export default function Dashboard() {
  const { session } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const year = new Date().getFullYear();
  const month = new Date().getMonth();

  useEffect(() => {
    if (!session) return;
    (async () => {
      const [accRes, txRes] = await Promise.all([
        supabase.from("accounts").select("*"),
        supabase
          .from("transactions")
          .select("*")
          .gte("date", `${year}-01-01`)
          .lte("date", `${year}-12-31`),
      ]);
      if (!accRes.error) setAccounts(accRes.data);
      if (!txRes.error) setTransactions(txRes.data);
      setLoading(false);
    })();
  }, [session]);

  const totalBalance = accounts.reduce((s, a) => s + Number(a.balance), 0);

  const monthTx = transactions.filter(
    (t) => new Date(t.date).getMonth() === month
  );
  const monthIncome = monthTx
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + Number(t.amount), 0);
  const monthExpense = monthTx
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + Number(t.amount), 0);

  const yearIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + Number(t.amount), 0);
  const yearExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + Number(t.amount), 0);

  const chartData = useMemo(() => {
    return MONTHS.map((label, idx) => {
      const items = transactions.filter(
        (t) => new Date(t.date).getMonth() === idx
      );
      return {
        name: label,
        Pemasukan: items
          .filter((t) => t.type === "income")
          .reduce((s, t) => s + Number(t.amount), 0),
        Pengeluaran: items
          .filter((t) => t.type === "expense")
          .reduce((s, t) => s + Number(t.amount), 0),
      };
    });
  }, [transactions]);

  return (
    <Layout>
      <header className="mb-8">
        <p className="text-xs text-muted font-mono mb-1">01 / DASHBOARD</p>
        <h1 className="font-display text-3xl font-semibold text-ink">
          Ringkasan keuangan
        </h1>
      </header>

      {loading ? (
        <p className="text-sm text-muted">Memuat…</p>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-4 mb-10">
            <div className="bg-surface border border-line rounded-lg p-5">
              <p className="text-xs text-muted mb-1">Total saldo</p>
              <p className="num text-xl font-semibold text-ink">
                {formatRp(totalBalance)}
              </p>
            </div>
            <div className="bg-surface border border-line rounded-lg p-5">
              <p className="text-xs text-muted mb-1">Pemasukan bulan ini</p>
              <p className="num text-xl font-semibold text-ledgerDark">
                {formatRp(monthIncome)}
              </p>
            </div>
            <div className="bg-surface border border-line rounded-lg p-5">
              <p className="text-xs text-muted mb-1">Pengeluaran bulan ini</p>
              <p className="num text-xl font-semibold text-rust">
                {formatRp(monthExpense)}
              </p>
            </div>
            <div className="bg-surface border border-line rounded-lg p-5">
              <p className="text-xs text-muted mb-1">Selisih bulan ini</p>
              <p className="num text-xl font-semibold text-ink">
                {formatRp(monthIncome - monthExpense)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-10">
            <div className="bg-surface border border-line rounded-lg p-5">
              <p className="text-xs text-muted mb-1">Pemasukan tahun {year}</p>
              <p className="num text-lg font-semibold text-ledgerDark">
                {formatRp(yearIncome)}
              </p>
            </div>
            <div className="bg-surface border border-line rounded-lg p-5">
              <p className="text-xs text-muted mb-1">Pengeluaran tahun {year}</p>
              <p className="num text-lg font-semibold text-rust">
                {formatRp(yearExpense)}
              </p>
            </div>
            <div className="bg-surface border border-line rounded-lg p-5">
              <p className="text-xs text-muted mb-1">Selisih tahun {year}</p>
              <p className="num text-lg font-semibold text-ink">
                {formatRp(yearIncome - yearExpense)}
              </p>
            </div>
          </div>

          <div className="bg-surface border border-line rounded-lg p-6">
            <p className="text-sm font-medium text-ink mb-4">
              Arus kas per bulan — {year}
            </p>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E4E1D6" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => formatRp(v)} />
                <Bar dataKey="Pemasukan" fill="#1F7A5C" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Pengeluaran" fill="#B3452C" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </Layout>
  );
}
