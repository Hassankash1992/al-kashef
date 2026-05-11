import { requireTenant } from "@/lib/tenant";
import { db } from "@/lib/db";
import Link from "next/link";
import { CalendarDays, Plus, Image as ImageIcon, Search, ExternalLink } from "lucide-react";
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
    <div className="p-6 sm:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">الفعاليات</h1>
          <p className="text-zinc-500 text-sm mt-1">{events.length} فعالية</p>
        </div>
        <Link
          href="/events/new"
          className="inline-flex items-center gap-2 bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-700 hover:from-amber-200 hover:via-yellow-400 hover:to-amber-600 text-black px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40"
        >
          <Plus className="w-4 h-4" strokeWidth={3} />
          فعالية جديدة
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm py-20 text-center">
          <div className="inline-flex w-16 h-16 bg-zinc-100 rounded-2xl items-center justify-center mb-4">
            <CalendarDays className="w-8 h-8 text-zinc-400" />
          </div>
          <h2 className="text-lg font-bold text-zinc-800 mb-2">لا توجد فعاليات</h2>
          <p className="text-zinc-500 text-sm mb-6">أنشئ فعاليتك الأولى لبدء رفع الصور</p>
          <Link
            href="/events/new"
            className="inline-flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" /> أنشئ فعالية
          </Link>
        </div>
      ) : (
        <div className="grid gap-3 sm:gap-4">
          {events.map((event) => (
            <div
              key={event.id}
              className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden hover:shadow-md hover:border-amber-200 transition-all"
            >
              <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-start gap-4">
                {event.coverImage ? (
                  <img
                    src={event.coverImage}
                    alt={event.name}
                    className="w-full sm:w-20 h-32 sm:h-20 rounded-xl object-cover shrink-0"
                  />
                ) : (
                  <div className="w-full sm:w-20 h-32 sm:h-20 bg-gradient-to-br from-amber-100 to-amber-50 border border-amber-200 rounded-xl flex items-center justify-center shrink-0">
                    <CalendarDays className="w-8 h-8 text-amber-600" />
                  </div>
                )}
                <div className="flex-1 min-w-0 w-full">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="min-w-0">
                      <h3 className="font-bold text-zinc-900 text-base sm:text-lg truncate">{event.name}</h3>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs text-zinc-500 font-medium">{EVENT_TYPE_LABELS[event.type]}</span>
                        {event.date && (
                          <>
                            <span className="text-zinc-300">•</span>
                            <span className="text-xs text-zinc-500">
                              {format(event.date, "d MMMM yyyy", { locale: ar })}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <StatusBadge status={event.status} />
                  </div>

                  <div className="flex items-center gap-4 sm:gap-5 mt-3 flex-wrap">
                    <div className="flex items-center gap-1.5 text-sm text-zinc-600 font-medium">
                      <ImageIcon className="w-3.5 h-3.5 text-zinc-400" />
                      {event._count.photos} صورة
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-zinc-600 font-medium">
                      <Search className="w-3.5 h-3.5 text-zinc-400" />
                      {event._count.faceSearches} بحث
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-4 flex-wrap">
                    <Link
                      href={`/events/${event.id}/photos`}
                      className="flex items-center gap-1.5 text-xs bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-lg font-semibold transition-colors"
                    >
                      إدارة الصور
                    </Link>
                    <Link
                      href={`/events/${event.id}`}
                      className="flex items-center gap-1.5 text-xs bg-zinc-100 text-zinc-700 hover:bg-zinc-200 px-3 py-1.5 rounded-lg font-semibold transition-colors"
                    >
                      الإعدادات
                    </Link>
                    <Link
                      href={`/g/${tenantUser.tenant.slug}/${event.slug}`}
                      target="_blank"
                      className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-amber-700 transition-colors mr-auto font-medium"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      المعرض العام
                    </Link>
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

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
    DRAFT: "bg-amber-50 text-amber-700 border-amber-200",
    ARCHIVED: "bg-zinc-100 text-zinc-600 border-zinc-200",
  };
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border shrink-0 ${styles[status] ?? styles.ARCHIVED}`}>
      {EVENT_STATUS_LABELS[status as keyof typeof EVENT_STATUS_LABELS]}
    </span>
  );
}
