export function toRupiah(value: string | number): string {
  const num = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(num)) return "Rp 0";
  return "Rp " + Math.trunc(num).toLocaleString("id-ID");
}

export function formatTanggal(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/** Persentase progress menuju target (0-100, dibulatkan). */
export function progressPct(saldo: string | number, target: string | number): number {
  const s = typeof saldo === "string" ? Number(saldo) : saldo;
  const t = typeof target === "string" ? Number(target) : target;
  if (!Number.isFinite(s) || !Number.isFinite(t) || t <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((s / t) * 100)));
}
