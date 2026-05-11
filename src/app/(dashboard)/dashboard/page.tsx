import { requireTenant } from "@/lib/tenant";
import { db } from "@/lib/db";
import Link from "next/link";
import { CalendarDays, Image as ImageIcon, Search, Plus, ArrowLeft, Sparkles } from "lucide-react";
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
    <div className="p-6 sm:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-full px-3 py-1 text-xs font-medium text-amber-700 mb-2">
            <Sparkles className="w-3 h-3" />
            مرحباً بك من جديد
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">{tenant.name}</h1>
          <p className="text-zinc-500 text-sm mt-1">لوحة التحكم — نظرة عامة على نشاطك</p>
        </div>
        <Link
          href="/events/new"
          className="inline-flex items-center gap-2 bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-700 hover:from-amber-200 hover:via-yellow-400 hover:to-amber-600 text-black px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40"
        >
          <Plus className="w-4 h-4" strokeWidth={3} />
          فعالية جديدة
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 mb-8">
        <StatCard icon={CalendarDays} label="إجمالي الفعاليات" value={totalEvents} />
        <StatCard icon={ImageIcon} label="إجمالي الصور" value={totalPhotos.toLocaleString("ar-SA")} />
        <StatCard icon={Search} label="عمليات البحث بالوجه" value={totalSearches.toLocaleString("ar-SA")} />
      </div>

      {/* Recent Events */}
      <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-zinc-100">
          <h2 className="font-bold text-zinc-900 text-base">آخر الفعاليات</h2>
          <Link
            href="/events"
            className="text-sm text-amber-600 hover:text-amber-700 font-semibold flex items-center gap-1 transition-colors"
          >
            عرض الكل
            <ArrowLeft className="w-3.5 h-3.5" />
          </Link>
        </div>

        {events.length === 0 ? (
          <div className="py-16 px-6 text-center">
            <div className="inline-flex w-16 h-16 bg-zinc-100 rounded-2xl items-center justify-center mb-4">
              <CalendarDays className="w-8 h-8 text-zinc-400" />
            </div>
            <p className="text-zinc-700 font-semibold text-base">لا توجد فعاليات بعد</p>
            <p className="text-zinc-500 text-sm mt-1.5 mb-5">أنشئ فعاليتك الأولى وابدأ برفع الصور</p>
            <Link
              href="/events/new"
              className="inline-flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
            >
              <Plus className="w-4 h-4" /> أنشئ أول فعالية
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-zinc-50">
            {events.map((event) => (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                className="flex items-center gap-4 px-5 sm:px-6 py-4 hover:bg-zinc-50 transition-colors group"
              >
                <div className="w-11 h-11 bg-gradient-to-br from-amber-100 to-amber-50 border border-amber-200 rounded-xl flex items-center justify-center shrink-0">
                  <CalendarDays className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-zinc-900 truncate group-hover:text-amber-700 transition-colors">{event.name}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{event._count.photos} صورة</p>
                </div>
                <StatusBadge status={event.status} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: any }) {
  return (
    <div className="relative bg-white rounded-2xl border border-zinc-100 shadow-sm p-5 sm:p-6 overflow-hidden group hover:shadow-md hover:border-amber-200 transition-all">
      <div className="absolute top-0 left-0 w-32 h-32 bg-amber-400/5 rounded-full blur-3xl group-hover:bg-amber-400/10 transition-colors" />
      <div className="relative">
        <div className="w-11 h-11 bg-gradient-to-br from-amber-100 to-amber-50 border border-amber-200 rounded-xl flex items-center justify-center mb-3">
          <Icon className="w-5 h-5 text-amber-600" />
        </div>
        <p className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">{value}</p>
        <p className="text-sm text-zinc-500 mt-1">{label}</p>
      </div>
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
    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${styles[status] ?? styles.ARCHIVED}`}>
      {EVENT_STATUS_LABELS[status as keyof typeof EVENT_STATUS_LABELS]}
    </span>
  );
}
