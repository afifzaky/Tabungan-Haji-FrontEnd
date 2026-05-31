import type { Metadata } from "next";
import { AuthGuard } from "@/components/auth-guard";
import { AppNav } from "@/components/app-nav";
import { AppFooter } from "@/components/app-footer";
import { MutasiView } from "@/components/mutasi-view";

export const metadata: Metadata = {
  title: "Riwayat Mutasi — BSI Tabungan Haji",
};

export default function MutasiPage() {
  return (
    <AuthGuard role="NASABAH">
      <div className="flex min-h-screen flex-col bg-background text-on-background">
        <AppNav />
        <MutasiView />
        <AppFooter />
      </div>
    </AuthGuard>
  );
}
