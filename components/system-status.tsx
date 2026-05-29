"use client";

import { useEffect, useState } from "react";
import { checkHealth } from "@/lib/api";

type Status = "checking" | "online" | "offline";

const CFG: Record<Status, { label: string; dot: string; text: string }> = {
  checking: {
    label: "Mengecek sistem...",
    dot: "bg-outline-variant animate-pulse",
    text: "text-on-surface-variant",
  },
  online: {
    label: "Sistem Online & Aman",
    dot: "bg-emerald-500 animate-pulse",
    text: "text-on-surface-variant",
  },
  offline: {
    label: "Sistem Tidak Tersedia",
    dot: "bg-error",
    text: "text-error",
  },
};

export function SystemStatus() {
  const [status, setStatus] = useState<Status>("checking");

  useEffect(() => {
    let active = true;
    checkHealth().then((ok) => {
      if (active) setStatus(ok ? "online" : "offline");
    });
    return () => {
      active = false;
    };
  }, []);

  const cfg = CFG[status];

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-surface-container-highest bg-surface-container px-3 py-1.5">
      <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
      <span
        className={`font-sans text-label-sm tracking-wide ${cfg.text}`}
      >
        {cfg.label}
      </span>
    </div>
  );
}
