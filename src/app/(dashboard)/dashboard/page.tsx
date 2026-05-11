import { requireTenant } from "@/lib/tenant";
import { db } from "@/lib/db";
import Link from "next/link";
import { CalendarDays, Image, Search, Plus, ArrowLeft } from "lucide-react";
import { EVENT_STATUS_LABELS } from "@/lib/utils";

export default async function DashboardPage() {
  const tenantUser = await requireTenant();
  const { tenant } = tenantUser;

  const [events, stats] = await Promise.all([
    db.event.findMany({
      where: { tenantId: tenant.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { _count: { select: { photos: true } } },
    }),
    db.$transaction([
      db.event.count({ where: { tenantId: tenant.id } }),
      db.photo.count({ where: { tenantId: tenant.id } }),
      db.faceSearch.count({ where: { tenantId: tenant.id } }),
    ]),
  ]);

  const [totalEvents, totalPhotos, totalSearches] = stats;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">لوحة التحكم</h1>
          <p className="text-gray-500 text-sm mt-1">مرحباً بك في {tenant.name}</p>
        </div>
        <Link
          href="/events/new"
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" />
          فعالية جديدة
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-8">
        <StatCard icon={CalendarDays} label="إجمالي الفعاليات" value={totalEvents} color="indigo" />
        <StatCard icon={Image} label="إجمالي الصور" value={totalPhotos.toLocaleString("ar")} color="purple" />
        <StatCard icon={Search} label="عمليات البحث بالوجه" value={totalSearches.toLocaleString("ar")} color="green" />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">آخر الفعاليات</h2>
          <Link href="/events" className="text-sm text-indigo-600 hover:text-indigo-500 flex items-center gap-1">
            عرض الكل <ArrowLeft className="w-3.5 h-3.5" />
          </Link>
        </div>

        {events.length === 0 ? (
          <div className="py-16 text-center">
            <CalendarDays className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">لا توجد فعاليات بعد</p>
            <p className="text-gray-400 text-sm mt-1 mb-4">أنشئ فعاليتك الأولى وابدأ رفع الصور</p>
            <Link href="/events/new" className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-500 transition-colors">
              <Plus className="w-4 h-4" /> أنشئ فعالية
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {events.map((event) => (
              <Link key={event.id} href={`/events/${event.id}`} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors group">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <CalendarDays className="w-5 h-5 text-indigo-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate group-hover:text-indigo-600 transition-colors">{event.name}</p>
                  <p className="text-sm text-gray-400">{event._count.photos} صورة</p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  event.status === "ACTIVE" ? "bg-green-50 text-green-700" :
                  event.status === "DRAFT" ? "bg-yellow-50 text-yellow-700" :
                  "bg-gray-50 text-gray-500"
                }`}>
                  {EVENT_STATUS_LABELS[event.status]}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: any; color: string }) {
  const colors = {
    indigo: "bg-indigo-50 text-indigo-600",
    purple: "bg-purple-50 text-purple-600",
    green: "bg-green-50 text-green-600",
  } as const;
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colors[color as keyof typeof colors]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </div>
  );
}
