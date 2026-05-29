"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getStoredNasabah, logout } from "@/lib/api";

const LINKS = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Mutasi", href: "/estimasi" },
  { label: "Estimasi", href: "/estimasi" },
];

export function AppNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [inisial, setInisial] = useState("?");
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const nasabah = getStoredNasabah();
    // Inisial avatar dari sesi tersimpan (client-only) saat mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (nasabah?.nama) setInisial(nasabah.nama.charAt(0).toUpperCase());
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    await logout();
    router.replace("/login");
  }

  function isActive(href: string, label: string) {
    if (label === "Dashboard") return pathname === "/dashboard";
    if (label === "Estimasi") return pathname === "/estimasi";
    return false;
  }

  return (
    <nav className="sticky top-0 z-50 w-full bg-surface shadow-sm">
      <div className="mx-auto flex w-full max-w-[1280px] items-center justify-between px-5 py-4 md:px-16">
        <Link href="/dashboard" className="flex items-center gap-3">
          <span className="material-symbols-outlined fill-icon text-[28px] text-primary">
            mosque
          </span>
          <span className="text-headline-md font-bold text-primary">
            BSI Tabungan Haji
          </span>
        </Link>

        <div className="hidden gap-8 md:flex">
          {LINKS.map((l) => {
            const active = isActive(l.href, l.label);
            return (
              <Link
                key={l.label}
                href={l.href}
                className={
                  active
                    ? "border-b-2 border-primary pb-1 text-label-md font-bold text-primary"
                    : "text-label-md text-on-surface-variant transition-colors hover:text-primary"
                }
              >
                {l.label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-4">
          <button
            type="button"
            className="text-on-surface-variant transition-colors hover:text-primary"
            aria-label="Notifikasi"
          >
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button
            type="button"
            className="text-on-surface-variant transition-colors hover:text-primary"
            aria-label="Bantuan"
          >
            <span className="material-symbols-outlined">help_outline</span>
          </button>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-container/15 font-bold text-primary">
            {inisial}
          </div>
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="ml-2 hidden items-center gap-1 text-label-md text-on-surface-variant transition-colors hover:text-error disabled:opacity-50 md:flex"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            {loggingOut ? "Keluar..." : "Keluar"}
          </button>
        </div>
      </div>
    </nav>
  );
}
