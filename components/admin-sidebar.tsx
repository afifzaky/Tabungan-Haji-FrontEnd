"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { logout } from "@/lib/api";

const NAV = [
  { label: "Manajemen Nasabah", href: "/admin/nasabah", icon: "group" },
  { label: "Laporan", href: "/admin/laporan", icon: "assessment" },
  { label: "Kesehatan Sistem", href: "/health", icon: "health_and_safety" },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    await logout();
    router.replace("/login");
  }

  return (
    <nav className="fixed left-0 top-0 z-50 hidden h-screen w-64 flex-col border-r border-surface-variant bg-surface-container py-4 md:flex">
      {/* Brand */}
      <div className="mb-6 flex items-center gap-3 border-b border-surface-variant px-6 pb-6 pt-2">
        <span className="material-symbols-outlined fill-icon text-[32px] text-primary">
          mosque
        </span>
        <div>
          <h1 className="text-headline-sm font-extrabold text-primary">
            Haji Portal
          </h1>
          <p className="text-label-sm text-on-surface-variant">
            Enterprise Admin
          </p>
        </div>
      </div>

      {/* Navigasi */}
      <div className="flex-1 space-y-1 px-2">
        {NAV.map((item) => {
          const active =
            item.href === "/admin/nasabah"
              ? pathname.startsWith("/admin/nasabah")
              : pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`mx-2 flex items-center gap-3 rounded-lg px-4 py-3 transition-colors ${
                active
                  ? "bg-primary-container font-semibold text-on-primary-container"
                  : "text-on-surface-variant hover:bg-surface-container-highest"
              }`}
            >
              <span
                className={`material-symbols-outlined ${active ? "fill-icon" : ""}`}
              >
                {item.icon}
              </span>
              <span className="text-label-md">{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mx-2 mt-auto space-y-1 border-t border-surface-variant px-2 pt-4">
        <a
          href="#"
          className="flex items-center gap-3 rounded-lg px-4 py-3 text-on-surface-variant transition-colors hover:bg-surface-container-highest"
        >
          <span className="material-symbols-outlined">help</span>
          <span className="text-label-md">Bantuan</span>
        </a>
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-error transition-colors hover:bg-error-container disabled:opacity-50"
        >
          <span className="material-symbols-outlined">logout</span>
          <span className="text-label-md">
            {loggingOut ? "Keluar..." : "Keluar"}
          </span>
        </button>
      </div>
    </nav>
  );
}
