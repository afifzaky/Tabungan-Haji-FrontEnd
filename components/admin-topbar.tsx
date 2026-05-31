"use client";

import { useEffect, useState } from "react";
import { getStoredNasabah } from "@/lib/api";

export function AdminTopbar() {
  const [inisial, setInisial] = useState("AD");

  useEffect(() => {
    const nasabah = getStoredNasabah();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (nasabah?.nama) setInisial(nasabah.nama.charAt(0).toUpperCase());
  }, []);

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-surface-variant bg-surface-container-lowest px-6 shadow-sm">
      <span className="text-headline-md font-bold text-primary">
        BSI Haji Admin
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Notifikasi"
          className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container"
        >
          <span className="material-symbols-outlined">notifications</span>
        </button>
        <button
          type="button"
          aria-label="Pengaturan"
          className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container"
        >
          <span className="material-symbols-outlined">settings</span>
        </button>
        <div className="ml-2 flex h-8 w-8 items-center justify-center rounded-full border border-primary/20 bg-primary-container font-bold text-on-primary-container">
          {inisial}
        </div>
      </div>
    </header>
  );
}
