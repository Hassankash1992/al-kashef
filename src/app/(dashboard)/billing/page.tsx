import { requireTenant } from "@/lib/tenant";
import { db } from "@/lib/db";
import { DEFAULT_PLAN_LIMITS, formatStorage, storagePercent, PLAN_BADGE_COLOR } from "@/lib/plans";
import { CheckCircle, AlertCircle, CreditCard, Zap } from "lucide-react";

export default async function BillingPage() {
  const tenantUser = await requireTenant();
  const tenant = tenantUser.tenant;

  const planKey = tenant.plan as "STARTER" | "PRO" | "AGENCY";
  const planConfig = (await db.planConfig.findUnique({ where: { plan: tenant.plan as any } }))
    ?? { ...DEFAULT_PLAN_LIMITS[planKey], plan: tenant.plan };

  const [activeSub, invoices, eventCount, photoCount] = await Promise.all([
    db.subscription.findFirst({
      where: { tenantId: tenant.id, status: { in: ["ACTIVE", "TRIALING", "PAST_DUE"] } },
      orderBy: { createdAt: "desc" },
    }),
    db.invoice.findMany({
      where: { tenantId: tenant.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    db.event.count({ where: { tenantId: tenant.id } }),
    db.photo.count({ where: { tenantId: tenant.id, status: { not: "DELETED" } } }),
  ]);

  const adminMessages = await db.adminMessage.findMany({
    where: { tenantId: tenant.id },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const storageUsed = Number(tenant.storageUsedBytes);
  const storageMax = planConfig.maxStorageGB;
  const storagePct = storagePercent(storageUsed, storageMax);

  const PLAN_FEATURES: Record<string, string[]> = {
    STARTER: ["3 فعاليات", "300 صورة/فعالية", "5GB تخزين", "معرض عام للضيوف"],
    PRO: ["20 فعالية", "2000 صورة/فعالية", "50GB تخزين", "بحث بالوجه (Rekognition)", "دومين مخصص", "5 أعضاء"],
    AGENCY: ["فعاليات غير محدودة", "صور غير محدودة", "تخزين غير محدود", "كل مميزات PRO", "أعضاء غير محدودين"],
  };

  return (
    <div className="p-8 max-w-3xl mx-auto" dir="rtl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">الاشتراك والفوترة</h1>
      </div>

      {/* الباقة الحالية */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-xs text-gray-400 mb-1">باقتك الحالية</p>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-gray-900">{planConfig.displayName || planKey}</h2>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${PLAN_BADGE_COLOR[planKey]}`}>
                {planKey}
              </span>
            </div>
          </div>
          {activeSub && (
            <div className="text-left">
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                activeSub.status === "ACTIVE" ? "bg-green-100 text-green-700" :
                activeSub.status === "PAST_DUE" ? "bg-red-100 text-red-600" :
                "bg-blue-100 text-blue-700"
              }`}>
                {activeSub.status === "ACTIVE" ? "نشط" :
                 activeSub.status === "PAST_DUE" ? "متأخر" : "تجريبي"}
              </span>
              {activeSub.amount > 0 && (
                <p className="text-xs text-gray-400 mt-1">
                  {activeSub.amount} {activeSub.currency}/{activeSub.billingCycle === "MONTHLY" ? "شهر" : "سنة"}
                </p>
              )}
              {activeSub.currentPeriodEnd && (
                <p className="text-xs text-gray-400 mt-0.5">
                  يتجدد {new Date(activeSub.currentPeriodEnd).toLocaleDateString("ar-SA")}
                </p>
              )}
            </div>
          )}
        </div>

        {/* الميزات */}
        <div className="grid grid-cols-2 gap-1.5 mb-6">
          {(PLAN_FEATURES[planKey] ?? []).map((feat) => (
            <div key={feat} className="flex items-center gap-1.5 text-sm text-gray-600">
              <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />
              {feat}
            </div>
          ))}
        </div>

        {/* الاستخدام */}
        <div className="space-y-3 pt-4 border-t border-gray-50">
          <p className="text-xs font-semibold text-gray-500 mb-3">الاستخدام الحالي</p>

          <UsageBar
            label="الفعاليات"
            current={eventCount}
            max={planConfig.maxEvents}
            unit="فعالية"
          />
          <UsageBar
            label="التخزين"
            current={storagePct}
            max={100}
            unit="%"
            displayCurrent={formatStorage(storageUsed)}
            displayMax={storageMax === -1 ? "∞" : `${storageMax}GB`}
          />
        </div>

        {/* ترقية */}
        {planKey !== "AGENCY" && (
          <div className="mt-5 pt-5 border-t border-gray-50">
            <p className="text-sm text-gray-600 mb-3">للحصول على مزيد من الإمكانيات:</p>
            <a
              href="mailto:support@kashef.app?subject=طلب ترقية الباقة"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
            >
              <Zap className="w-4 h-4" />
              ترقية الباقة
            </a>
          </div>
        )}
      </div>

      {/* الفواتير */}
      {invoices.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-gray-400" /> الفواتير
          </h2>
          <div className="divide-y divide-gray-50">
            {invoices.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm text-gray-700">{inv.description || "اشتراك"}</p>
                  <p className="text-xs text-gray-400">{new Date(inv.createdAt).toLocaleDateString("ar-SA")}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-800">{inv.amount} {inv.currency}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    inv.status === "PAID" ? "bg-green-100 text-green-700" :
                    inv.status === "FAILED" ? "bg-red-100 text-red-600" :
                    "bg-amber-100 text-amber-700"
                  }`}>
                    {inv.status === "PAID" ? "مدفوعة" : inv.status === "FAILED" ? "فاشلة" : "معلقة"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* رسائل الأدمن */}
      {adminMessages.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-bold text-gray-800 mb-4">رسائل من الدعم</h2>
          <div className="space-y-3">
            {adminMessages.map((m) => (
              <div key={m.id} className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span className="font-semibold text-gray-800">{m.subject}</span>
                  <span>{new Date(m.createdAt).toLocaleDateString("ar-SA")}</span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{m.body}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function UsageBar({
  label, current, max, unit, displayCurrent, displayMax,
}: {
  label: string;
  current: number;
  max: number;
  unit: string;
  displayCurrent?: string;
  displayMax?: string;
}) {
  const isUnlimited = max === -1;
  const pct = isUnlimited ? 0 : Math.min(100, Math.round((current / max) * 100));
  const isWarning = pct >= 80;
  const isDanger = pct >= 95;

  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-600">{label}</span>
        <span className={isDanger ? "text-red-600 font-medium" : isWarning ? "text-amber-600" : "text-gray-400"}>
          {displayCurrent ?? current} / {displayMax ?? (isUnlimited ? "∞" : `${max} ${unit}`)}
          {isWarning && !isUnlimited && <AlertCircle className="inline w-3 h-3 mr-1" />}
        </span>
      </div>
      {!isUnlimited && (
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${isDanger ? "bg-red-500" : isWarning ? "bg-amber-400" : "bg-indigo-500"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}
