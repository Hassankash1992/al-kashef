import { db } from "@/lib/db";
import { PLAN_BADGE_COLOR } from "@/lib/plans";
import { AlertTriangle, CheckCircle, XCircle, Clock } from "lucide-react";

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
    db.subscription.count({
      where: { status: "PAST_DUE" },
    }),
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

  const STATUS_COLORS: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-700",
    TRIALING: "bg-blue-100 text-blue-700",
    PAST_DUE: "bg-red-100 text-red-600",
    CANCELLED: "bg-gray-100 text-gray-500",
    EXPIRED: "bg-gray-100 text-gray-400",
  };

  const STATUS_LABELS: Record<string, string> = {
    ACTIVE: "نشط",
    TRIALING: "تجريبي",
    PAST_DUE: "متأخر",
    CANCELLED: "ملغي",
    EXPIRED: "منتهي",
  };

  return (
    <div className="p-8" dir="rtl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">الفوترة والاشتراكات</h1>
      </div>

      {/* Alerts */}
      {(overdueCount > 0 || expiringCount > 0) && (
        <div className="flex gap-4 mb-6">
          {overdueCount > 0 && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-700">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span><strong>{overdueCount}</strong> اشتراك متأخر عن الدفع</span>
            </div>
          )}
          {expiringCount > 0 && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-sm text-amber-700">
              <Clock className="w-4 h-4 shrink-0" />
              <span><strong>{expiringCount}</strong> اشتراك ينتهي خلال 7 أيام</span>
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs text-gray-400 mb-1">إجمالي الإيرادات</p>
          <p className="text-2xl font-bold text-gray-900">{(totalRevenue._sum.amount ?? 0).toLocaleString("ar-SA")} ر.س</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs text-gray-400 mb-1">إيرادات هذا الشهر</p>
          <p className="text-2xl font-bold text-green-600">{(monthlyRevenue._sum.amount ?? 0).toLocaleString("ar-SA")} ر.س</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs text-gray-400 mb-1">اشتراكات نشطة</p>
          <p className="text-2xl font-bold text-indigo-600">
            {subscriptions.filter((s) => s.status === "ACTIVE").length}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* الاشتراكات */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50">
            <h2 className="font-bold text-gray-800">الاشتراكات</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {subscriptions.map((s) => {
              const expiring =
                s.currentPeriodEnd &&
                new Date(s.currentPeriodEnd) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) &&
                s.status === "ACTIVE";
              return (
                <div key={s.id} className={`flex items-center gap-3 px-5 py-3.5 ${expiring ? "bg-amber-50" : ""}`}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{s.tenant.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${PLAN_BADGE_COLOR[s.plan as keyof typeof PLAN_BADGE_COLOR]}`}>
                        {s.plan}
                      </span>
                      {s.currentPeriodEnd && (
                        <span className={`text-xs ${expiring ? "text-amber-600 font-medium" : "text-gray-400"}`}>
                          {expiring ? "⚠ " : ""}
                          ينتهي {new Date(s.currentPeriodEnd).toLocaleDateString("ar-SA")}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[s.status] ?? ""}`}>
                    {STATUS_LABELS[s.status] ?? s.status}
                  </span>
                  <span className="text-sm font-semibold text-gray-700 shrink-0">
                    {s.amount > 0 ? `${s.amount} ${s.currency}` : "مجاني"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* الفواتير */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50">
            <h2 className="font-bold text-gray-800">آخر الفواتير</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {invoices.map((inv) => (
              <div key={inv.id} className="flex items-center gap-3 px-5 py-3.5">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{inv.tenant.name}</p>
                  <p className="text-xs text-gray-400">{inv.description || "اشتراك"}</p>
                </div>
                <span className="text-sm font-semibold text-gray-800">{inv.amount} {inv.currency}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  inv.status === "PAID" ? "bg-green-100 text-green-700" :
                  inv.status === "FAILED" ? "bg-red-100 text-red-600" :
                  "bg-amber-100 text-amber-700"
                }`}>
                  {inv.status === "PAID" ? "مدفوعة" : inv.status === "FAILED" ? "فاشلة" : "معلقة"}
                </span>
                <span className="text-xs text-gray-400 shrink-0">
                  {new Date(inv.createdAt).toLocaleDateString("ar-SA")}
                </span>
              </div>
            ))}
            {invoices.length === 0 && (
              <div className="py-10 text-center text-gray-400 text-sm">لا توجد فواتير بعد</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
