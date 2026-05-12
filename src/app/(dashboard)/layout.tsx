import { requireTenant } from "@/lib/tenant";
import Sidebar from "@/components/dashboard/Sidebar";
import SupportWidget from "@/components/support/SupportWidget";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const tenantUser = await requireTenant();

  return (
    <div className="flex h-screen bg-zinc-50 overflow-hidden" dir="rtl">
      <Sidebar
        tenantName={tenantUser.tenant.name}
        tenantSlug={tenantUser.tenant.slug}
      />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
      <SupportWidget />
    </div>
  );
}
