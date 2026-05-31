import { AdminGuard } from "@/components/admin-guard";
import { AdminSidebar } from "@/components/admin-sidebar";
import { AdminTopbar } from "@/components/admin-topbar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGuard>
      <div className="flex min-h-screen bg-background text-on-background">
        <AdminSidebar />
        <div className="flex min-h-screen flex-1 flex-col md:ml-64">
          <AdminTopbar />
          {children}
        </div>
      </div>
    </AdminGuard>
  );
}
