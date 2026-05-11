import { requireTenant } from "@/lib/tenant";
import { db } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { getPublicUrl } from "@/lib/storage";
import PhotoUploader from "@/components/dashboard/PhotoUploader";
import PhotoGrid from "@/components/dashboard/PhotoGrid";
import Link from "next/link";
import { ArrowRight, ExternalLink, Image, Cloud } from "lucide-react";

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
    <div className="p-8" dir="rtl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/events" className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowRight className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{event.name}</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-gray-400 text-sm flex items-center gap-1.5">
              <Image className="w-3.5 h-3.5" /> {event._count.photos} صورة
            </span>
            <Link
              href={`/g/${tenantUser.tenant.slug}/${event.slug}`}
              target="_blank"
              className="text-indigo-500 text-sm flex items-center gap-1.5 hover:text-indigo-700"
            >
              <ExternalLink className="w-3.5 h-3.5" /> رابط المعرض
            </Link>
          </div>
        </div>
        <Link href={`/events/${id}/import`} className="flex items-center gap-1.5 text-sm bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-2 rounded-xl font-medium transition-colors">
          <Cloud className="w-4 h-4" /> استيراد من Cloud
        </Link>
        <Link href={`/events/${id}`} className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-xl font-medium transition-colors">
          إعدادات الفعالية
        </Link>
      </div>

      <PhotoUploader eventId={event.id} tenantId={tenantUser.tenant.id} />

      <div className="mt-8">
        <h2 className="font-semibold text-gray-900 mb-4">الصور المرفوعة</h2>
        <PhotoGrid photos={photosWithUrls} eventId={event.id} />
      </div>
    </div>
  );
}
