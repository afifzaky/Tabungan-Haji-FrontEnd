"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getStoredNasabah, getToken } from "@/lib/api";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    // Admin → manajemen nasabah; nasabah → dashboard.
    router.replace(
      getStoredNasabah()?.role === "ADMIN" ? "/admin/nasabah" : "/dashboard"
    );
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center text-on-surface-variant">
      <span className="material-symbols-outlined animate-spin">
        progress_activity
      </span>
    </div>
  );
}
