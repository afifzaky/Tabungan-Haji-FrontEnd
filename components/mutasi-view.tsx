"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ApiError, errorMessage, getMutasi, listMyTabungan } from "@/lib/api";
import type { ListResponse, TabunganHaji, Transaksi } from "@/lib/types";
import { toRupiah, formatTanggal } from "@/lib/format";

const LIMIT = 10;

type Jenis = "SEMUA" | "SETOR" | "TARIK";

/** Keterangan transaksi yang ramah dibaca, diturunkan dari jenis + metode. */
function keterangan(t: Transaksi): string {
  const aksi = t.jenis === "SETOR" ? "Setoran" : "Penarikan";
  return t.metode ? `${aksi} • ${t.metode}` : aksi;
}

export function MutasiView() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabungan, setTabungan] = useState<TabunganHaji | null>(null);
  const [mutasi, setMutasi] = useState<ListResponse<Transaksi> | null>(null);
  const [offset, setOffset] = useState(0);

  // Filter sisi klien atas baris halaman aktif (API mutasi belum punya filter).
  const [query, setQuery] = useState("");
  const [jenis, setJenis] = useState<Jenis>("SEMUA");

  const loadMutasi = useCallback(async (id: string, nextOffset: number) => {
    try {
      const data = await getMutasi(id, LIMIT, nextOffset);
      setMutasi(data);
      setOffset(nextOffset);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return;
      setError(errorMessage(err));
    }
  }, []);

  const load = useCallback(async () => {
    try {
      const tabRes = await listMyTabungan();
      const akun =
        tabRes.data.find((t) => t.status === "AKTIF") ??
        tabRes.data[0] ??
        null;
      setTabungan(akun);

      if (akun) {
        const data = await getMutasi(akun.id, LIMIT, 0);
        setMutasi(data);
        setOffset(0);
      }
      setError(null);
    } catch (err) {
      // 401 → api client sudah auto-logout & redirect ke /login.
      if (err instanceof ApiError && err.status === 401) return;
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Muat rekening + mutasi saat mount (auth berbasis token = fetch sisi klien).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const rows = useMemo(() => {
    const all = mutasi?.data ?? [];
    const q = query.trim().toLowerCase();
    return all.filter((t) => {
      if (jenis !== "SEMUA" && t.jenis !== jenis) return false;
      if (!q) return true;
      return (
        keterangan(t).toLowerCase().includes(q) ||
        t.referensi.toLowerCase().includes(q)
      );
    });
  }, [mutasi, query, jenis]);

  const filterAktif = query.trim() !== "" || jenis !== "SEMUA";

  if (loading) {
    return (
      <div className="flex flex-grow items-center justify-center py-20 text-on-surface-variant">
        <span className="material-symbols-outlined animate-spin">
          progress_activity
        </span>
      </div>
    );
  }

  if (!tabungan) {
    return (
      <main className="mx-auto w-full max-w-[1280px] flex-grow px-5 py-16 md:px-16">
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-outline-variant bg-surface-container-lowest px-6 py-16 text-center">
          <h2 className="text-headline-md text-on-surface">
            Belum ada rekening Tabungan Haji
          </h2>
          <p className="mt-2 text-body-md text-on-surface-variant">
            Buka rekening terlebih dahulu untuk melihat riwayat mutasi.
          </p>
          <Link
            href="/dashboard"
            className="mt-6 rounded-lg bg-primary-container px-6 py-3 text-label-md font-semibold text-on-primary transition-colors hover:bg-primary"
          >
            Ke Dashboard
          </Link>
        </div>
      </main>
    );
  }

  const total = mutasi?.total ?? 0;
  const pageCount = mutasi?.data.length ?? 0;
  const from = total === 0 ? 0 : offset + 1;
  const to = Math.min(offset + pageCount, total);

  return (
    <main className="mx-auto flex w-full max-w-[1280px] flex-grow flex-col gap-8 px-5 py-12 md:px-16">
      {/* Ringkasan rekening */}
      <section className="flex flex-col items-start justify-between gap-6 rounded-2xl bg-surface-container-lowest p-8 shadow-[0_4px_20px_rgba(0,0,0,0.04)] md:flex-row md:items-end">
        <div className="flex flex-col gap-2">
          <h1 className="text-headline-lg text-on-surface">Riwayat Mutasi</h1>
          <p className="text-body-md text-on-surface-variant">Tabungan Haji BSI</p>
          <div className="mt-4 flex items-center gap-2 text-on-surface-variant">
            <span className="material-symbols-outlined text-primary-container">
              account_balance_wallet
            </span>
            <span className="font-mono text-label-md tracking-wider">
              No. Rek: {tabungan.nomorRekening}
            </span>
          </div>
        </div>
        <div className="text-left md:text-right">
          <p className="mb-1 text-label-sm uppercase tracking-wider text-on-surface-variant">
            Saldo Tersedia
          </p>
          <p className="text-display-lg-mobile text-primary md:text-display-lg">
            {toRupiah(tabungan.saldo)}
          </p>
        </div>
      </section>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-error-container px-4 py-3 text-on-error-container">
          <span className="material-symbols-outlined text-[20px]">error</span>
          <span className="text-label-md">{error}</span>
        </div>
      )}

      {/* Filter (berlaku pada transaksi di halaman aktif) */}
      <section className="flex flex-col items-center gap-4 rounded-2xl border border-surface-variant bg-surface-container-lowest p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)] lg:flex-row">
        <div className="relative w-full flex-grow">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">
            search
          </span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari keterangan atau referensi..."
            className="w-full rounded-lg border border-transparent bg-surface-container-low py-3 pl-10 pr-4 text-body-md text-on-surface transition-colors placeholder:text-outline focus:border-primary-container focus:outline-none focus:ring-1 focus:ring-primary-container"
          />
        </div>
        <div className="flex w-full flex-col gap-4 sm:flex-row lg:w-auto">
          <select
            value={jenis}
            onChange={(e) => setJenis(e.target.value as Jenis)}
            className="w-full cursor-pointer rounded-lg border border-transparent bg-surface-container-low px-4 py-3 text-body-md text-on-surface transition-colors focus:border-primary-container focus:outline-none focus:ring-1 focus:ring-primary-container sm:w-auto"
          >
            <option value="SEMUA">Semua Transaksi</option>
            <option value="SETOR">Setor</option>
            <option value="TARIK">Tarik</option>
          </select>
          {filterAktif && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setJenis("SEMUA");
              }}
              className="flex w-full shrink-0 items-center justify-center gap-2 rounded-lg border border-outline-variant px-6 py-3 text-label-md text-on-surface-variant transition-colors hover:bg-surface-container-low sm:w-auto"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
              Reset
            </button>
          )}
        </div>
      </section>

      {/* Tabel mutasi */}
      <section className="overflow-hidden rounded-2xl border border-surface-variant bg-surface-container-lowest shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead className="border-b border-surface-variant bg-surface-container-low">
              <tr className="text-label-md font-semibold text-on-surface-variant">
                <th className="px-6 py-4">Tanggal</th>
                <th className="px-6 py-4">Keterangan</th>
                <th className="px-6 py-4">Referensi</th>
                <th className="px-6 py-4 text-right">Nominal</th>
                <th className="px-6 py-4 text-right">Saldo Akhir</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-variant text-body-md text-on-surface">
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-on-surface-variant"
                  >
                    {filterAktif
                      ? "Tidak ada transaksi yang cocok dengan filter di halaman ini."
                      : "Belum ada transaksi."}
                  </td>
                </tr>
              ) : (
                rows.map((t) => <MutasiRow key={t.id} t={t} />)
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination (server-side; filter hanya menyaring halaman aktif) */}
        <div className="flex items-center justify-between border-t border-surface-variant px-6 py-4">
          <span className="text-body-md text-on-surface-variant">
            {filterAktif
              ? `Menampilkan ${rows.length} hasil di halaman ini`
              : `Menampilkan ${from}-${to} dari ${total} transaksi`}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => loadMutasi(tabungan.id, Math.max(0, offset - LIMIT))}
              disabled={offset === 0}
              className="rounded-lg border border-outline-variant p-2 text-on-surface-variant transition-colors hover:bg-surface-container-low disabled:opacity-50"
              aria-label="Halaman sebelumnya"
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <button
              type="button"
              onClick={() => loadMutasi(tabungan.id, offset + LIMIT)}
              disabled={to >= total}
              className="rounded-lg border border-outline-variant p-2 text-on-surface-variant transition-colors hover:bg-surface-container-low disabled:opacity-50"
              aria-label="Halaman berikutnya"
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

function MutasiRow({ t }: { t: Transaksi }) {
  const isSetor = t.jenis === "SETOR";
  return (
    <tr className="transition-colors hover:bg-surface-container-low">
      <td className="whitespace-nowrap px-6 py-4 text-on-surface-variant">
        {formatTanggal(t.waktu)}
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full ${
              isSetor
                ? "bg-surface-container-high text-primary-container"
                : "bg-error-container text-error"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">
              {isSetor ? "arrow_downward" : "arrow_upward"}
            </span>
          </div>
          {keterangan(t)}
        </div>
      </td>
      <td className="px-6 py-4 font-mono text-sm text-outline">{t.referensi}</td>
      <td
        className={`px-6 py-4 text-right font-semibold ${
          isSetor ? "text-primary-container" : "text-error"
        }`}
      >
        {isSetor ? "+ " : "- "}
        {toRupiah(t.nominal)}
      </td>
      <td className="px-6 py-4 text-right font-medium">
        {toRupiah(t.saldoSesudah)}
      </td>
    </tr>
  );
}
