// Format tanggal lokal (bukan UTC) untuk menghindari pergeseran tanggal
// yang bisa terjadi kalau pakai toISOString() dekat tengah malam.
export function localDateStr(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
