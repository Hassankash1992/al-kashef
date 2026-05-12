import { requireTenant } from "@/lib/tenant";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight, ScanFace } from "lucide-react";
import FaceIndexingPanel from "@/components/dashboard/FaceIndexingPanel";
import { isFaceRecognitionConfigured } from "@/lib/face-recognition";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EventFacesPage({ params }: Props) {
  const { id } = await params;
  const tenantUser = await requireTenant();

  const event = await db.event.findUnique({
    where: { id, tenantId: tenantUser.tenant.id },
    select: { id: true, name: true, faceSearchEnabled: true },
  });

  if (!event) notFound();

  const [statusCounts, rekognitionConfigured] = await Promise.all([
    db.photo.groupBy({
      by: ["status"],
      where: { eventId: id, tenantId: tenantUser.tenant.id },
      _count: { status: true },
    }),
    isFaceRecognitionConfigured(),
  ]);

  const countByStatus = Object.fromEntries(
    statusCounts.map((r) => [r.status, r._count.status])
  );

  const stats = {
    total: Object.values(countByStatus).reduce((a, b) => a + b, 0),
    faceIndexed: countByStatus["FACE_INDEXED"] ?? 0,
    processed: countByStatus["PROCESSED"] ?? 0,
    processing: countByStatus["PROCESSING"] ?? 0,
    failed: countByStatus["FAILED"] ?? 0,
    uploaded: countByStatus["UPLOADED"] ?? 0,
  };

  return (
    <div className="p-6 sm:p-8 max-w-3xl mx-auto" dir="rtl">
      <div className="flex items-center gap-3 mb-8">
        <Link
          href={`/events/${id}`}
          className="w-10 h-10 bg-white border border-zinc-200 rounded-xl flex items-center justify-center text-zinc-600 hover:bg-zinc-50 hover:text-amber-600 transition-colors shrink-0"
        >
          <ArrowRight className="w-4 h-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight flex items-center gap-2">
            <ScanFace className="w-6 h-6 text-amber-600" />
            فهرسة الوجوه
          </h1>
          <p className="text-zinc-500 text-sm mt-0.5 truncate">{event.name}</p>
        </div>
      </div>

      {!event.faceSearchEnabled ? (
        <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-8 text-center">
          <div className="inline-flex w-16 h-16 bg-zinc-100 rounded-2xl items-center justify-center mb-4">
            <ScanFace className="w-8 h-8 text-zinc-400" />
          </div>
          <p className="font-bold text-zinc-900 mb-1.5">البحث بالوجه غير مفعل</p>
          <p className="text-sm text-zinc-500 mb-5 max-w-sm mx-auto">
            فعّل البحث بالوجه من إعدادات الفعالية أولاً.
          </p>
          <Link
            href={`/events/${id}`}
            className="inline-flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-colors"
          >
            الذهاب للإعدادات
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-5 sm:p-6">
          <h2 className="font-bold text-zinc-900 mb-5">حالة الفهرسة</h2>
          <FaceIndexingPanel
            eventId={id}
            stats={stats}
            rekognitionConfigured={rekognitionConfigured}
          />
        </div>
      )}

      <RecentSearches eventId={id} tenantId={tenantUser.tenant.id} />
    </div>
  );
}

async function RecentSearches({
  eventId,
  tenantId,
}: {
  eventId: string;
  tenantId: string;
}) {
  const searches = await db.faceSearch.findMany({
    where: { eventId, tenantId },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { id: true, matchCount: true, ipAddress: true, createdAt: true },
  });

  if (searches.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-5 sm:p-6 mt-6">
      <h2 className="font-bold text-zinc-900 mb-4">آخر عمليات البحث بالوجه</h2>
      <div className="divide-y divide-zinc-50">
        {searches.map((s) => (
          <div key={s.id} className="flex items-center justify-between py-3 gap-3">
            <div className="text-sm flex items-center gap-2 min-w-0">
              <span className="font-bold text-amber-700">{s.matchCount}</span>
              <span className="text-zinc-700">نتيجة</span>
              <span className="text-zinc-400 text-xs font-mono truncate" dir="ltr">{s.ipAddress || "—"}</span>
            </div>
            <span className="text-xs text-zinc-500 shrink-0">
              {new Date(s.createdAt).toLocaleString("ar-SA", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
