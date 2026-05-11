import { requireTenant } from "@/lib/tenant";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import EventSettingsForm from "@/components/dashboard/EventSettingsForm";
import Link from "next/link";
import { ArrowRight, Image, ExternalLink, ScanFace } from "lucide-react";
import { getPublicUrl } from "@/lib/storage";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EventSettingsPage({ params }: Props) {
  const { id } = await params;
  const tenantUser = await requireTenant();

  const event = await db.event.findUnique({
    where: { id, tenantId: tenantUser.tenant.id },
  });

  if (!event) notFound();

  const galleryUrl = `${process.env.NEXT_PUBLIC_APP_URL}/g/${tenantUser.tenant.slug}/${event.slug}`;

  return (
    <div className="p-8 max-w-2xl mx-auto" dir="rtl">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/events" className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowRight className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">إعدادات الفعالية</h1>
          <p className="text-gray-500 text-sm">{event.name}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
        <p className="text-sm font-medium text-gray-700 mb-2">رابط المعرض</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-xs bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-gray-600 font-mono truncate" dir="ltr">
            {galleryUrl}
          </code>
          <Link href={galleryUrl} target="_blank" className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors">
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <div className="flex gap-3 mb-6">
        <Link href={`/events/${id}/photos`} className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors">
          <Image className="w-4 h-4" /> إدارة الصور ({event.totalPhotos})
        </Link>
        {event.faceSearchEnabled && (
          <Link href={`/events/${id}/faces`} className="flex items-center justify-center gap-2 bg-purple-50 hover:bg-purple-100 text-purple-700 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors">
            <ScanFace className="w-4 h-4" /> الوجوه
          </Link>
        )}
      </div>

      <EventSettingsForm event={event} />
    </div>
  );
}
