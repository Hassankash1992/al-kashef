import { requireTenant } from "@/lib/tenant";
import { db } from "@/lib/db";
import { BarChart2, TrendingUp, Search, Download, Eye } from "lucide-react";

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
    <div className="p-8" dir="rtl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">التقارير والتحليلات</h1>
        <p className="text-gray-500 text-sm mt-1">إجمالي نشاط حسابك</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard icon={BarChart2} label="الفعاليات" value={totalEvents} color="indigo" />
        <StatCard icon={Eye} label="الصور" value={totalPhotos} color="purple" />
        <StatCard icon={Search} label="بحث بالوجه" value={totalSearches} color="blue" />
        <StatCard icon={TrendingUp} label="معدل البحث" value={totalEvents > 0 ? Math.round(totalSearches / totalEvents) : 0} suffix="بحث/فعالية" color="green" />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-50">
          <h2 className="font-semibold text-gray-900">أكثر الفعاليات نشاطاً</h2>
        </div>
        {topEvents.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">لا توجد بيانات بعد</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {topEvents.map((event) => (
              <div key={event.id} className="flex items-center gap-4 px-6 py-4">
                <div className="flex-1">
                  <p className="font-medium text-gray-800 text-sm">{event.name}</p>
                  <p className="text-xs text-gray-400">{event._count.photos} صورة</p>
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-indigo-600">{event._count.faceSearches}</p>
                  <p className="text-xs text-gray-400">بحث</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, suffix }: { icon: any; label: string; value: any; color: string; suffix?: string }) {
  const colors: Record<string, string> = {
    indigo: "bg-indigo-50 text-indigo-600",
    purple: "bg-purple-50 text-purple-600",
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
  };
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${colors[color]}`}>
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}{suffix && <span className="text-sm font-normal text-gray-400 mr-1">{suffix}</span>}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
}
