import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Layout from "../components/Layout";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../lib/AuthContext";
import { EXPENSE_CATEGORIES, CATEGORY_COLORS, mergeCategories, colorForCategory } from "../lib/categories";
import { localDateStr } from "../lib/date";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend,
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
  const [budgets, setBudgets] = useState({});
  const [totalBudgetAmt, setTotalBudgetAmt] = useState(0);
  const [customCategories, setCustomCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const year = new Date().getFullYear();
  const month = new Date().getMonth();
  const today = localDateStr();

  useEffect(() => {
    if (!session) return;
    (async () => {
      const [accRes, txRes, budgetRes, totalRes, catRes] = await Promise.all([
        supabase.from("accounts").select("*"),
        supabase
          .from("transactions")
          .select("*")
          .gte("date", `${year}-01-01`)
          .lte("date", `${year}-12-31`),
        supabase
          .from("budgets")
          .select("*")
          .eq("month", month + 1)
          .eq("year", year),
        supabase
          .from("total_budgets")
          .select("*")
          .eq("month", month + 1)
          .eq("year", year)
          .maybeSingle(),
        supabase.from("categories").select("*").order("created_at"),
      ]);
      if (!accRes.error) setAccounts(accRes.data);
      if (!txRes.error) setTransactions(txRes.data);
      if (!budgetRes.error) {
        const map = {};
        budgetRes.data.forEach((b) => (map[b.category] = Number(b.amount)));
        setBudgets(map);
      }
      if (totalRes.data) setTotalBudgetAmt(Number(totalRes.data.amount));
      if (!catRes.error) setCustomCategories(catRes.data);
      setLoading(false);
    })();
  }, [session]);

  const totalBalance = accounts.reduce((s, a) => s + Number(a.balance), 0);

  const todayTx = transactions.filter((t) => t.date === today);
  const todayIncome = todayTx.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const todayExpense = todayTx.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);

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

  const pieData = useMemo(() => {
    const byCat = {};
    monthTx
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        byCat[t.category] = (byCat[t.category] || 0) + Number(t.amount);
      });
    return Object.entries(byCat)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [monthTx]);

  const top5 = pieData.slice(0, 5);
  const top5Max = top5.length ? top5[0].value : 0;

  const budgetOverview = mergeCategories(EXPENSE_CATEGORIES, customCategories).map((cat) => {
    const budgetAmt = budgets[cat] || 0;
    const spentAmt = monthTx
      .filter((t) => t.type === "expense" && t.category === cat)
      .reduce((s, t) => s + Number(t.amount), 0);
    return { cat, budgetAmt, spentAmt };
  }).filter((b) => b.budgetAmt > 0);

  return (
    <Layout>
      <header className="mb-8">
        <p className="text-xs text-muted font-mono mb-1">01 / DASHBOARD</p>
        <h1 className="font-display text-2xl md:text-3xl font-semibold text-ink">
          Ringkasan keuangan
        </h1>
      </header>

      {loading ? (
        <p className="text-sm text-muted">Memuat…</p>
      ) : (
        <>
          {/* Rekap hari ini */}
          <div className="bg-surface border border-line rounded-lg p-5 mb-6 flex flex-wrap gap-6 items-center justify-between">
            <div>
              <p className="text-xs text-muted mb-1">Hari ini</p>
              <p className="text-sm text-ink">
                {new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" })}
              </p>
            </div>
            <div className="flex gap-6">
              <div>
                <p className="text-xs text-muted mb-1">Pemasukan</p>
                <p className="num font-semibold text-ledgerDark">{formatRp(todayIncome)}</p>
              </div>
              <div>
                <p className="text-xs text-muted mb-1">Pengeluaran</p>
                <p className="num font-semibold text-rust">{formatRp(todayExpense)}</p>
              </div>
              <div>
                <p className="text-xs text-muted mb-1">Selisih</p>
                <p className="num font-semibold text-ink">{formatRp(todayIncome - todayExpense)}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8 md:mb-10">
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-8 md:mb-10">
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

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-8">
            <div className="lg:col-span-3 bg-surface border border-line rounded-lg p-6">
              <p className="text-sm font-medium text-ink mb-4">
                Arus kas per bulan — {year}
              </p>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--color-line))" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v) => formatRp(v)} />
                  <Bar dataKey="Pemasukan" fill="rgb(var(--color-ledger))" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Pengeluaran" fill="rgb(var(--color-rust))" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="lg:col-span-2 bg-surface border border-line rounded-lg p-6">
              <p className="text-sm font-medium text-ink mb-4">
                Pengeluaran per kategori — bulan ini
              </p>
              {pieData.length === 0 ? (
                <p className="text-sm text-muted">Belum ada pengeluaran bulan ini.</p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={45}
                      outerRadius={85}
                      paddingAngle={2}
                    >
                      {pieData.map((entry, idx) => (
                        <Cell
                          key={entry.name}
                          fill={colorForCategory(entry.name, idx)}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => formatRp(v)} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="bg-surface border border-line rounded-lg p-6 mb-8">
            <p className="text-sm font-medium text-ink mb-4">
              Top 5 kategori pengeluaran — bulan ini
            </p>
            {top5.length === 0 ? (
              <p className="text-sm text-muted">Belum ada pengeluaran bulan ini.</p>
            ) : (
              <div className="space-y-3">
                {top5.map((item, idx) => (
                  <div key={item.name} className="flex items-center gap-3">
                    <span className="w-6 h-6 shrink-0 rounded-full bg-paper border border-line flex items-center justify-center text-xs font-mono text-muted">
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-ink font-medium truncate">{item.name}</span>
                        <span className="num text-ink shrink-0 ml-2">{formatRp(item.value)}</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-line overflow-hidden">
                        <div
                          className="h-full"
                          style={{
                            width: `${top5Max ? (item.value / top5Max) * 100 : 0}%`,
                            backgroundColor: colorForCategory(item.name, idx),
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {totalBudgetAmt > 0 && (
            <div className="bg-surface border border-line rounded-lg p-6 mb-8">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-ink">Total anggaran bulan ini</p>
                <Link href="/budgets" className="text-xs text-ledger font-medium">
                  Atur anggaran →
                </Link>
              </div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className={`num font-semibold ${monthExpense > totalBudgetAmt ? "text-rust" : "text-ledgerDark"}`}>
                  {formatRp(monthExpense)}
                </span>
                <span className="num text-muted">dari {formatRp(totalBudgetAmt)}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-line overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    monthExpense > totalBudgetAmt
                      ? "bg-rust"
                      : monthExpense / totalBudgetAmt > 0.75
                      ? "bg-gold"
                      : "bg-ledger"
                  }`}
                  style={{ width: `${Math.min(100, (monthExpense / totalBudgetAmt) * 100)}%` }}
                />
              </div>
              {monthExpense > totalBudgetAmt && (
                <p className="text-xs text-rust font-medium mt-1.5">
                  Sudah lewat {formatRp(monthExpense - totalBudgetAmt)} dari batas anggaran
                </p>
              )}
            </div>
          )}

          {budgetOverview.length > 0 && (
            <div className="bg-surface border border-line rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium text-ink">Anggaran bulan ini</p>
                <Link href="/budgets" className="text-xs text-ledger font-medium">
                  Kelola anggaran →
                </Link>
              </div>
              <div className="space-y-3">
                {budgetOverview.map(({ cat, budgetAmt, spentAmt }) => {
                  const pct = Math.min(100, (spentAmt / budgetAmt) * 100);
                  const over = spentAmt > budgetAmt;
                  const barColor = over ? "bg-rust" : pct > 75 ? "bg-gold" : "bg-ledger";
                  return (
                    <div key={cat}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-ink">{cat}</span>
                        <span className={`num ${over ? "text-rust" : "text-muted"}`}>
                          {formatRp(spentAmt)} / {formatRp(budgetAmt)}
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-line overflow-hidden">
                        <div className={`h-full ${barColor}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </Layout>
  );
}
