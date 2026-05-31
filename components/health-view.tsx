"use client";

import { useCallback, useEffect, useState } from "react";
import { checkHealth } from "@/lib/api";

type Status = "checking" | "online" | "offline";

/* Komponen sistem yang ditampilkan (selaras referensi systemchecker).
   Semua status diturunkan dari satu probe /health backend: bila backend
   terjangkau seluruhnya dianggap sehat, bila tidak ditandai gangguan. */
const COMPONENTS = [
  {
    icon: "cloud_done",
    nama: "API Backend",
    sub: "Core tabungan routing",
    onlineLabel: "Online",
  },
  {
    icon: "database",
    nama: "Database PostgreSQL",
    sub: "Customer ledger records",
    onlineLabel: "Connected",
  },
  {
    icon: "shield_person",
    nama: "Authentication Service",
    sub: "Identity & Access Auth",
    onlineLabel: "Running",
  },
  {
    icon: "sync_alt",
    nama: "Third-party Integrations",
    sub: "SISKOHAT Gateway",
    onlineLabel: "Operational",
  },
] as const;

function formatTime(date: Date): string {
  return (
    "Hari ini pukul " +
    date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  );
}

export function HealthView() {
  const [status, setStatus] = useState<Status>("checking");
  const [latency, setLatency] = useState<number | null>(null);
  const [lastChecked, setLastChecked] = useState("Memuat...");
  const [refreshing, setRefreshing] = useState(false);

  const runCheck = useCallback(async () => {
    setRefreshing(true);
    setStatus("checking");
    const start = performance.now();
    const ok = await checkHealth();
    const elapsed = Math.round(performance.now() - start);
    setStatus(ok ? "online" : "offline");
    setLatency(ok ? elapsed : null);
    setLastChecked(formatTime(new Date()));
    setRefreshing(false);
  }, []);

  useEffect(() => {
    // Probe health saat mount (fetch sisi klien, sama seperti SystemStatus).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    runCheck();
  }, [runCheck]);

  const online = status === "online";
  // Bar latensi: 0ms = kosong, ≥300ms = penuh.
  const latencyPct =
    latency == null ? 0 : Math.min(100, Math.round((latency / 300) * 100));

  return (
    <main className="mx-auto w-full max-w-[1280px] flex-grow px-5 py-8 md:px-16 md:py-12">
      {/* Header halaman */}
      <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-headline-lg text-on-surface">
            Kesehatan Sistem API
          </h1>
          <p className="mt-1 flex items-center gap-2 text-body-md text-on-surface-variant">
            <span className="material-symbols-outlined text-[18px]">update</span>
            Terakhir dicek: <span className="font-medium">{lastChecked}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={runCheck}
          disabled={refreshing}
          className="flex items-center gap-2 rounded-lg border-2 border-primary-container bg-surface-container-lowest px-6 py-2.5 text-label-md font-bold text-primary-container shadow-sm transition-colors hover:bg-primary-container hover:text-on-primary-container disabled:pointer-events-none disabled:opacity-70"
        >
          <span
            className={`material-symbols-outlined text-[20px] ${
              refreshing ? "animate-spin" : ""
            }`}
          >
            refresh
          </span>
          Cek Ulang
        </button>
      </div>

      {/* Ringkasan (bento grid) */}
      <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Status keseluruhan */}
        <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-surface-variant bg-surface-container-lowest p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
          <div className="absolute right-0 top-0 -mr-8 -mt-8 h-32 w-32 rounded-bl-full bg-primary-container opacity-10" />
          <h3 className="mb-2 text-label-md text-on-surface-variant">
            Status Keseluruhan
          </h3>
          <div className="flex items-end gap-2">
            <span
              className={`text-display-lg ${
                online ? "text-primary" : "text-error"
              }`}
            >
              {status === "checking" ? "..." : online ? "Sehat" : "Gangguan"}
            </span>
          </div>
          <p className="mt-4 text-label-sm text-on-surface-variant opacity-70">
            Hasil probe endpoint /health
          </p>
        </div>

        {/* Latensi rata-rata */}
        <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-surface-variant bg-surface-container-lowest p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
          <h3 className="mb-2 text-label-md text-on-surface-variant">
            Latensi Respons
          </h3>
          <div className="flex items-end gap-2">
            <span className="text-display-lg text-on-surface">
              {latency == null ? "—" : latency}
            </span>
            <span className="mb-1 text-headline-md text-on-surface-variant">
              ms
            </span>
          </div>
          <div className="mt-4 h-1.5 w-full rounded-full bg-surface-container-high">
            <div
              className="h-1.5 rounded-full bg-primary-container transition-all"
              style={{ width: `${latencyPct}%` }}
            />
          </div>
          <p className="mt-2 text-label-sm text-on-surface-variant opacity-70">
            {latency == null
              ? "Belum terukur"
              : latency < 150
                ? "Performa optimal"
                : "Respons melambat"}
          </p>
        </div>

        {/* Endpoint dipantau */}
        <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-surface-variant bg-surface-container-lowest p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
          <h3 className="mb-2 text-label-md text-on-surface-variant">
            Komponen Dipantau
          </h3>
          <div className="flex items-end gap-2">
            <span className="text-display-lg text-on-surface">
              {COMPONENTS.length}
            </span>
          </div>
          <div className="mt-4 flex items-center gap-2 text-label-sm text-primary">
            <span
              className={`h-2 w-2 rounded-full bg-primary-container ${
                online ? "animate-pulse" : ""
              }`}
            />
            Pemantauan langsung
          </div>
        </div>
      </section>

      {/* Daftar status komponen */}
      <section className="mt-8">
        <h2 className="mb-6 text-headline-md text-on-surface">
          Status Komponen
        </h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {COMPONENTS.map((c) => (
            <ComponentRow
              key={c.nama}
              icon={c.icon}
              nama={c.nama}
              sub={c.sub}
              status={status}
              onlineLabel={c.onlineLabel}
            />
          ))}
        </div>
      </section>
    </main>
  );
}

function ComponentRow({
  icon,
  nama,
  sub,
  status,
  onlineLabel,
}: {
  icon: string;
  nama: string;
  sub: string;
  status: Status;
  onlineLabel: string;
}) {
  const label =
    status === "checking"
      ? "Mengecek..."
      : status === "online"
        ? onlineLabel
        : "Tidak Tersedia";

  const offline = status === "offline";

  return (
    <div className="group flex items-center justify-between rounded-xl border border-surface-variant bg-surface-container-lowest p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)] transition-colors hover:border-primary-container">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-surface-container text-primary transition-colors group-hover:bg-primary-container group-hover:text-on-primary-container">
          <span className="material-symbols-outlined">{icon}</span>
        </div>
        <div>
          <h4 className="text-headline-sm text-on-surface">{nama}</h4>
          <p className="text-body-md text-on-surface-variant">{sub}</p>
        </div>
      </div>
      <div
        className={`flex items-center gap-2 rounded-full px-3 py-1.5 ${
          offline ? "bg-error-container" : "bg-primary-container/10"
        }`}
      >
        <span
          className={`h-2 w-2 rounded-full ${
            offline
              ? "bg-error"
              : status === "checking"
                ? "animate-pulse bg-outline-variant"
                : "bg-primary-container"
          }`}
        />
        <span
          className={`text-label-md font-bold ${
            offline ? "text-on-error-container" : "text-primary"
          }`}
        >
          {label}
        </span>
      </div>
    </div>
  );
}
