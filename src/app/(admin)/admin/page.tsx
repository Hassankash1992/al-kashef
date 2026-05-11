import { db } from "@/lib/db";
import Link from "next/link";
import {
  Users, Image as ImageIcon, Search, CreditCard, TrendingUp,
  CheckCircle, XCircle, ArrowLeft,
} from "lucide-react";
import { PLAN_BADGE_COLOR } from "@/lib/plans";

export default async function AdminDashboardPage() {
  const [
    totalTenants, activeTenants, totalEvents, totalPhotos,
    totalSearches, recentTenants, planCounts, monthlyRevenue, pendingInvoices,
  ] = await Promise.all([
    db.tenant.count(),
    db.tenant.count({ where: { isActive: true } }),
    db.event.count(),
    db.photo.count({ where: { status: { not: "DELETED" } } }),
    db.faceSearch.count(),
    db.tenant.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true, name: true, slug: true, plan: true, isActive: true, createdAt: true,
        storageUsedBytes: true,
        _count: { select: { events: true } },
        subscriptions: {
          where: { status: { in: ["ACTIVE", "TRIALING"] } },
          select: { currentPeriodEnd: true, amount: true },
          take: 1, orderBy: { createdAt: "desc" },
        },
      },
    }),
    db.tenant.groupBy({ by: ["plan"], _count: { plan: true } }),
    db.invoice.aggregate({
      where: {
        status: "PAID",
        paidAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
      },
      _sum: { amount: true },
    }),
    db.invoice.count({ where: { status: "PENDING" } }),
  ]);

  const planMap = Object.fromEntries(planCounts.map((p) => [p.plan, p._count.plan]));
  const mrr = monthlyRevenue._sum.amount ?? 0;

  const STATS = [
    { label: "إجمالي المشتركين", value: totalTenants, sub: `${activeTenants} نشط`, icon: Users },
    { label: "إيرادات الشهر", value: `${mrr.toLocaleString("ar-SA")} ر.س`, sub: `${pendingInvoices} فاتورة معلقة`, icon: CreditCard },
    { label: "الفعاليات", value: totalEvents, sub: "إجمالي", icon: TrendingUp },
    { label: "الصور", value: totalPhotos.toLocaleString("ar-SA"), sub: "إجمالي", icon: ImageIcon },
    { label: "بحث بالوجه", value: totalSearches.toLocaleString("ar-SA"), sub: "إجمالي", icon: Search },
  ];

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto" dir="rtl">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">لوحة إدارة المنصة</h1>
        <p className="text-zinc-500 text-sm mt-1">نظرة شاملة على كل ما يجري في EventFace</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {STATS.map(({ label, value, sub, icon: Icon }) => (
          <div
            key={label}
            className="relative bg-white rounded-2xl border border-zinc-100 shadow-sm p-4 sm:p-5 overflow-hidden group hover:shadow-md hover:border-amber-200 transition-all"
          >
            <div className="absolute top-0 left-0 w-24 h-24 bg-amber-400/5 rounded-full blur-2xl group-hover:bg-amber-400/10 transition-colors" />
            <div className="relative">
              <div className="w-9 h-9 bg-gradient-to-br from-amber-100 to-amber-50 border border-amber-200 rounded-lg flex items-center justify-center mb-2.5">
                <Icon className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">{value}</p>
              <p className="text-xs text-zinc-700 font-medium mt-0.5">{label}</p>
              <p className="text-[11px] text-zinc-400 mt-0.5">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Plan distribution */}
        <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-5 sm:p-6">
          <h2 className="font-bold text-zinc-900 mb-4">توزيع الباقات</h2>
          <div className="space-y-4">
            {(["STARTER", "PRO", "AGENCY"] as const).map((plan) => {
              const count = planMap[plan] ?? 0;
              const pct = totalTenants > 0 ? Math.round((count / totalTenants) * 100) : 0;
              return (
                <div key={plan}>
                  <div className="flex justify-between items-center text-sm mb-1.5">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${PLAN_BADGE_COLOR[plan]}`}>
                      {plan === "STARTER" ? "مبتدئ" : plan === "PRO" ? "احترافي" : "وكالة"}
                    </span>
                    <span className="text-zinc-700 font-semibold">{count} <span className="text-zinc-400 font-normal">({pct}%)</span></span>
                  </div>
                  <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-l from-amber-300 via-yellow-500 to-amber-700 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent tenants */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-zinc-100 shadow-sm p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-zinc-900">آخر المشتركين</h2>
            <Link href="/admin/tenants" className="text-xs text-amber-600 hover:text-amber-700 font-semibold flex items-center gap-1 transition-colors">
              عرض الكل <ArrowLeft className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-1">
            {recentTenants.length === 0 ? (
              <p className="text-zinc-400 text-sm text-center py-8">لا يوجد مشتركون بعد</p>
            ) : recentTenants.map((t) => (
              <Link
                key={t.id}
                href={`/admin/tenants/${t.id}`}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-50 transition-colors group"
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-100 to-amber-50 border border-amber-200 text-amber-700 font-bold text-sm flex items-center justify-center shrink-0">
                  {t.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-zinc-900 truncate group-hover:text-amber-700 transition-colors">{t.name}</p>
                  <p className="text-xs text-zinc-500">@{t.slug} · {t._count.events} فعالية</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${PLAN_BADGE_COLOR[t.plan as keyof typeof PLAN_BADGE_COLOR]}`}>
                    {t.plan}
                  </span>
                  {t.isActive
                    ? <CheckCircle className="w-4 h-4 text-emerald-500" />
                    : <XCircle className="w-4 h-4 text-red-500" />}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
