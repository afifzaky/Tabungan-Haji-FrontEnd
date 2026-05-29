"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getEstimasi,
  listMyTabungan,
  me,
  openAccount,
  type ApiResult,
  type Estimasi,
  type Profil,
  type Tabungan,
} from "@/lib/api";
import { toRupiah, progressPct } from "@/lib/format";
import { SetorModal } from "@/components/setor-modal";

export function DashboardView() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profil, setProfil] = useState<Profil | null>(null);
  const [tabungan, setTabungan] = useState<Tabungan | null>(null);
  const [estimasi, setEstimasi] = useState<Estimasi | null>(null);
  const [showSetor, setShowSetor] = useState(false);
  const [opening, setOpening] = useState(false);

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

  const load = useCallback(async () => {
    const [profilRes, tabRes] = await Promise.all([me(), listMyTabungan()]);
    if (handle401(profilRes) || handle401(tabRes)) return;
    setError(null);

    if (!profilRes.ok) {
      setError(profilRes.error);
      setLoading(false);
      return;
    }
    setProfil(profilRes.data);

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
      const estRes = await getEstimasi(akun.id);
      if (handle401(estRes)) return;
      setEstimasi(estRes.ok ? estRes.data : null);
    } else {
      setEstimasi(null);
    }
    setLoading(false);
  }, [handle401]);

  useEffect(() => {
    // Muat data dashboard saat mount (auth berbasis token = fetch sisi klien).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function handleOpenAccount() {
    if (!profil) return;
    setOpening(true);
    const res = await openAccount(profil.id);
    setOpening(false);
    if (handle401(res)) return;
    if (!res.ok) {
      setError(res.error);
      return;
    }
    load();
  }

  if (loading) {
    return (
      <div className="flex flex-grow items-center justify-center py-20 text-on-surface-variant">
        <span className="material-symbols-outlined animate-spin">
          progress_activity
        </span>
      </div>
    );
  }

  const namaDepan = profil?.nama?.split(" ")[0] ?? "Nasabah";

  return (
    <main className="mx-auto w-full max-w-[1280px] flex-grow px-5 py-8 md:px-16 md:py-12">
      <header className="mb-10">
        <h1 className="mb-2 text-display-lg-mobile text-on-surface md:text-display-lg">
          Assalamu&apos;alaikum, {namaDepan}
        </h1>
        <p className="text-body-lg text-on-surface-variant">
          Pantau perkembangan tabungan dan estimasi porsi Haji Anda di sini.
        </p>
      </header>

      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-lg bg-error-container px-4 py-3 text-on-error-container">
          <span className="material-symbols-outlined text-[20px]">error</span>
          <span className="text-label-md">{error}</span>
        </div>
      )}

      {!tabungan ? (
        <EmptyAccount opening={opening} onOpen={handleOpenAccount} />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Kolom kiri: rekening + aksi */}
          <div className="flex flex-col gap-6 lg:col-span-1">
            <div className="relative overflow-hidden rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
              <div className="absolute right-0 top-0 -mr-10 -mt-10 h-32 w-32 rounded-full bg-primary-container/10 blur-xl" />
              <div className="relative z-10 mb-6 flex items-start justify-between">
                <div>
                  <p className="mb-1 text-label-sm uppercase tracking-wider text-on-surface-variant">
                    Tabungan Haji
                  </p>
                  <h2 className="text-headline-md text-on-surface">No. Rekening</h2>
                  <p className="mt-1 font-mono text-body-md text-on-surface-variant">
                    {tabungan.nomorRekening}
                  </p>
                </div>
                <StatusBadge status={tabungan.status} />
              </div>
              <div className="relative z-10">
                <p className="mb-1 text-label-md text-on-surface-variant">
                  Total Saldo
                </p>
                <p className="text-[32px] font-bold leading-tight tracking-tight text-primary">
                  {toRupiah(tabungan.saldo)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setShowSetor(true)}
                className="flex h-[100px] flex-col items-center justify-center gap-2 rounded-lg bg-primary-container p-4 text-on-primary shadow-sm transition-colors hover:bg-primary"
              >
                <span className="material-symbols-outlined">add_circle</span>
                <span className="text-label-sm">Setor</span>
              </button>
              <Link
                href="/estimasi"
                className="flex h-[100px] flex-col items-center justify-center gap-2 rounded-lg border border-outline-variant/50 bg-surface-container-lowest p-4 text-on-surface shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-colors hover:bg-surface-container-low"
              >
                <span className="material-symbols-outlined text-primary">
                  receipt_long
                </span>
                <span className="text-label-sm">Mutasi</span>
              </Link>
              <Link
                href="/estimasi"
                className="flex h-[100px] flex-col items-center justify-center gap-2 rounded-lg border border-outline-variant/50 bg-surface-container-lowest p-4 text-on-surface shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-colors hover:bg-surface-container-low"
              >
                <span className="material-symbols-outlined text-secondary">
                  calculate
                </span>
                <span className="text-label-sm">Estimasi</span>
              </Link>
            </div>
          </div>

          {/* Kolom kanan: ringkasan estimasi */}
          <div className="lg:col-span-2">
            <EstimasiSummary estimasi={estimasi} />
          </div>
        </div>
      )}

      {showSetor && tabungan && (
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

function StatusBadge({ status }: { status: string }) {
  const aktif = status === "AKTIF";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
        aktif ? "bg-primary/10 text-primary" : "bg-surface-variant text-on-surface-variant"
      }`}
    >
      <span
        className={`mr-1.5 h-1.5 w-1.5 rounded-full ${
          aktif ? "bg-primary" : "bg-on-surface-variant"
        }`}
      />
      {status}
    </span>
  );
}

function EmptyAccount({
  opening,
  onOpen,
}: {
  opening: boolean;
  onOpen: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-outline-variant bg-surface-container-lowest px-6 py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-container/15 text-primary">
        <span className="material-symbols-outlined text-[32px]">savings</span>
      </div>
      <h2 className="text-headline-md text-on-surface">
        Anda belum memiliki rekening Tabungan Haji
      </h2>
      <p className="mt-2 max-w-md text-body-md text-on-surface-variant">
        Buka rekening sekarang untuk mulai menabung dan memantau estimasi
        keberangkatan Haji Anda.
      </p>
      <button
        type="button"
        onClick={onOpen}
        disabled={opening}
        className="mt-6 rounded-lg bg-primary-container px-6 py-3 text-label-md font-semibold text-on-primary transition-colors hover:bg-primary disabled:opacity-60"
      >
        {opening ? "Membuka..." : "Buka Rekening Tabungan Haji"}
      </button>
    </div>
  );
}

function EstimasiSummary({ estimasi }: { estimasi: Estimasi | null }) {
  if (!estimasi) {
    return (
      <div className="flex h-full items-center justify-center rounded-3xl border border-outline-variant/30 bg-surface-container-lowest p-8 text-on-surface-variant">
        Ringkasan estimasi belum tersedia.
      </div>
    );
  }

  const { estimasi: e, parameter: p } = estimasi;
  const sudahPorsi = e.sudahPorsi;
  const progress = progressPct(estimasi.tabungan.saldo, p.setoranAwalBpih);

  return (
    <div className="flex h-full flex-col rounded-3xl border border-outline-variant/30 bg-surface-container-lowest p-8 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
      <div className="mb-8 flex items-center justify-between border-b border-outline-variant/20 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary-container/20 text-secondary">
            <span className="material-symbols-outlined">mosque</span>
          </div>
          <div>
            <h3 className="text-headline-md text-on-surface">
              Estimasi Keberangkatan
            </h3>
            <p className="text-body-sm text-on-surface-variant">
              Ringkasan progress menuju porsi Haji
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="mb-1 text-label-sm text-on-surface-variant">
            Status Porsi
          </p>
          <span
            className={`inline-flex items-center rounded-full border px-3 py-1.5 text-sm font-bold ${
              sudahPorsi
                ? "border-primary/30 bg-primary/10 text-primary"
                : "border-secondary-container/30 bg-secondary-container/20 text-on-secondary-container"
            }`}
          >
            {sudahPorsi ? "SUDAH PORSI" : "BELUM PORSI"}
          </span>
        </div>
      </div>

      <div className="flex flex-grow flex-col justify-center py-4">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <p className="mb-1 text-label-md text-on-surface-variant">
              Progress Pembayaran Porsi
            </p>
            <p className="text-headline-lg text-on-surface">
              {progress}%
              <span className="ml-1 text-body-md font-normal text-on-surface-variant">
                menuju porsi
              </span>
            </p>
          </div>
          <div className="text-right">
            <p className="mb-1 text-label-md text-on-surface-variant">
              Target Porsi
            </p>
            <p className="text-headline-md text-on-surface">
              {toRupiah(p.setoranAwalBpih)}
            </p>
          </div>
        </div>

        <div className="mb-8 h-4 w-full overflow-hidden rounded-full bg-surface-container-highest">
          <div
            className="h-full rounded-full bg-secondary-container"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="mt-auto grid grid-cols-1 gap-4 md:grid-cols-2">
          <SummaryBox
            icon="payments"
            iconClass="text-primary"
            label="Kekurangan Dana"
            value={sudahPorsi ? toRupiah(0) : toRupiah(e.kekuranganUntukPorsi)}
            sub={sudahPorsi ? "porsi sudah tercapai" : "untuk mendapatkan porsi"}
          />
          <SummaryBox
            icon="event"
            iconClass="text-secondary"
            label="Perkiraan Porsi"
            value={`Tahun ${e.tahunDapatPorsi}`}
            sub="berdasarkan pola setoran"
          />
        </div>
      </div>
    </div>
  );
}

function SummaryBox({
  icon,
  iconClass,
  label,
  value,
  sub,
}: {
  icon: string;
  iconClass: string;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="flex items-start gap-4 rounded-xl border border-outline-variant/30 bg-surface-container-low p-4">
      <div className={`mt-1 ${iconClass}`}>
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      <div>
        <p className="mb-1 text-label-md text-on-surface-variant">{label}</p>
        <p className="text-headline-md text-on-surface">{value}</p>
        <p className="mt-1 text-label-sm text-on-surface-variant">{sub}</p>
      </div>
    </div>
  );
}
