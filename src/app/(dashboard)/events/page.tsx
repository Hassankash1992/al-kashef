import { requireTenant } from "@/lib/tenant";
import { db } from "@/lib/db";
import Link from "next/link";
import { CalendarDays, Plus, Image, Search, ExternalLink, QrCode } from "lucide-react";
import { EVENT_STATUS_LABELS, EVENT_TYPE_LABELS } from "@/lib/utils";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export default async function EventsPage() {
  const tenantUser = await requireTenant();
  const events = await db.event.findMany({
    where: { tenantId: tenantUser.tenant.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { photos: true, faceSearches: true } } },
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">الفعاليات</h1>
          <p className="text-gray-500 text-sm mt-1">{events.length} فعالية</p>
        </div>
        <Link
          href="/events/new"
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" />
          فعالية جديدة
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-20 text-center">
          <CalendarDays className="w-14 h-14 text-gray-200 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-700 mb-2">لا توجد فعاليات</h2>
          <p className="text-gray-400 text-sm mb-6">أنشئ فعاليتك الأولى لبدء رفع الصور</p>
          <Link href="/events/new" className="inline-flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-500 transition-colors">
            <Plus className="w-4 h-4" /> أنشئ فعالية
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {events.map((event) => (
            <div key={event.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-5 flex items-start gap-4">
                {event.coverImage ? (
                  <img src={event.coverImage} alt={event.name} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                ) : (
                  <div className="w-16 h-16 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <CalendarDays className="w-7 h-7 text-indigo-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-gray-900 text-base">{event.name}</h3>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs text-gray-400">{EVENT_TYPE_LABELS[event.type]}</span>
                        {event.date && (
                          <>
                            <span className="text-gray-200">•</span>
                            <span className="text-xs text-gray-400">
                              {format(event.date, "d MMMM yyyy", { locale: ar })}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${
                      event.status === "ACTIVE" ? "bg-green-50 text-green-700" :
                      event.status === "DRAFT" ? "bg-yellow-50 text-yellow-700" :
                      "bg-gray-50 text-gray-500"
                    }`}>
                      {EVENT_STATUS_LABELS[event.status]}
                    </span>
                  </div>
                  <div className="flex items-center gap-5 mt-3">
                    <div className="flex items-center gap-1.5 text-sm text-gray-500">
                      <Image className="w-3.5 h-3.5" />
                      {event._count.photos} صورة
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-gray-500">
                      <Search className="w-3.5 h-3.5" />
                      {event._count.faceSearches} بحث
                    </div>
                    <div className="mr-auto flex items-center gap-2">
                      <Link
                        href={`/g/${tenantUser.tenant.slug}/${event.slug}`}
                        target="_blank"
                        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-indigo-600 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        رابط المعرض
                      </Link>
                      <Link
                        href={`/events/${event.id}/photos`}
                        className="flex items-center gap-1.5 text-xs bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-3 py-1.5 rounded-lg font-medium transition-colors"
                      >
                        إدارة الصور
                      </Link>
                      <Link
                        href={`/events/${event.id}`}
                        className="flex items-center gap-1.5 text-xs bg-gray-50 text-gray-600 hover:bg-gray-100 px-3 py-1.5 rounded-lg font-medium transition-colors"
                      >
                        إعدادات
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
