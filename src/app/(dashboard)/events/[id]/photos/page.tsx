import { requireTenant } from "@/lib/tenant";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { getPublicUrl } from "@/lib/storage";
import PhotoUploader from "@/components/dashboard/PhotoUploader";
import PhotoGrid from "@/components/dashboard/PhotoGrid";
import Link from "next/link";
import { ArrowRight, ExternalLink, Image as ImageIcon, Cloud, Settings } from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EventPhotosPage({ params }: Props) {
  const { id } = await params;
  const tenantUser = await requireTenant();

  const event = await db.event.findUnique({
    where: { id, tenantId: tenantUser.tenant.id },
    include: {
      _count: { select: { photos: true } },
      photos: {
        where: { status: { not: "DELETED" } },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: { id: true, storageKey: true, thumbnailKey: true, originalName: true, status: true, createdAt: true },
      },
    },
  });

  if (!event) notFound();

  const photosWithUrls = event.photos.map((p) => ({
    ...p,
    url: p.thumbnailKey ? getPublicUrl(p.thumbnailKey) : getPublicUrl(p.storageKey),
    fullUrl: getPublicUrl(p.storageKey),
  }));

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Link
            href="/events"
            className="w-10 h-10 bg-white border border-zinc-200 rounded-xl flex items-center justify-center text-zinc-600 hover:bg-zinc-50 hover:text-amber-600 transition-colors shrink-0"
          >
            <ArrowRight className="w-4 h-4" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight truncate">{event.name}</h1>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <span className="text-zinc-500 text-xs flex items-center gap-1 font-medium">
                <ImageIcon className="w-3 h-3" /> {event._count.photos} صورة
              </span>
              <Link
                href={`/g/${tenantUser.tenant.slug}/${event.slug}`}
                target="_blank"
                className="text-amber-700 text-xs flex items-center gap-1 hover:text-amber-800 font-medium transition-colors"
              >
                <ExternalLink className="w-3 h-3" /> المعرض العام
              </Link>
            </div>
          </div>
        </div>

        <div className="flex gap-2 shrink-0">
          <Link
            href={`/events/${id}/import`}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm bg-zinc-900 hover:bg-zinc-800 text-white px-3 sm:px-4 py-2 rounded-xl font-bold transition-colors"
          >
            <Cloud className="w-4 h-4" /> استيراد
          </Link>
          <Link
            href={`/events/${id}`}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 px-3 sm:px-4 py-2 rounded-xl font-semibold transition-colors"
          >
            <Settings className="w-4 h-4" /> إعدادات
          </Link>
        </div>
      </div>

      <PhotoUploader eventId={event.id} tenantId={tenantUser.tenant.id} />

      <div className="mt-8">
        <h2 className="font-bold text-zinc-900 text-base mb-4">الصور المرفوعة</h2>
        <PhotoGrid photos={photosWithUrls} eventId={event.id} />
      </div>
    </div>
  );
}
