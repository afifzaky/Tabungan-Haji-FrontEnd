"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getStoredNasabah, getToken } from "@/lib/api";
import type { Role } from "@/lib/types";

/** Beranda default per role (juga dipakai untuk mengalihkan akses yang salah). */
function homePathFor(role: Role | undefined): string {
  if (role === "ADMIN") return "/admin/nasabah";
  if (role === "NASABAH") return "/dashboard";
  return "/login";
}

/** Gate halaman privat. Bila `role` diberikan, hanya role itu yang boleh masuk;
    role lain dialihkan ke berandanya masing-masing. */
export function AuthGuard({
  children,
  role,
}: {
  children: React.ReactNode;
  role?: Role;
}) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    const current = getStoredNasabah()?.role;
    if (role && current !== role) {
      // Role tidak sesuai dengan halaman → arahkan ke beranda role pengguna.
      router.replace(homePathFor(current));
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReady(true);
  }, [router, role]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center text-on-surface-variant">
        <span className="material-symbols-outlined animate-spin">
          progress_activity
        </span>
      </div>
    );
  }

  return <>{children}</>;
}
