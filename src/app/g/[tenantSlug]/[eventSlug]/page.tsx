import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { getPublicUrl } from "@/lib/storage";
import GalleryView from "@/components/gallery/GalleryView";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface Props {
  params: Promise<{ tenantSlug: string; eventSlug: string }>;
}

export default async function PublicGalleryPage({ params }: Props) {
  const { tenantSlug, eventSlug } = await params;

  const tenant = await db.tenant.findUnique({
    where: { slug: tenantSlug },
    select: { id: true, name: true, logo: true, primaryColor: true },
  });
  if (!tenant) notFound();

  const event = await db.event.findUnique({
    where: { tenantId_slug: { tenantId: tenant.id, slug: eventSlug } },
    select: {
      id: true, name: true, description: true, date: true, type: true,
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
      tenantSlug={tenantSlug}
      eventSlug={eventSlug}
    />
  );
}
