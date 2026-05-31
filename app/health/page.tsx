import type { Metadata } from "next";
import { HealthView } from "@/components/health-view";

export const metadata: Metadata = {
  title: "Kesehatan Sistem — BSI Tabungan Haji",
  description:
    "Pantau status real-time API, database, dan layanan pendukung BSI Tabungan Haji.",
};

/* Halaman publik & berdiri sendiri — fokus hanya pada status API.
   Tanpa navigasi aplikasi (Dashboard/Mutasi/Estimasi) agar tidak menjadi
   jalan masuk ke area yang seharusnya butuh login. */
export default function HealthPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-on-background">
      {/* Header minimal: identitas saja, tanpa link aplikasi */}
      <header className="w-full border-b border-surface-variant bg-surface">
        <div className="mx-auto flex w-full max-w-[1280px] items-center gap-3 px-5 py-4 md:px-16">
          <span className="material-symbols-outlined fill-icon text-[28px] text-primary">
            health_and_safety
          </span>
          <div>
            <p className="text-headline-md font-bold text-primary">
              Status Sistem
            </p>
            <p className="text-label-sm text-on-surface-variant">
              BSI Tabungan Haji
            </p>
          </div>
        </div>
      </header>

      <HealthView />
    </div>
  );
}
