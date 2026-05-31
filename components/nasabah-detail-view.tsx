"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ApiError,
  adminGetMutasi,
  adminGetTabunganByNasabah,
  errorMessage,
  getNasabah,
} from "@/lib/api";
import type { NasabahWithTabungan, TabunganHaji, Transaksi } from "@/lib/types";
import { toRupiah, formatTanggal } from "@/lib/format";

export function NasabahDetailView({ id }: { id: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nasabah, setNasabah] = useState<NasabahWithTabungan | null>(null);
  const [tabungan, setTabungan] = useState<TabunganHaji | null>(null);
  const [transaksi, setTransaksi] = useState<Transaksi[]>([]);

  const load = useCallback(async () => {
    try {
      const n = await getNasabah(id);
      setNasabah(n);

      // Rekening: dari respons detail bila ada, jika tidak ambil via endpoint admin.
      let akun = n.tabungan?.[0] ?? null;
      if (!akun) {
        try {
          const res = await adminGetTabunganByNasabah(id);
          akun = res.data?.[0] ?? null;
        } catch (e) {
          // 401 = sesi habis (biar auto-logout). Selain itu (mis. endpoint belum
          // ada) diabaikan agar profil tetap tampil.
          if (e instanceof ApiError && e.status === 401) throw e;
        }
      }
      setTabungan(akun);

      // Mutasi singkat: dari respons detail, atau ambil best-effort untuk rekening.
      let trx = n.transaksi ?? [];
      if (akun && trx.length === 0) {
        try {
          trx = (await adminGetMutasi(akun.id, 5)).data ?? [];
        } catch (e) {
          if (e instanceof ApiError && e.status === 401) throw e;
        }
      }
      setTransaksi(trx);
      setError(null);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return;
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-20 text-on-surface-variant">
        <span className="material-symbols-outlined animate-spin">
          progress_activity
        </span>
      </div>
    );
  }

  if (!nasabah) {
    return (
      <main className="mx-auto w-full max-w-[1280px] flex-1 p-6 md:p-8">
        <div className="rounded-2xl border border-error-container bg-error-container/40 p-6 text-on-error-container">
          {error ?? "Data nasabah tidak ditemukan."}
        </div>
        <Link
          href="/admin/nasabah"
          className="mt-4 inline-flex items-center gap-2 text-label-md text-primary hover:underline"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Kembali ke Daftar
        </Link>
      </main>
    );
  }

  const akun = tabungan;

  return (
    <main className="mx-auto w-full max-w-[1280px] flex-1 space-y-6 p-6 md:p-8">
      {/* Breadcrumb & aksi */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <nav className="mb-2 flex items-center gap-2 text-label-sm text-on-surface-variant">
            <Link href="/admin/nasabah" className="transition-colors hover:text-primary">
              Manajemen Nasabah
            </Link>
            <span className="material-symbols-outlined text-[16px]">
              chevron_right
            </span>
            <span className="font-semibold text-on-surface">Detail Nasabah</span>
          </nav>
          <h1 className="text-headline-lg text-on-surface">Detail Nasabah</h1>
        </div>
        <Link
          href={`/admin/nasabah/${nasabah.id}/edit`}
          className="flex items-center gap-2 self-start rounded-lg border border-outline-variant px-4 py-2 text-label-md text-primary transition-colors hover:bg-surface-container sm:self-auto"
        >
          <span className="material-symbols-outlined text-[18px]">edit</span>
          Edit Data
        </Link>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-error-container px-4 py-3 text-on-error-container">
          <span className="material-symbols-outlined text-[20px]">error</span>
          <span className="text-label-md">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Kartu profil */}
        <div className="relative col-span-1 flex flex-col overflow-hidden rounded-2xl border border-surface-variant bg-surface-container-lowest p-6 shadow-sm">
          <div className="pointer-events-none absolute right-0 top-0 -mr-10 -mt-10 h-32 w-32 rounded-bl-full bg-primary-container/10" />
          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-surface-container-lowest bg-surface-variant text-2xl font-bold text-primary shadow-sm">
              {nasabah.nama.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-headline-md text-on-surface">{nasabah.nama}</h2>
              <span
                className={`mt-1 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  nasabah.role === "ADMIN"
                    ? "bg-tertiary-container text-on-tertiary-container"
                    : "bg-surface-container text-on-surface-variant"
                }`}
              >
                {nasabah.role}
              </span>
            </div>
          </div>
          <div className="flex-1 space-y-4">
            <InfoRow label="Nomor Induk Kependudukan (NIK)" value={nasabah.nik} />
            <InfoRow label="Email" value={nasabah.email} />
            <InfoRow label="Kontak" value={nasabah.nomorHp} />
            <InfoRow
              label="Terdaftar Sejak"
              value={formatTanggal(nasabah.createdAt)}
            />
          </div>
        </div>

        {/* Kartu ringkasan rekening */}
        <div className="col-span-1 flex flex-col justify-between rounded-2xl border border-surface-variant bg-surface-container-lowest p-6 shadow-sm lg:col-span-2">
          {akun ? (
            <>
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px] text-secondary">
                      account_balance_wallet
                    </span>
                    <h3 className="text-label-md uppercase tracking-wider text-on-surface-variant">
                      Tabungan Haji Indonesia
                    </h3>
                  </div>
                  <p className="mt-1 font-mono text-headline-md tracking-tight text-on-surface">
                    {akun.nomorRekening}
                  </p>
                </div>
                <StatusBadge status={akun.status} />
              </div>
              <div className="my-6">
                <p className="mb-2 text-label-md text-on-surface-variant">
                  Total Saldo
                </p>
                <p className="text-display-lg-mobile font-bold tracking-tight text-primary md:text-display-lg">
                  {toRupiah(akun.saldo)}
                </p>
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center py-10 text-center text-on-surface-variant">
              <span className="material-symbols-outlined mb-2 text-[32px]">
                savings
              </span>
              <p className="text-body-md">
                Nasabah ini belum memiliki rekening Tabungan Haji.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Mutasi singkat (bila disertakan backend) */}
      <div className="overflow-hidden rounded-2xl border border-surface-variant bg-surface-container-lowest shadow-sm">
        <div className="flex items-center justify-between border-b border-surface-variant bg-surface-bright p-6">
          <div>
            <h3 className="flex items-center gap-2 text-headline-md text-on-surface">
              <span className="material-symbols-outlined text-primary">
                history
              </span>
              Mutasi Singkat
            </h3>
            <p className="mt-1 text-label-sm text-on-surface-variant">
              Transaksi terakhir
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-surface-variant bg-surface-container-low">
                <th className="p-4 text-label-md font-semibold text-on-surface-variant">
                  Tanggal
                </th>
                <th className="p-4 text-label-md font-semibold text-on-surface-variant">
                  Keterangan
                </th>
                <th className="p-4 text-right text-label-md font-semibold text-on-surface-variant">
                  Nominal
                </th>
                <th className="p-4 text-right text-label-md font-semibold text-on-surface-variant">
                  Saldo Akhir
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-variant">
              {transaksi.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="p-8 text-center text-on-surface-variant"
                  >
                    Tidak ada data mutasi untuk ditampilkan.
                  </td>
                </tr>
              ) : (
                transaksi.map((t) => {
                  const isSetor = t.jenis === "SETOR";
                  return (
                    <tr key={t.id} className="hover:bg-surface-container-low/50">
                      <td className="p-4 text-body-md text-on-surface">
                        {formatTanggal(t.waktu)}
                      </td>
                      <td className="p-4 text-body-md text-on-surface">
                        {isSetor ? "Setoran" : "Penarikan"}
                        {t.metode ? ` • ${t.metode}` : ""}
                      </td>
                      <td
                        className={`p-4 text-right text-body-md font-semibold ${
                          isSetor ? "text-primary" : "text-error"
                        }`}
                      >
                        {isSetor ? "+ " : "- "}
                        {toRupiah(t.nominal)}
                      </td>
                      <td className="p-4 text-right text-body-md font-medium text-on-surface">
                        {toRupiah(t.saldoSesudah)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mb-1 text-label-sm text-on-surface-variant">{label}</p>
      <p className="text-body-md font-medium text-on-surface">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const aktif = status === "AKTIF";
  return (
    <div
      className={`flex items-center gap-1.5 rounded-full px-3 py-1 shadow-sm ${
        aktif
          ? "bg-primary-container text-on-primary-container"
          : "bg-surface-variant text-on-surface-variant"
      }`}
    >
      <span
        className={`h-2 w-2 rounded-full ${
          aktif ? "animate-pulse bg-on-primary-container" : "bg-on-surface-variant"
        }`}
      />
      <span className="text-label-sm font-bold tracking-wider">{status}</span>
    </div>
  );
}
