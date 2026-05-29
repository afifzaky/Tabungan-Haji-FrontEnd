"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getEstimasi,
  getMutasi,
  getStoredNasabah,
  listMyTabungan,
  type ApiResult,
  type Estimasi,
  type MutasiResult,
  type Tabungan,
  type Transaksi,
} from "@/lib/api";
import { toRupiah, formatTanggal, progressPct } from "@/lib/format";
import { SetorModal } from "@/components/setor-modal";

const LIMIT = 10;

export function EstimasiView() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabungan, setTabungan] = useState<Tabungan | null>(null);
  const [estimasi, setEstimasi] = useState<Estimasi | null>(null);
  const [mutasi, setMutasi] = useState<MutasiResult | null>(null);
  const [offset, setOffset] = useState(0);
  const [showSetor, setShowSetor] = useState(false);
  const [nama, setNama] = useState("Nasabah");

  const handle401 = useCallback(
    (r: ApiResult<unknown>): boolean => {
      if (!r.ok && r.status === 401) {
        router.replace("/login");
        return true;
      }
      return false;
    },
    [router]
  );

  const loadMutasi = useCallback(
    async (id: string, nextOffset: number) => {
      const res = await getMutasi(id, LIMIT, nextOffset);
      if (handle401(res)) return;
      if (res.ok) {
        setMutasi(res.data);
        setOffset(nextOffset);
      }
    },
    [handle401]
  );

  const load = useCallback(async () => {
    const tabRes = await listMyTabungan();
    if (handle401(tabRes)) return;
    setNama(getStoredNasabah()?.nama?.split(" ")[0] ?? "Nasabah");
    setError(null);
    if (!tabRes.ok) {
      setError(tabRes.error);
      setLoading(false);
      return;
    }

    const akun =
      tabRes.data.data.find((t) => t.status === "AKTIF") ??
      tabRes.data.data[0] ??
      null;
    setTabungan(akun);

    if (akun) {
      const [estRes, mutRes] = await Promise.all([
        getEstimasi(akun.id),
        getMutasi(akun.id, LIMIT, 0),
      ]);
      if (handle401(estRes) || handle401(mutRes)) return;
      setEstimasi(estRes.ok ? estRes.data : null);
      if (mutRes.ok) {
        setMutasi(mutRes.data);
        setOffset(0);
      }
    }
    setLoading(false);
  }, [handle401]);

  useEffect(() => {
    // Muat estimasi + mutasi saat mount (auth berbasis token = fetch sisi klien).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

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
            Buka rekening terlebih dahulu untuk melihat estimasi & mutasi.
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

  const e = estimasi?.estimasi;
  const p = estimasi?.parameter;
  const progress = p ? progressPct(tabungan.saldo, p.setoranAwalBpih) : 0;

  return (
    <main className="mx-auto w-full max-w-[1280px] flex-grow space-y-12 px-5 py-12 md:space-y-16 md:px-16">
      <section className="space-y-2">
        <h1 className="text-headline-lg text-on-surface">
          Assalamu&apos;alaikum, {nama}
        </h1>
        <p className="text-body-lg text-on-surface-variant">
          Berikut rincian estimasi keberangkatan dan riwayat tabungan haji Anda.
        </p>
      </section>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-error-container px-4 py-3 text-on-error-container">
          <span className="material-symbols-outlined text-[20px]">error</span>
          <span className="text-label-md">{error}</span>
        </div>
      )}

      {/* Bento: ringkasan saldo + estimasi */}
      <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Kartu saldo */}
        <div className="relative flex min-h-[200px] flex-col justify-between overflow-hidden rounded-2xl bg-primary p-6 text-on-primary shadow-sm md:col-span-1">
          <div
            className="pointer-events-none absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
              backgroundSize: "24px 24px",
            }}
          />
          <div className="z-10">
            <p className="mb-1 text-label-md text-primary-fixed-dim">
              Total Saldo Tabungan
            </p>
            <h2 className="mb-6 text-headline-lg">{toRupiah(tabungan.saldo)}</h2>
            <div className="space-y-1">
              <p className="text-label-sm text-primary-fixed-dim">
                Nomor Rekening
              </p>
              <p className="font-mono text-body-md font-medium tracking-wider">
                {tabungan.nomorRekening}
              </p>
            </div>
          </div>
          <div className="z-10 mt-6">
            <button
              type="button"
              onClick={() => setShowSetor(true)}
              className="w-full rounded-lg bg-surface-container-lowest px-4 py-2 text-center text-label-md font-semibold text-primary transition-colors hover:bg-surface"
            >
              Top Up
            </button>
          </div>
        </div>

        {/* Kartu estimasi detail */}
        <div className="flex flex-col justify-between rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-8 shadow-[0_4px_20px_rgba(0,0,0,0.04)] md:col-span-2">
          <div className="mb-8 flex items-start justify-between">
            <div>
              <h3 className="mb-2 text-headline-md text-on-surface">
                Estimasi Keberangkatan
              </h3>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-secondary-fixed/30 px-3 py-1 text-label-sm text-on-secondary-container">
                <span className="material-symbols-outlined text-[16px]">
                  pending_actions
                </span>
                Status Porsi: {e?.sudahPorsi ? "SUDAH PORSI" : "BELUM PORSI"}
              </div>
            </div>
            <div className="text-right">
              <p className="mb-1 text-label-md text-on-surface-variant">
                Tahun Estimasi
              </p>
              <p className="text-display-lg text-primary">
                {e?.tahunEstimasiBerangkat ?? "-"}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between text-label-md text-on-surface">
              <span>Terkumpul: {toRupiah(tabungan.saldo)}</span>
              <span>
                Target Setoran Awal:{" "}
                {p ? toRupiah(p.setoranAwalBpih) : "-"}
              </span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-surface-variant">
              <div
                className="h-full rounded-full bg-secondary-container"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="mt-6 grid grid-cols-2 gap-4 border-t border-outline-variant/30 pt-6">
              <div>
                <p className="mb-1 text-label-sm text-on-surface-variant">
                  Sisa Waktu Tunggu
                </p>
                <p className="text-headline-md text-on-surface">
                  {e?.waitingYears ?? "-"} Tahun
                </p>
              </div>
              <div>
                <p className="mb-1 text-label-sm text-on-surface-variant">
                  Sisa Pelunasan (Estimasi)
                </p>
                <p className="text-headline-md text-on-surface">
                  {e ? toRupiah(e.sisaPelunasan) : "-"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Riwayat mutasi */}
      <section className="space-y-6">
        <h3 className="text-headline-md text-on-surface">Riwayat Mutasi</h3>
        <MutasiTable
          mutasi={mutasi}
          offset={offset}
          onPrev={() =>
            tabungan && loadMutasi(tabungan.id, Math.max(0, offset - LIMIT))
          }
          onNext={() => tabungan && loadMutasi(tabungan.id, offset + LIMIT)}
        />
      </section>

      {showSetor && (
        <SetorModal
          tabunganId={tabungan.id}
          onClose={() => setShowSetor(false)}
          onSuccess={() => {
            setShowSetor(false);
            load();
          }}
        />
      )}
    </main>
  );
}

function MutasiTable({
  mutasi,
  offset,
  onPrev,
  onNext,
}: {
  mutasi: MutasiResult | null;
  offset: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  const rows = mutasi?.data ?? [];
  const total = mutasi?.total ?? 0;
  const from = total === 0 ? 0 : offset + 1;
  const to = Math.min(offset + rows.length, total);

  return (
    <div className="overflow-hidden rounded-2xl border border-outline-variant/30 bg-surface-container-lowest shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-outline-variant bg-surface text-label-md text-on-surface-variant">
              <th className="px-6 py-4 font-semibold">Tanggal</th>
              <th className="px-6 py-4 font-semibold">Tipe</th>
              <th className="px-6 py-4 font-semibold">Metode</th>
              <th className="px-6 py-4 text-right font-semibold">Nominal</th>
              <th className="px-6 py-4 text-right font-semibold">Saldo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/50 text-body-md text-on-surface">
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-10 text-center text-on-surface-variant"
                >
                  Belum ada transaksi.
                </td>
              </tr>
            ) : (
              rows.map((t) => <MutasiRow key={t.id} t={t} />)
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-outline-variant bg-surface px-6 py-4">
        <span className="text-label-sm text-on-surface-variant">
          Menampilkan {from}-{to} dari {total} transaksi
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onPrev}
            disabled={offset === 0}
            className="rounded-lg border border-outline-variant p-2 text-on-surface-variant hover:bg-surface-container disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[20px]">
              chevron_left
            </span>
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={to >= total}
            className="rounded-lg border border-outline-variant p-2 text-on-surface-variant hover:bg-surface-container disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[20px]">
              chevron_right
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

function MutasiRow({ t }: { t: Transaksi }) {
  const isSetor = t.jenis === "SETOR";
  return (
    <tr className="transition-colors hover:bg-surface">
      <td className="px-6 py-4 text-on-surface-variant">
        {formatTanggal(t.waktu)}
      </td>
      <td className="px-6 py-4">
        <span
          className={`inline-flex items-center rounded px-2 py-0.5 text-label-sm ${
            isSetor ? "bg-primary/10 text-primary" : "bg-error/10 text-error"
          }`}
        >
          {t.jenis}
        </span>
      </td>
      <td className="px-6 py-4 text-on-surface-variant">{t.metode ?? "-"}</td>
      <td
        className={`px-6 py-4 text-right font-medium ${
          isSetor ? "text-primary" : "text-error"
        }`}
      >
        {isSetor ? "+" : "-"}
        {toRupiah(t.nominal)}
      </td>
      <td className="px-6 py-4 text-right text-on-surface-variant">
        {toRupiah(t.saldoSesudah)}
      </td>
    </tr>
  );
}
