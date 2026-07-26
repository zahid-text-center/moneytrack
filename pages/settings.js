import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { useTheme, THEMES } from "../lib/ThemeContext";
import { useAuth } from "../lib/AuthContext";
import { supabase } from "../lib/supabaseClient";
import { X } from "lucide-react";

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { session } = useAuth();
  const [categories, setCategories] = useState([]);
  const [newCat, setNewCat] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("created_at", { ascending: true });
    if (!error) setCategories(data);
    setLoading(false);
  };

  useEffect(() => {
    if (session) load();
  }, [session]);

  const addCategory = async (e) => {
    e.preventDefault();
    setError("");
    const name = newCat.trim();
    if (!name) return;
    const { error } = await supabase.from("categories").insert({
      user_id: session.user.id,
      name,
    });
    if (error) {
      setError(
        error.code === "23505"
          ? "Kategori itu sudah ada."
          : "Gagal menambah kategori."
      );
      return;
    }
    setNewCat("");
    load();
  };

  const deleteCategory = async (id) => {
    await supabase.from("categories").delete().eq("id", id);
    load();
  };

  return (
    <Layout>
      <header className="mb-8">
        <p className="text-xs text-muted font-mono mb-1">PENGATURAN</p>
        <h1 className="font-display text-2xl md:text-3xl font-semibold text-ink">
          Tema warna
        </h1>
        <p className="text-sm text-muted mt-1">
          Pilih tampilan yang paling nyaman buat kamu.
        </p>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-3xl mb-12">
        {THEMES.map((t) => (
          <button
            key={t.id}
            onClick={() => setTheme(t.id)}
            className={`text-left rounded-lg border-2 p-4 transition-colors ${
              theme === t.id ? "border-ledger" : "border-line hover:border-muted"
            }`}
            style={{ backgroundColor: t.swatch[0] }}
          >
            <div className="flex gap-1.5 mb-6">
              <span
                className="w-5 h-5 rounded-full border border-black/10"
                style={{ backgroundColor: t.swatch[0] }}
              />
              <span
                className="w-5 h-5 rounded-full border border-black/10"
                style={{ backgroundColor: t.swatch[1] }}
              />
            </div>
            <p
              className="text-sm font-medium"
              style={{ color: t.swatch[1] }}
            >
              {t.label}
            </p>
            {theme === t.id && (
              <p className="text-xs mt-1" style={{ color: t.swatch[1] }}>
                Aktif
              </p>
            )}
          </button>
        ))}
      </div>

      <header className="mb-4">
        <h2 className="font-display text-xl font-semibold text-ink">
          Kategori kustom
        </h2>
        <p className="text-sm text-muted mt-1">
          Tambah kategori sendiri, akan otomatis muncul di Transaksi & Anggaran.
        </p>
      </header>

      <div className="max-w-md">
        <form onSubmit={addCategory} className="flex gap-2 mb-4">
          <input
            value={newCat}
            onChange={(e) => setNewCat(e.target.value)}
            placeholder="mis. Langganan Streaming"
            className="flex-1 border border-line rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ledger"
          />
          <button
            type="submit"
            className="bg-ledger text-white rounded px-4 py-2 text-sm font-medium hover:bg-ledgerDark transition-colors"
          >
            Tambah
          </button>
        </form>
        {error && <p className="text-xs text-rust mb-3">{error}</p>}

        {loading ? (
          <p className="text-sm text-muted">Memuat…</p>
        ) : categories.length === 0 ? (
          <p className="text-sm text-muted">Belum ada kategori kustom.</p>
        ) : (
          <div className="space-y-2">
            {categories.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between bg-surface border border-line rounded-lg px-4 py-2.5"
              >
                <p className="text-sm text-ink">{c.name}</p>
                <button
                  onClick={() => deleteCategory(c.id)}
                  aria-label="Hapus kategori"
                  className="text-muted hover:text-rust"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
