import { redirect } from "next/navigation";
import { requireTenant } from "@/lib/tenant";
import Sidebar from "@/components/dashboard/Sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const tenantUser = await requireTenant();

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden" dir="rtl">
      <Sidebar
        tenantName={tenantUser.tenant.name}
        tenantSlug={tenantUser.tenant.slug}
      />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
