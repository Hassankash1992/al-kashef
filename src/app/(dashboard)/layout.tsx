import { requireTenant } from "@/lib/tenant";
import Sidebar from "@/components/dashboard/Sidebar";
import MobileMenuButton from "@/components/dashboard/MobileMenuButton";
import SupportWidget from "@/components/support/SupportWidget";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const tenantUser = await requireTenant();

  return (
    <div className="flex flex-col lg:flex-row min-h-screen lg:h-screen bg-zinc-50 lg:overflow-hidden" dir="rtl">
      <MobileMenuButton tenantName={tenantUser.tenant.name} tenantSlug={tenantUser.tenant.slug} />
      <Sidebar tenantName={tenantUser.tenant.name} tenantSlug={tenantUser.tenant.slug} />
      <main className="flex-1 lg:overflow-y-auto">{children}</main>
      <SupportWidget />
    </div>
  );
}
