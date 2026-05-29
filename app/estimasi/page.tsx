import type { Metadata } from "next";
import { AuthGuard } from "@/components/auth-guard";
import { AppNav } from "@/components/app-nav";
import { AppFooter } from "@/components/app-footer";
import { EstimasiView } from "@/components/estimasi-view";

export const metadata: Metadata = {
  title: "Estimasi & Mutasi — BSI Tabungan Haji",
};

export default function EstimasiPage() {
  return (
    <AuthGuard>
      <div className="flex min-h-screen flex-col bg-surface text-on-surface">
        <AppNav />
        <EstimasiView />
        <AppFooter />
      </div>
    </AuthGuard>
  );
}
