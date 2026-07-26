import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../lib/AuthContext";
import { EXPENSE_CATEGORIES, mergeCategories } from "../lib/categories";

function formatRp(n) {
  return "Rp " + Number(n || 0).toLocaleString("id-ID");
}

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export default function Budgets() {
  const { session } = useAuth();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1); // 1-12
  const [year, setYear] = useState(now.getFullYear());
  const [budgets, setBudgets] = useState({}); // { category: amount }
  const [spent, setSpent] = useState({}); // { category: amount }
  const [inputs, setInputs] = useState({}); // draft values while editing
  const [savingCat, setSavingCat] = useState("");
  const [totalBudgetAmt, setTotalBudgetAmt] = useState(0);
  const [totalBudgetInput, setTotalBudgetInput] = useState("");
  const [savingTotal, setSavingTotal] = useState(false);
  const [customCategories, setCustomCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) return;
    setLoading(true);
    const load = async () => {
      const start = `${year}-${String(month).padStart(2, "0")}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const end = `${year}-${String(month).padStart(2, "0")}-${lastDay}`;

      const [budgetRes, txRes, totalRes, catRes] = await Promise.all([
        supabase
          .from("budgets")
          .select("*")
          .eq("month", month)
          .eq("year", year),
        supabase
          .from("transactions")
          .select("category, amount")
          .eq("type", "expense")
          .gte("date", start)
          .lte("date", end),
        supabase
          .from("total_budgets")
          .select("*")
          .eq("month", month)
          .eq("year", year)
          .maybeSingle(),
        supabase.from("categories").select("*").order("created_at"),
      ]);

      const budgetMap = {};
      (budgetRes.data || []).forEach((b) => {
        budgetMap[b.category] = Number(b.amount);
      });
      setBudgets(budgetMap);
      setInputs(budgetMap);

      const spentMap = {};
      (txRes.data || []).forEach((t) => {
        spentMap[t.category] = (spentMap[t.category] || 0) + Number(t.amount);
      });
      setSpent(spentMap);

      if (!catRes.error) setCustomCategories(catRes.data);

      const totalAmt = totalRes.data ? Number(totalRes.data.amount) : 0;
      setTotalBudgetAmt(totalAmt);
      setTotalBudgetInput(totalAmt || "");

      setLoading(false);
    };
    load();
  }, [session, month, year]);

  const saveTotalBudget = async () => {
    const amount = Number(totalBudgetInput) || 0;
    setSavingTotal(true);
    const { error } = await supabase.from("total_budgets").upsert(
      { user_id: session.user.id, month, year, amount },
      { onConflict: "user_id,month,year" }
    );
    setSavingTotal(false);
    if (!error) setTotalBudgetAmt(amount);
  };

  const saveBudget = async (category) => {
    const amount = Number(inputs[category]) || 0;
    setSavingCat(category);
    const { error } = await supabase.from("budgets").upsert(
      {
        user_id: session.user.id,
        category,
        month,
        year,
        amount,
      },
      { onConflict: "user_id,category,month,year" }
    );
    setSavingCat("");
    if (!error) {
      setBudgets((b) => ({ ...b, [category]: amount }));
    }
  };

  const allExpenseCategories = mergeCategories(EXPENSE_CATEGORIES, customCategories);
  const totalBudget = Object.values(budgets).reduce((s, v) => s + v, 0);
  const totalSpent = Object.values(spent).reduce((s, v) => s + v, 0);

  return (
    <Layout>
      <header className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs text-muted font-mono mb-1">ANGGARAN</p>
          <h1 className="font-display text-2xl md:text-3xl font-semibold text-ink">
            Anggaran bulanan
          </h1>
        </div>
        <div className="flex gap-2">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="border border-line rounded px-3 py-2 text-sm flex-1"
          >
            {MONTHS.map((m, idx) => (
              <option key={m} value={idx + 1}>{m}</option>
            ))}
          </select>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="w-24 border border-line rounded px-3 py-2 text-sm num"
          />
        </div>
      </header>

      {loading ? (
        <p className="text-sm text-muted">Memuat…</p>
      ) : (
        <>
          <div className="bg-surface border border-line rounded-lg p-5 mb-6">
            <div className="mb-4">
              <p className="text-xs text-muted mb-1">Total anggaran bulanan</p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={totalBudgetInput}
                  onChange={(e) => setTotalBudgetInput(e.target.value)}
                  placeholder="mis. 1500000"
                  className="w-44 border border-line rounded px-3 py-2 text-sm num focus:outline-none focus:ring-2 focus:ring-ledger"
                />
                <button
                  onClick={saveTotalBudget}
                  disabled={savingTotal}
                  className="text-sm bg-ledger text-white rounded px-4 py-2 font-medium hover:bg-ledgerDark transition-colors disabled:opacity-60"
                >
                  {savingTotal ? "…" : "Simpan"}
                </button>
              </div>
              <p className="text-xs text-muted mt-1">
                Set dulu total anggaran di sini, lalu alokasikan ke tiap kategori di bawah.
              </p>
            </div>

            {totalBudgetAmt > 0 && (
              <>
                <div className="w-full h-2 rounded-full bg-line overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      totalBudget > totalBudgetAmt
                        ? "bg-rust"
                        : totalBudget / totalBudgetAmt > 0.9
                        ? "bg-gold"
                        : "bg-ledger"
                    }`}
                    style={{ width: `${Math.min(100, (totalBudget / totalBudgetAmt) * 100)}%` }}
                  />
                </div>
                <div className="flex flex-wrap justify-between gap-2 mt-2">
                  <p className="text-xs text-muted">
                    Total: <span className="num text-ink">{formatRp(totalBudgetAmt)}</span>
                  </p>
                  <p className="text-xs text-muted">
                    Teralokasi ke kategori: <span className="num text-ink">{formatRp(totalBudget)}</span>
                  </p>
                  {totalBudget > totalBudgetAmt ? (
                    <p className="text-xs text-rust font-medium">
                      Kelebihan alokasi {formatRp(totalBudget - totalBudgetAmt)}
                    </p>
                  ) : (
                    <p className="text-xs text-ledgerDark font-medium">
                      Belum dialokasikan: {formatRp(totalBudgetAmt - totalBudget)}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="space-y-3">
            {allExpenseCategories.map((cat) => {
              const budgetAmt = budgets[cat] || 0;
              const spentAmt = spent[cat] || 0;
              const pct = budgetAmt > 0 ? Math.min(100, (spentAmt / budgetAmt) * 100) : 0;
              const over = budgetAmt > 0 && spentAmt > budgetAmt;
              const barColor = over ? "bg-rust" : pct > 75 ? "bg-gold" : "bg-ledger";

              return (
                <div
                  key={cat}
                  className="bg-surface border border-line rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-2 gap-3">
                    <p className="text-sm font-medium text-ink">{cat}</p>
                    <div className="flex items-center gap-2 shrink-0">
                      <input
                        type="number"
                        value={inputs[cat] ?? ""}
                        onChange={(e) =>
                          setInputs((f) => ({ ...f, [cat]: e.target.value }))
                        }
                        placeholder="0"
                        className="w-28 border border-line rounded px-2 py-1.5 text-sm num text-right focus:outline-none focus:ring-2 focus:ring-ledger"
                      />
                      <button
                        onClick={() => saveBudget(cat)}
                        disabled={savingCat === cat}
                        className="text-xs bg-ledger text-white rounded px-3 py-1.5 font-medium hover:bg-ledgerDark transition-colors disabled:opacity-60"
                      >
                        {savingCat === cat ? "…" : "Simpan"}
                      </button>
                    </div>
                  </div>

                  {budgetAmt > 0 ? (
                    <>
                      <div className="w-full h-2 rounded-full bg-line overflow-hidden">
                        <div
                          className={`h-full ${barColor} transition-all`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-1.5">
                        <p className={`text-xs num ${over ? "text-rust" : "text-muted"}`}>
                          {formatRp(spentAmt)} / {formatRp(budgetAmt)}
                        </p>
                        {over && (
                          <p className="text-xs text-rust font-medium">
                            Lewat {formatRp(spentAmt - budgetAmt)}
                          </p>
                        )}
                      </div>
                    </>
                  ) : (
                    <p className="text-xs text-muted">
                      Belum diatur — sudah terpakai {formatRp(spentAmt)}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </Layout>
  );
}
