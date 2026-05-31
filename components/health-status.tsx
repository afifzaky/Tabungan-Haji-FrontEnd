"use client";

import { useCallback, useEffect, useState } from "react";
import { checkHealth } from "@/lib/api";

type Status = "checking" | "online" | "offline";

const CFG: Record<Status, { label: string; dot: string; text: string }> = {
  checking: {
    label: "Mengecek API...",
    dot: "bg-outline-variant animate-pulse",
    text: "text-on-surface-variant",
  },
  online: {
    label: "API Online",
    dot: "bg-emerald-500",
    text: "text-on-surface-variant",
  },
  offline: {
    label: "API Offline",
    dot: "bg-error",
    text: "text-error",
  },
};

/** Indikator kesehatan API dengan tombol "Cek ulang" (dipasang di dashboard). */
export function HealthStatus() {
  const [status, setStatus] = useState<Status>("checking");

  const run = useCallback(async () => {
    setStatus("checking");
    const ok = await checkHealth();
    setStatus(ok ? "online" : "offline");
  }, []);

  useEffect(() => {
    // Probe health saat mount (fetch sisi klien).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    run();
  }, [run]);

  const cfg = CFG[status];

  return (
    <div className="inline-flex items-center gap-3 rounded-full border border-surface-container-highest bg-surface-container-lowest px-3 py-1.5">
      <span className="inline-flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
        <span className={`text-label-sm font-medium ${cfg.text}`}>
          {cfg.label}
        </span>
      </span>
      <button
        type="button"
        onClick={run}
        disabled={status === "checking"}
        className="flex items-center gap-1 text-label-sm text-primary transition-colors hover:text-primary-container disabled:opacity-50"
      >
        <span
          className={`material-symbols-outlined text-[16px] ${
            status === "checking" ? "animate-spin" : ""
          }`}
        >
          refresh
        </span>
        Cek ulang
      </button>
    </div>
  );
}
