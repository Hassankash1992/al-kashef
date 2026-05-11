import { requireTenant } from "@/lib/tenant";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight, ScanFace } from "lucide-react";
import FaceIndexingPanel from "@/components/dashboard/FaceIndexingPanel";
import { isRekognitionConfigured } from "@/lib/rekognition";

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
    isRekognitionConfigured(),
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
    <div className="p-8 max-w-2xl mx-auto" dir="rtl">
      <div className="flex items-center gap-3 mb-8">
        <Link href={`/events/${id}`} className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowRight className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ScanFace className="w-6 h-6 text-indigo-500" />
            فهرسة الوجوه
          </h1>
          <p className="text-gray-500 text-sm">{event.name}</p>
        </div>
      </div>

      {!event.faceSearchEnabled ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
          <ScanFace className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="font-semibold text-gray-700 mb-1">البحث بالوجه غير مفعل</p>
          <p className="text-sm text-gray-400 mb-4">فعّل البحث بالوجه من إعدادات الفعالية أولاً.</p>
          <Link
            href={`/events/${id}`}
            className="inline-block text-sm text-indigo-600 font-medium hover:underline"
          >
            الذهاب للإعدادات
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-800 mb-5">حالة الفهرسة</h2>
          <FaceIndexingPanel
            eventId={id}
            stats={stats}
            rekognitionConfigured={rekognitionConfigured}
          />
        </div>
      )}

      {/* Recent face searches */}
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
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mt-6">
      <h2 className="font-semibold text-gray-800 mb-4">آخر عمليات البحث بالوجه</h2>
      <div className="space-y-2">
        {searches.map((s) => (
          <div key={s.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
            <div className="text-sm text-gray-600">
              <span className="font-medium">{s.matchCount} نتيجة</span>
              <span className="text-gray-400 text-xs mr-2">{s.ipAddress || "—"}</span>
            </div>
            <span className="text-xs text-gray-400">
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
