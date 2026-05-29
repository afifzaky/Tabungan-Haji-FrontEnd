import type { Metadata } from "next";
import { AuthGuard } from "@/components/auth-guard";
import { AppNav } from "@/components/app-nav";
import { AppFooter } from "@/components/app-footer";
import { DashboardView } from "@/components/dashboard-view";

export const metadata: Metadata = {
  title: "Dashboard — BSI Tabungan Haji",
};

export default function DashboardPage() {
  return (
    <AuthGuard>
      <div className="flex min-h-screen flex-col bg-background text-on-background">
        <AppNav />
        <DashboardView />
        <AppFooter />
      </div>
    </AuthGuard>
  );
}
