import { db } from "@/lib/db";
import { PLAN_BADGE_COLOR } from "@/lib/plans";
import { AlertTriangle, Clock, CreditCard } from "lucide-react";

export default async function AdminBillingPage() {
  const [subscriptions, invoices, overdueCount, expiringCount] = await Promise.all([
    db.subscription.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { tenant: { select: { name: true, slug: true, id: true } } },
    }),
    db.invoice.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
      include: { tenant: { select: { name: true } } },
    }),
    db.subscription.count({ where: { status: "PAST_DUE" } }),
    db.subscription.count({
      where: {
        status: "ACTIVE",
        currentPeriodEnd: {
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          gte: new Date(),
        },
      },
    }),
  ]);

  const totalRevenue = await db.invoice.aggregate({
    where: { status: "PAID" },
    _sum: { amount: true },
  });

  const monthlyRevenue = await db.invoice.aggregate({
    where: {
      status: "PAID",
      paidAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
    },
    _sum: { amount: true },
  });

  const STATUS_STYLES: Record<string, string> = {
    ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
    TRIALING: "bg-blue-50 text-blue-700 border-blue-200",
    PAST_DUE: "bg-red-50 text-red-700 border-red-200",
    CANCELLED: "bg-zinc-100 text-zinc-600 border-zinc-200",
    EXPIRED: "bg-zinc-100 text-zinc-500 border-zinc-200",
  };

  const STATUS_LABELS: Record<string, string> = {
    ACTIVE: "نشط", TRIALING: "تجريبي", PAST_DUE: "متأخر", CANCELLED: "ملغي", EXPIRED: "منتهي",
  };

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto" dir="rtl">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">الفوترة والاشتراكات</h1>
        <p className="text-zinc-500 text-sm mt-1">نظرة عامة على إيرادات المنصة</p>
      </div>

      {/* Alerts */}
      {(overdueCount > 0 || expiringCount > 0) && (
        <div className="flex flex-wrap gap-3 mb-6">
          {overdueCount > 0 && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-800">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span><strong className="font-bold">{overdueCount}</strong> اشتراك متأخر عن الدفع</span>
            </div>
          )}
          {expiringCount > 0 && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
              <Clock className="w-4 h-4 shrink-0" />
              <span><strong className="font-bold">{expiringCount}</strong> اشتراك ينتهي خلال 7 أيام</span>
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <RevenueCard label="إجمالي الإيرادات" value={(totalRevenue._sum.amount ?? 0).toLocaleString("ar-SA")} suffix="ر.س" />
        <RevenueCard label="إيرادات هذا الشهر" value={(monthlyRevenue._sum.amount ?? 0).toLocaleString("ar-SA")} suffix="ر.س" highlight />
        <RevenueCard label="اشتراكات نشطة" value={subscriptions.filter((s) => s.status === "ACTIVE").length} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        {/* Subscriptions */}
        <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100">
            <h2 className="font-bold text-zinc-900">الاشتراكات</h2>
          </div>
          <div className="divide-y divide-zinc-50 max-h-[600px] overflow-y-auto">
            {subscriptions.length === 0 ? (
              <div className="py-12 text-center text-zinc-500 text-sm">لا توجد اشتراكات بعد</div>
            ) : subscriptions.map((s) => {
              const expiring =
                s.currentPeriodEnd &&
                new Date(s.currentPeriodEnd) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) &&
                s.status === "ACTIVE";
              return (
                <div key={s.id} className={`flex items-center gap-3 px-5 py-3.5 ${expiring ? "bg-amber-50/50" : ""}`}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-zinc-900 truncate">{s.tenant.name}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${PLAN_BADGE_COLOR[s.plan as keyof typeof PLAN_BADGE_COLOR]}`}>
                        {s.plan}
                      </span>
                      {s.currentPeriodEnd && (
                        <span className={`text-xs flex items-center gap-1 ${expiring ? "text-red-600 font-bold" : "text-zinc-500"}`}>
                          {expiring && <AlertTriangle className="w-3 h-3" />}
                          {new Date(s.currentPeriodEnd).toLocaleDateString("ar-SA")}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold border shrink-0 ${STATUS_STYLES[s.status]}`}>
                    {STATUS_LABELS[s.status] ?? s.status}
                  </span>
                  <span className="text-sm font-bold text-zinc-900 shrink-0">
                    {s.amount > 0 ? `${s.amount} ${s.currency}` : "مجاني"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Invoices */}
        <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100">
            <h2 className="font-bold text-zinc-900">آخر الفواتير</h2>
          </div>
          <div className="divide-y divide-zinc-50 max-h-[600px] overflow-y-auto">
            {invoices.length === 0 ? (
              <div className="py-12 text-center text-zinc-500 text-sm">لا توجد فواتير بعد</div>
            ) : invoices.map((inv) => (
              <div key={inv.id} className="flex items-center gap-3 px-5 py-3.5">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-zinc-900 truncate">{inv.tenant.name}</p>
                  <p className="text-xs text-zinc-500 mt-0.5 truncate">{inv.description || "اشتراك"}</p>
                </div>
                <span className="text-sm font-bold text-zinc-900 shrink-0">{inv.amount} {inv.currency}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold border shrink-0 ${
                  inv.status === "PAID" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                  inv.status === "FAILED" ? "bg-red-50 text-red-700 border-red-200" :
                  "bg-amber-50 text-amber-700 border-amber-200"
                }`}>
                  {inv.status === "PAID" ? "مدفوعة" : inv.status === "FAILED" ? "فاشلة" : "معلقة"}
                </span>
                <span className="text-xs text-zinc-400 shrink-0">
                  {new Date(inv.createdAt).toLocaleDateString("ar-SA")}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function RevenueCard({ label, value, suffix, highlight }: { label: string; value: any; suffix?: string; highlight?: boolean }) {
  return (
    <div className={`relative rounded-2xl border shadow-sm p-5 sm:p-6 overflow-hidden ${
      highlight
        ? "bg-gradient-to-br from-zinc-950 via-zinc-900 to-black border-zinc-900 text-white"
        : "bg-white border-zinc-100 text-zinc-900"
    }`}>
      {highlight && (
        <div className="absolute top-0 left-0 w-32 h-32 bg-amber-500/15 rounded-full blur-3xl" />
      )}
      <div className="relative">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2.5 ${
          highlight
            ? "bg-amber-400/20 border border-amber-400/30"
            : "bg-gradient-to-br from-amber-100 to-amber-50 border border-amber-200"
        }`}>
          <CreditCard className={`w-4 h-4 ${highlight ? "text-amber-400" : "text-amber-600"}`} />
        </div>
        <p className="text-2xl sm:text-3xl font-bold tracking-tight">
          {value} {suffix && <span className={`text-sm font-normal ${highlight ? "text-zinc-400" : "text-zinc-500"}`}>{suffix}</span>}
        </p>
        <p className={`text-xs mt-1 font-medium ${highlight ? "text-amber-400/80" : "text-zinc-500"}`}>{label}</p>
      </div>
    </div>
  );
}
