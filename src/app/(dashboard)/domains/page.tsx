import { requireTenant } from "@/lib/tenant";
import { db } from "@/lib/db";
import { DEFAULT_PLAN_LIMITS } from "@/lib/plans";
import DomainManager from "@/components/dashboard/DomainManager";
import { Globe } from "lucide-react";

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
    <div className="p-6 sm:p-8 max-w-3xl mx-auto" dir="rtl">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">الدومين المخصص</h1>
        <p className="text-zinc-500 text-sm mt-1.5 leading-relaxed">
          اجعل معرض الصور يظهر تحت اسم شركتك — مثال:{" "}
          <code className="text-amber-700 font-mono bg-amber-50 px-1.5 py-0.5 rounded">photos.yourcompany.com</code>
        </p>
      </div>

      {/* Default URL */}
      <div className="bg-gradient-to-l from-amber-50 to-amber-50/50 border border-amber-200 rounded-2xl p-4 sm:p-5 mb-6 flex items-start gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-700 rounded-xl flex items-center justify-center shrink-0 shadow-md">
          <Globe className="w-5 h-5 text-black" strokeWidth={2.5} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-amber-900 mb-1">رابطك الافتراضي للمعارض</p>
          <code className="text-xs sm:text-sm text-zinc-800 font-mono break-all bg-white border border-amber-200 px-2 py-1 rounded inline-block" dir="ltr">
            {appHost}/g/{tenant.slug}/[event-slug]
          </code>
        </div>
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
