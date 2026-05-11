import { requireTenant } from "@/lib/tenant";
import { db } from "@/lib/db";
import { DEFAULT_PLAN_LIMITS, formatStorage, storagePercent } from "@/lib/plans";
import { CheckCircle, AlertCircle, CreditCard, Zap, Mail } from "lucide-react";

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

  const PLAN_LABELS: Record<string, string> = {
    STARTER: "مبتدئ",
    PRO: "احترافي",
    AGENCY: "وكالة",
  };

  const PLAN_FEATURES: Record<string, string[]> = {
    STARTER: ["3 فعاليات", "300 صورة/فعالية", "5GB تخزين", "معرض عام للضيوف"],
    PRO: ["20 فعالية", "2000 صورة/فعالية", "50GB تخزين", "بحث بالوجه (Rekognition)", "دومين مخصص", "5 أعضاء"],
    AGENCY: ["فعاليات غير محدودة", "صور غير محدودة", "تخزين غير محدود", "كل مميزات Pro", "أعضاء غير محدودين"],
  };

  return (
    <div className="p-6 sm:p-8 max-w-3xl mx-auto" dir="rtl">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">الاشتراك والفوترة</h1>
        <p className="text-zinc-500 text-sm mt-1">إدارة باقتك والفواتير</p>
      </div>

      {/* Plan card */}
      <div className="relative bg-gradient-to-br from-zinc-950 via-zinc-900 to-black rounded-2xl shadow-2xl p-6 sm:p-7 mb-6 overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-yellow-600/10 rounded-full blur-3xl" />

        <div className="relative">
          <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
            <div>
              <p className="text-xs text-amber-400/80 font-semibold mb-1">باقتك الحالية</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">{PLAN_LABELS[planKey] ?? planKey}</h2>
            </div>
            {activeSub && (
              <div className="text-left">
                <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${
                  activeSub.status === "ACTIVE" ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30" :
                  activeSub.status === "PAST_DUE" ? "bg-red-500/10 text-red-300 border-red-500/30" :
                  "bg-blue-500/10 text-blue-300 border-blue-500/30"
                }`}>
                  {activeSub.status === "ACTIVE" ? "نشط" :
                   activeSub.status === "PAST_DUE" ? "متأخر" : "تجريبي"}
                </span>
                {activeSub.amount > 0 && (
                  <p className="text-xs text-zinc-400 mt-1.5">
                    {activeSub.amount} {activeSub.currency}/{activeSub.billingCycle === "MONTHLY" ? "شهر" : "سنة"}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
            {(PLAN_FEATURES[planKey] ?? []).map((feat) => (
              <div key={feat} className="flex items-center gap-2 text-sm text-zinc-300">
                <CheckCircle className="w-4 h-4 text-amber-400 shrink-0" strokeWidth={2.5} />
                {feat}
              </div>
            ))}
          </div>

          {/* Usage */}
          <div className="space-y-4 pt-5 border-t border-white/10">
            <p className="text-xs font-bold text-amber-400/80 uppercase tracking-wider">الاستخدام الحالي</p>

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

          {planKey !== "AGENCY" && (
            <div className="mt-6 pt-5 border-t border-white/10">
              <a
                href="mailto:support@kashef.app?subject=طلب ترقية الباقة"
                className="inline-flex items-center gap-2 bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-700 hover:from-amber-200 hover:via-yellow-400 hover:to-amber-600 text-black px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-amber-500/30"
              >
                <Zap className="w-4 h-4" strokeWidth={3} />
                ترقية الباقة
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Invoices */}
      {invoices.length > 0 && (
        <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-5 sm:p-6 mb-6">
          <h2 className="font-bold text-zinc-900 mb-4 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-amber-600" /> الفواتير
          </h2>
          <div className="divide-y divide-zinc-50">
            {invoices.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between py-3 gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-zinc-900 truncate">{inv.description || "اشتراك"}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{new Date(inv.createdAt).toLocaleDateString("ar-SA")}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm font-bold text-zinc-900">{inv.amount} {inv.currency}</span>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${
                    inv.status === "PAID" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                    inv.status === "FAILED" ? "bg-red-50 text-red-700 border-red-200" :
                    "bg-amber-50 text-amber-700 border-amber-200"
                  }`}>
                    {inv.status === "PAID" ? "مدفوعة" : inv.status === "FAILED" ? "فاشلة" : "معلقة"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Admin messages */}
      {adminMessages.length > 0 && (
        <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-5 sm:p-6">
          <h2 className="font-bold text-zinc-900 mb-4 flex items-center gap-2">
            <Mail className="w-4 h-4 text-amber-600" /> رسائل من الدعم
          </h2>
          <div className="space-y-3">
            {adminMessages.map((m) => (
              <div key={m.id} className="bg-amber-50/50 border border-amber-200 rounded-xl p-4">
                <div className="flex justify-between text-xs mb-1.5 gap-2">
                  <span className="font-bold text-zinc-900">{m.subject}</span>
                  <span className="text-zinc-500 shrink-0">{new Date(m.createdAt).toLocaleDateString("ar-SA")}</span>
                </div>
                <p className="text-sm text-zinc-700 leading-relaxed">{m.body}</p>
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
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-zinc-300 font-medium">{label}</span>
        <span className={`font-semibold ${isDanger ? "text-red-300" : isWarning ? "text-amber-300" : "text-zinc-400"}`}>
          {displayCurrent ?? current} / {displayMax ?? (isUnlimited ? "∞" : `${max} ${unit}`)}
          {isWarning && !isUnlimited && <AlertCircle className="inline w-3 h-3 mr-1" />}
        </span>
      </div>
      {!isUnlimited && (
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              isDanger ? "bg-red-400" :
              isWarning ? "bg-amber-400" :
              "bg-gradient-to-l from-amber-300 via-yellow-500 to-amber-700"
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}
