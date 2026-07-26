export const CATEGORIES = [
  "Gaji", "Makanan", "Transportasi", "Belanja", "Tagihan",
  "Hiburan", "Kesehatan", "Pendidikan", "Lainnya",
];

// Kategori yang bisa diberi anggaran bulanan (tidak termasuk "Gaji", karena itu pemasukan)
export const EXPENSE_CATEGORIES = CATEGORIES.filter((c) => c !== "Gaji");

export const CATEGORY_COLORS = {
  Makanan: "#1F7A5C",
  Transportasi: "#2E6E9E",
  Belanja: "#C08A2E",
  Tagihan: "#B3452C",
  Hiburan: "#8B5CF6",
  Kesehatan: "#DB2777",
  Pendidikan: "#0891B2",
  Lainnya: "#6B7A70",
};

// Gabungkan kategori bawaan dengan kategori kustom milik user (tanpa duplikat)
export function mergeCategories(defaults, custom) {
  const customNames = custom.map((c) => (typeof c === "string" ? c : c.name));
  return [...defaults, ...customNames.filter((n) => !defaults.includes(n))];
}

// Warna fallback untuk kategori kustom (dipilih berputar dari daftar ini)
const FALLBACK_PALETTE = ["#8B5CF6", "#DB2777", "#0891B2", "#65A30D", "#EA580C", "#4F46E5"];

export function colorForCategory(name, customIndex = 0) {
  if (CATEGORY_COLORS[name]) return CATEGORY_COLORS[name];
  return FALLBACK_PALETTE[customIndex % FALLBACK_PALETTE.length];
}
