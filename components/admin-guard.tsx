"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getStoredNasabah, getToken } from "@/lib/api";

/** Guard area admin: butuh token + role ADMIN.
    Tanpa token → /login; bukan admin → /dashboard. */
export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    if (getStoredNasabah()?.role !== "ADMIN") {
      router.replace("/dashboard");
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReady(true);
  }, [router]);

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
