import { requireTenant } from "@/lib/tenant";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import EventSettingsForm from "@/components/dashboard/EventSettingsForm";
import Link from "next/link";
import { ArrowRight, Image as ImageIcon, ExternalLink, ScanFace, Copy, Upload } from "lucide-react";

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
    <div className="p-6 sm:p-8 max-w-3xl mx-auto" dir="rtl">
      <div className="flex items-center gap-3 mb-8">
        <Link
          href="/events"
          className="w-10 h-10 bg-white border border-zinc-200 rounded-xl flex items-center justify-center text-zinc-600 hover:bg-zinc-50 hover:text-amber-600 transition-colors shrink-0"
        >
          <ArrowRight className="w-4 h-4" />
        </Link>
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight truncate">{event.name}</h1>
          <p className="text-zinc-500 text-sm mt-0.5">إعدادات الفعالية</p>
        </div>
      </div>

      {/* Gallery URL */}
      <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-5 mb-6">
        <p className="text-xs font-bold text-zinc-700 mb-2 uppercase tracking-wider">رابط المعرض العام</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-xs sm:text-sm bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2.5 text-zinc-700 font-mono truncate" dir="ltr">
            {galleryUrl}
          </code>
          <Link
            href={galleryUrl}
            target="_blank"
            className="p-2.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors shrink-0"
            title="فتح المعرض"
          >
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <Link
          href={`/events/${id}/photos`}
          className="flex-1 inline-flex items-center justify-center gap-2 bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-700 hover:from-amber-200 hover:via-yellow-400 hover:to-amber-600 text-black py-3 rounded-xl text-sm font-bold transition-all shadow-lg shadow-amber-500/20"
        >
          <ImageIcon className="w-4 h-4" /> إدارة الصور ({event.totalPhotos})
        </Link>
        <Link
          href={`/events/${id}/import`}
          className="inline-flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white px-5 py-3 rounded-xl text-sm font-bold transition-colors"
        >
          <Upload className="w-4 h-4" /> استيراد
        </Link>
        {event.faceSearchEnabled && (
          <Link
            href={`/events/${id}/faces`}
            className="inline-flex items-center justify-center gap-2 bg-white border border-zinc-200 hover:bg-zinc-50 hover:border-amber-300 text-zinc-800 px-5 py-3 rounded-xl text-sm font-bold transition-colors"
          >
            <ScanFace className="w-4 h-4" /> الوجوه
          </Link>
        )}
      </div>

      <EventSettingsForm event={event} />
    </div>
  );
}
