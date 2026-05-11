/**
 * Custom Domain Handler
 *
 * الـ middleware يعيد كتابة أي طلب من دومين مخصص إلى /cd/[...slug]
 * هنا نبحث عن الـ tenant بناءً على الـ hostname ثم نعرض المعرض المناسب.
 *
 * مثال:
 *   photos.company-a.com/         → يعرض قائمة فعاليات الشركة
 *   photos.company-a.com/wedding  → يعرض معرض فعالية الزفاف
 */

import { headers } from "next/headers";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { getPublicUrl } from "@/lib/storage";
import GalleryView from "@/components/gallery/GalleryView";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface Props {
  params: Promise<{ slug?: string[] }>;
}

export default async function CustomDomainPage({ params }: Props) {
  const { slug = [] } = await params;
  const headersList = await headers();
  const hostname = headersList.get("host") ?? "";

  // ابحث عن الـ tenant بناءً على الدومين
  const domain = await db.domain.findFirst({
    where: { domain: hostname, verified: true },
    include: { tenant: { select: { id: true, name: true, slug: true, logo: true, primaryColor: true, isActive: true } } },
  });

  if (!domain || !domain.tenant.isActive) notFound();

  const tenant = domain.tenant;

  // /cd/ → قائمة الفعاليات للشركة
  if (slug.length === 0) {
    return <TenantEventsPage tenant={tenant} />;
  }

  // /cd/[eventSlug] → معرض فعالية محددة
  const eventSlug = slug[0];
  const event = await db.event.findUnique({
    where: { tenantId_slug: { tenantId: tenant.id, slug: eventSlug } },
    select: {
      id: true, name: true, description: true, date: true,
      status: true, password: true, galleryPublic: true,
      downloadEnabled: true, faceSearchEnabled: true, shareEnabled: true,
      linkExpiresAt: true,
    },
  });

  if (!event || event.status === "DRAFT") notFound();

  if (event.linkExpiresAt && new Date(event.linkExpiresAt) < new Date()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-4xl mb-4">⏰</p>
          <h1 className="text-xl font-bold text-gray-800 mb-2">انتهت صلاحية هذا الرابط</h1>
          <p className="text-gray-500">تواصل مع مزود الخدمة للحصول على رابط جديد.</p>
        </div>
      </div>
    );
  }

  const photos = event.galleryPublic
    ? await db.photo.findMany({
        where: { eventId: event.id, status: { not: "DELETED" } },
        orderBy: { createdAt: "desc" },
        take: 200,
        select: { id: true, storageKey: true, thumbnailKey: true, previewKey: true, originalName: true },
      })
    : [];

  const photosWithUrls = photos.map((p) => ({
    id: p.id,
    thumbUrl: p.thumbnailKey ? getPublicUrl(p.thumbnailKey) : getPublicUrl(p.storageKey),
    previewUrl: p.previewKey ? getPublicUrl(p.previewKey) : getPublicUrl(p.storageKey),
    fullUrl: getPublicUrl(p.storageKey),
    name: p.originalName || "صورة",
  }));

  return (
    <GalleryView
      tenant={{ name: tenant.name, logo: tenant.logo, primaryColor: tenant.primaryColor }}
      event={{
        id: event.id,
        name: event.name,
        description: event.description,
        date: event.date ? format(event.date, "d MMMM yyyy", { locale: ar }) : null,
        password: event.password,
        downloadEnabled: event.downloadEnabled,
        faceSearchEnabled: event.faceSearchEnabled,
        shareEnabled: event.shareEnabled,
        galleryPublic: event.galleryPublic,
      }}
      photos={photosWithUrls}
      tenantSlug={tenant.slug}
      eventSlug={eventSlug}
    />
  );
}

async function TenantEventsPage({
  tenant,
}: {
  tenant: { id: string; name: string; logo: string | null; primaryColor: string };
}) {
  const events = await db.event.findMany({
    where: { tenantId: tenant.id, status: "ACTIVE", galleryPublic: true },
    orderBy: { date: "desc" },
    select: { id: true, name: true, slug: true, date: true, totalPhotos: true, type: true },
  });

  const brandColor = tenant.primaryColor || "#6366f1";

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <header className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          {tenant.logo ? (
            <img src={tenant.logo} alt={tenant.name} className="h-8 object-contain" />
          ) : (
            <div className="h-8 px-3 rounded-lg text-white text-sm font-bold flex items-center" style={{ background: brandColor }}>
              {tenant.name[0]}
            </div>
          )}
          <span className="font-semibold text-gray-800">{tenant.name}</span>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">معارض الفعاليات</h1>
        {events.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">📷</p>
            <p>لا توجد فعاليات متاحة حالياً</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((ev) => (
              <a
                key={ev.id}
                href={`/${ev.slug}`}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow group"
              >
                <div className="w-10 h-10 rounded-xl text-white text-lg flex items-center justify-center mb-3" style={{ background: brandColor }}>
                  📷
                </div>
                <h3 className="font-semibold text-gray-800 group-hover:text-indigo-600 transition-colors mb-1">{ev.name}</h3>
                {ev.date && (
                  <p className="text-xs text-gray-400 mb-2">
                    {format(ev.date, "d MMMM yyyy", { locale: ar })}
                  </p>
                )}
                <p className="text-xs text-gray-400">{ev.totalPhotos} صورة</p>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
