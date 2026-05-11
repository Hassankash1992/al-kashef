import { requireTenant } from "@/lib/tenant";
import { db } from "@/lib/db";
import { DEFAULT_PLAN_LIMITS } from "@/lib/plans";
import DomainManager from "@/components/dashboard/DomainManager";

export default async function DomainsPage() {
  const tenantUser = await requireTenant();
  const tenant = tenantUser.tenant;

  const planConfig = (await db.planConfig.findUnique({ where: { plan: tenant.plan as any } }))
    ?? { ...DEFAULT_PLAN_LIMITS[tenant.plan as "STARTER" | "PRO" | "AGENCY"], plan: tenant.plan };

  const domains = await db.domain.findMany({
    where: { tenantId: tenant.id },
    orderBy: { createdAt: "desc" },
  });

  const appHost = (process.env.NEXT_PUBLIC_APP_URL ?? "https://kashef.app")
    .replace(/^https?:\/\//, "");

  return (
    <div className="p-8 max-w-2xl mx-auto" dir="rtl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">الدومين المخصص</h1>
        <p className="text-gray-500 text-sm mt-1">
          اجعل المعرض يظهر تحت اسم شركتك — مثال:{" "}
          <code className="text-indigo-600 font-mono">photos.yourcompany.com</code>
        </p>
      </div>

      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 mb-6">
        <p className="text-xs font-medium text-indigo-700 mb-1">رابطك الافتراضي</p>
        <code className="text-sm text-indigo-600 font-mono" dir="ltr">
          {appHost}/g/{tenant.slug}/[event-slug]
        </code>
      </div>

      <DomainManager
        domains={domains.map((d) => ({
          id: d.id,
          domain: d.domain,
          verified: d.verified,
          status: d.status as string,
          verifyToken: d.verifyToken,
          lastChecked: d.lastChecked?.toISOString() ?? null,
        }))}
        canAddDomain={planConfig.customDomainEnabled}
        plan={tenant.plan}
        appHost={appHost}
      />
    </div>
  );
}
