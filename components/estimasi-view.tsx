"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ApiError,
  errorMessage,
  getEstimasi,
  listMyTabungan,
} from "@/lib/api";
import type { Estimasi, TabunganHaji } from "@/lib/types";
import { toRupiah, progressPct } from "@/lib/format";
import { SetorModal } from "@/components/setor-modal";

export function EstimasiView() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabungan, setTabungan] = useState<TabunganHaji | null>(null);
  const [estimasi, setEstimasi] = useState<Estimasi | null>(null);
  const [showSetor, setShowSetor] = useState(false);

  const load = useCallback(async () => {
    try {
      const tabRes = await listMyTabungan();
      const akun =
        tabRes.data.find((t) => t.status === "AKTIF") ??
        tabRes.data[0] ??
        null;
      setTabungan(akun);

      if (akun) {
        try {
          setEstimasi(await getEstimasi(akun.id));
        } catch (e) {
          if (e instanceof ApiError && e.status === 401) throw e;
          setEstimasi(null);
        }
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
    // Muat estimasi saat mount (auth berbasis token = fetch sisi klien).
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
            Buka rekening terlebih dahulu untuk melihat estimasi keberangkatan.
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
  const sudahPorsi = e?.sudahPorsi ?? false;
  const progress = p ? progressPct(tabungan.saldo, p.setoranAwalBpih) : 0;
  const tahunIni = new Date().getFullYear();

  return (
    <main className="mx-auto w-full max-w-[1280px] flex-grow px-5 py-12 md:px-16">
      {/* Header halaman */}
      <header className="mb-12">
        <h1 className="mb-2 text-display-lg-mobile text-primary md:text-display-lg">
          Estimasi Keberangkatan
        </h1>
        <p className="text-body-lg text-on-surface-variant">
          Pantau perjalanan spiritual Anda menuju Baitullah.
        </p>
      </header>

      {error && (
        <div className="mb-8 flex items-center gap-2 rounded-lg bg-error-container px-4 py-3 text-on-error-container">
          <span className="material-symbols-outlined text-[20px]">error</span>
          <span className="text-label-md">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Kolom kiri */}
        <div className="flex flex-col gap-6 lg:col-span-8">
          {/* Target Porsi Haji */}
          <section className="relative overflow-hidden rounded-2xl bg-surface-container-lowest p-8 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
            <div className="pointer-events-none absolute right-0 top-0 opacity-5">
              <span className="material-symbols-outlined fill-icon text-[200px]">
                mosque
              </span>
            </div>
            <div className="relative z-10 mb-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
              <div>
                <h2 className="mb-1 text-headline-md text-on-surface">
                  Target Porsi Haji
                </h2>
                <p className="text-body-md text-on-surface-variant">
                  Kumpulkan saldo untuk mendapatkan nomor porsi.
                </p>
              </div>
              <div className="text-left md:text-right">
                <p className="mb-1 text-label-md uppercase tracking-wider text-on-surface-variant">
                  Target
                </p>
                <p className="text-headline-lg text-primary">
                  {p ? toRupiah(p.setoranAwalBpih) : "-"}
                </p>
              </div>
            </div>

            <div className="relative z-10">
              <div className="mb-2 flex justify-between">
                <span className="text-label-md font-bold text-primary">
                  {progress}% Terkumpul
                </span>
                <span className="text-label-md text-on-surface-variant">
                  {sudahPorsi
                    ? "Porsi tercapai"
                    : `Sisa: ${e ? toRupiah(e.kekuranganUntukPorsi) : "-"}`}
                </span>
              </div>
              <div className="relative h-4 w-full overflow-hidden rounded-full bg-secondary-fixed">
                <div
                  className="absolute left-0 top-0 h-full rounded-full bg-secondary-fixed-dim transition-all duration-1000 ease-in-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="mt-2 text-right">
                <span className="text-body-md font-semibold text-on-surface">
                  Terkumpul {toRupiah(tabungan.saldo)}
                </span>
              </div>
            </div>
          </section>

          {/* Peta Perjalanan Haji */}
          <section className="rounded-2xl bg-surface-container-lowest p-8 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
            <h3 className="mb-8 text-headline-md text-on-surface">
              Peta Perjalanan Haji Anda
            </h3>
            <div className="relative flex flex-col justify-between md:flex-row">
              {/* Garis penghubung */}
              <div className="absolute left-[23px] bottom-8 top-8 z-0 w-[2px] bg-surface-variant md:left-8 md:right-8 md:bottom-auto md:top-[23px] md:h-[2px] md:w-auto" />

              <TimelineStep
                icon="account_balance_wallet"
                ring="bg-primary"
                iconClass="text-on-primary"
                labelClass="text-primary"
                label="Saat Ini"
                year={String(tahunIni)}
                caption="Menabung"
              />
              <TimelineStep
                icon="description"
                ring="bg-secondary-fixed-dim border-4 border-surface-container-lowest"
                iconClass="text-on-surface"
                labelClass="text-secondary"
                label="Estimasi"
                year={e ? String(e.tahunDapatPorsi) : "-"}
                caption="Dapat Porsi"
              />
              <TimelineStep
                icon="flight_takeoff"
                ring="bg-surface-variant border-4 border-surface-container-lowest"
                iconClass="text-on-surface-variant"
                labelClass="text-on-surface-variant"
                label="Estimasi"
                year={e ? String(e.tahunEstimasiBerangkat) : "-"}
                caption="Berangkat"
              />
            </div>
          </section>
        </div>

        {/* Kolom kanan */}
        <div className="flex flex-col gap-6 lg:col-span-4">
          {/* Analisis Tabungan */}
          <section className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
            <div className="mb-6 flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">
                insights
              </span>
              <h3 className="text-headline-md text-on-surface">
                Analisis Tabungan
              </h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-surface-variant pb-4">
                <span className="text-body-md text-on-surface-variant">
                  Rata-rata Setoran/Bln
                </span>
                <span className="text-headline-sm text-on-surface">
                  {p ? toRupiah(p.avgSetorBulananDigunakan) : "-"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-body-md text-on-surface-variant">
                  Waktu Capai Porsi
                </span>
                <span className="text-headline-sm text-primary">
                  {sudahPorsi
                    ? "Tercapai"
                    : e
                      ? `~${e.bulanUntukPorsi} Bulan lagi`
                      : "-"}
                </span>
              </div>
            </div>
          </section>

          {/* Estimasi Pelunasan BPIH */}
          <section className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
            <div className="mb-6 flex items-center gap-3">
              <span className="material-symbols-outlined text-secondary">
                account_balance
              </span>
              <h3 className="text-headline-md text-on-surface">
                Estimasi Pelunasan BPIH
              </h3>
            </div>
            <div className="mb-6 rounded-lg bg-surface-container-low p-4">
              <p className="mb-1 text-label-sm uppercase text-on-surface-variant">
                Total Estimasi BPIH
              </p>
              <p className="text-headline-md text-on-surface">
                {p ? toRupiah(p.bpihTotal) : "-"}
              </p>
              <p className="mt-2 text-label-sm italic text-on-surface-variant">
                *Berdasarkan standar BPIH terkini
              </p>
            </div>
            <div className="flex items-end justify-between">
              <span className="text-body-md text-on-surface">
                Sisa Pelunasan:
              </span>
              <span className="text-headline-md font-bold text-error">
                {e ? toRupiah(e.sisaPelunasan) : "-"}
              </span>
            </div>
          </section>

          {/* CTA */}
          <button
            type="button"
            onClick={() => setShowSetor(true)}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-container px-6 py-4 text-label-md font-bold text-on-primary shadow-sm transition-colors hover:bg-primary"
          >
            <span className="material-symbols-outlined">trending_up</span>
            Top Up Tabungan
          </button>
        </div>
      </div>

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

function TimelineStep({
  icon,
  ring,
  iconClass,
  labelClass,
  label,
  year,
  caption,
}: {
  icon: string;
  ring: string;
  iconClass: string;
  labelClass: string;
  label: string;
  year: string;
  caption: string;
}) {
  return (
    <div className="relative z-10 mb-8 flex flex-1 items-center gap-4 bg-surface-container-lowest py-2 last:mb-0 md:mb-0 md:flex-col md:gap-3 md:px-4">
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full shadow-sm ${ring}`}
      >
        <span className={`material-symbols-outlined ${iconClass}`}>{icon}</span>
      </div>
      <div className="text-left md:text-center">
        <p
          className={`mb-1 text-label-sm uppercase tracking-wider ${labelClass}`}
        >
          {label}
        </p>
        <p className="text-headline-md text-on-surface">{year}</p>
        <p className="text-body-md text-on-surface-variant">{caption}</p>
      </div>
    </div>
  );
}
