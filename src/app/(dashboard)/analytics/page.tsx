import { requireTenant } from "@/lib/tenant";
import { db } from "@/lib/db";
import { BarChart2, TrendingUp, Search, Eye } from "lucide-react";

export default async function AnalyticsPage() {
  const tenantUser = await requireTenant();
  const tenantId = tenantUser.tenant.id;

  const [totalEvents, totalPhotos, totalSearches, topEvents] = await Promise.all([
    db.event.count({ where: { tenantId } }),
    db.photo.count({ where: { tenantId, status: { not: "DELETED" } } }),
    db.faceSearch.count({ where: { tenantId } }),
    db.event.findMany({
      where: { tenantId },
      select: {
        id: true, name: true,
        _count: { select: { faceSearches: true, photos: true } },
      },
      orderBy: { faceSearches: { _count: "desc" } },
      take: 5,
    }),
  ]);

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto" dir="rtl">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">التقارير والتحليلات</h1>
        <p className="text-zinc-500 text-sm mt-1">إجمالي نشاط حسابك على المنصة</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-8">
        <StatCard icon={BarChart2} label="الفعاليات" value={totalEvents} />
        <StatCard icon={Eye} label="الصور" value={totalPhotos.toLocaleString("ar-SA")} />
        <StatCard icon={Search} label="بحث بالوجه" value={totalSearches.toLocaleString("ar-SA")} />
        <StatCard
          icon={TrendingUp}
          label="معدل البحث/فعالية"
          value={totalEvents > 0 ? Math.round(totalSearches / totalEvents) : 0}
        />
      </div>

      <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
        <div className="px-5 sm:px-6 py-4 border-b border-zinc-100">
          <h2 className="font-bold text-zinc-900">أكثر الفعاليات نشاطاً</h2>
        </div>
        {topEvents.length === 0 ? (
          <div className="py-16 text-center">
            <div className="inline-flex w-14 h-14 bg-zinc-100 rounded-2xl items-center justify-center mb-3">
              <BarChart2 className="w-6 h-6 text-zinc-400" />
            </div>
            <p className="text-zinc-700 font-semibold text-sm">لا توجد بيانات بعد</p>
            <p className="text-zinc-500 text-xs mt-1">ستظهر التقارير بعد إنشاء فعالياتك</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-50">
            {topEvents.map((event, i) => (
              <div key={event.id} className="flex items-center gap-4 px-5 sm:px-6 py-4 hover:bg-zinc-50 transition-colors">
                <div className="w-8 h-8 bg-zinc-100 rounded-lg flex items-center justify-center text-zinc-700 font-bold text-xs shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-zinc-900 text-sm truncate">{event.name}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{event._count.photos} صورة</p>
                </div>
                <div className="text-left shrink-0">
                  <p className="text-base font-bold text-amber-600">{event._count.faceSearches}</p>
                  <p className="text-[10px] text-zinc-400">بحث</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: any }) {
  return (
    <div className="relative bg-white rounded-2xl border border-zinc-100 shadow-sm p-4 sm:p-5 overflow-hidden group hover:shadow-md hover:border-amber-200 transition-all">
      <div className="absolute top-0 left-0 w-24 h-24 bg-amber-400/5 rounded-full blur-2xl" />
      <div className="relative">
        <div className="w-9 h-9 bg-gradient-to-br from-amber-100 to-amber-50 border border-amber-200 rounded-lg flex items-center justify-center mb-2.5">
          <Icon className="w-4 h-4 text-amber-600" />
        </div>
        <p className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">{value}</p>
        <p className="text-xs text-zinc-500 mt-1">{label}</p>
      </div>
    </div>
  );
}
