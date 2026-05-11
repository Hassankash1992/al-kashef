import { requireTenant } from "@/lib/tenant";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Cloud, HardDrive } from "lucide-react";
import ImportSourceSelector from "@/components/dashboard/ImportSourceSelector";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EventImportPage({ params }: Props) {
  const { id } = await params;
  const tenantUser = await requireTenant();
  const { tenant } = tenantUser;

  const [event, integrations] = await Promise.all([
    db.event.findUnique({
      where: { id, tenantId: tenant.id },
      select: { id: true, name: true, slug: true, driveSourceId: true, lastSyncAt: true },
    }),
    db.integration.findMany({
      where: { tenantId: tenant.id, connected: true },
      select: { type: true, config: true, connected: true },
    }),
  ]);

  if (!event) notFound();

  const driveIntegration = integrations.find((i) => i.type === "GOOGLE_DRIVE");
  const driveEmail = driveIntegration
    ? (driveIntegration.config as any)?.email
    : null;

  return (
    <div className="p-8 max-w-2xl mx-auto" dir="rtl">
      <div className="flex items-center gap-3 mb-8">
        <Link href={`/events/${id}/photos`} className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowRight className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">استيراد الصور</h1>
          <p className="text-gray-500 text-sm">{event.name}</p>
        </div>
      </div>

      <ImportSourceSelector
        eventId={id}
        driveConnected={!!driveIntegration?.connected}
        driveEmail={driveEmail}
        lastDriveFolderId={event.driveSourceId}
        lastSyncAt={event.lastSyncAt}
      />

      {!driveIntegration?.connected && (
        <div className="mt-6 bg-amber-50 border border-amber-100 rounded-2xl p-5">
          <p className="text-sm font-semibold text-amber-800 mb-2">لا يوجد تكامل مرتبط</p>
          <p className="text-sm text-amber-700 mb-3">
            لاستيراد الصور من Google Drive، اربط حسابك أولاً من صفحة التكاملات.
          </p>
          <Link
            href="/settings/integrations"
            className="inline-flex items-center gap-2 text-sm bg-amber-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-amber-500 transition-colors"
          >
            <Cloud className="w-4 h-4" />
            اذهب إلى التكاملات
          </Link>
        </div>
      )}
    </div>
  );
}
