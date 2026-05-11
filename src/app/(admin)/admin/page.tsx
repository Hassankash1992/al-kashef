import { db } from "@/lib/db";
import Link from "next/link";
import {
  Users, Image, Search, CreditCard, TrendingUp,
  CheckCircle, XCircle, Clock, ArrowLeft,
} from "lucide-react";
import { PLAN_BADGE_COLOR } from "@/lib/plans";
import { formatStorage } from "@/lib/plans";

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
    { label: "إجمالي المشتركين", value: totalTenants, sub: `${activeTenants} نشط`, icon: Users, color: "indigo" },
    { label: "إيرادات الشهر", value: `${mrr.toLocaleString("ar-SA")} ر.س`, sub: `${pendingInvoices} فاتورة معلقة`, icon: CreditCard, color: "green" },
    { label: "الفعاليات", value: totalEvents, sub: "إجمالي", icon: TrendingUp, color: "purple" },
    { label: "الصور", value: totalPhotos.toLocaleString("ar-SA"), sub: "إجمالي", icon: Image, color: "orange" },
    { label: "بحث بالوجه", value: totalSearches.toLocaleString("ar-SA"), sub: "إجمالي", icon: Search, color: "pink" },
  ];

  return (
    <div className="p-8" dir="rtl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">لوحة إدارة المنصة</h1>
        <p className="text-gray-500 text-sm mt-1">نظرة شاملة على كل ما يجري في الكاشف</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {STATS.map(({ label, value, sub, icon: Icon }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <Icon className="w-5 h-5 text-indigo-400 mb-3" />
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            <p className="text-xs text-gray-400">{sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* توزيع الباقات */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-bold text-gray-800 mb-4">توزيع الباقات</h2>
          <div className="space-y-3">
            {(["STARTER", "PRO", "AGENCY"] as const).map((plan) => {
              const count = planMap[plan] ?? 0;
              const pct = totalTenants > 0 ? Math.round((count / totalTenants) * 100) : 0;
              return (
                <div key={plan}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PLAN_BADGE_COLOR[plan]}`}>
                      {plan === "STARTER" ? "مبتدئ" : plan === "PRO" ? "احترافي" : "وكالة"}
                    </span>
                    <span className="text-gray-500">{count} ({pct}%)</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full">
                    <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* آخر المشتركين */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-800">آخر المشتركين</h2>
            <Link href="/admin/tenants" className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
              عرض الكل <ArrowLeft className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {recentTenants.map((t) => (
              <Link
                key={t.id}
                href={`/admin/tenants/${t.id}`}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 font-bold text-sm flex items-center justify-center shrink-0">
                  {t.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{t.name}</p>
                  <p className="text-xs text-gray-400">{t.slug} · {t._count.events} فعالية</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${PLAN_BADGE_COLOR[t.plan as keyof typeof PLAN_BADGE_COLOR]}`}>
                    {t.plan}
                  </span>
                  {t.isActive
                    ? <CheckCircle className="w-4 h-4 text-green-400" />
                    : <XCircle className="w-4 h-4 text-red-400" />}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
