import { requireTenant } from "@/lib/tenant";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Cloud, AlertCircle } from "lucide-react";
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
    <div className="p-6 sm:p-8 max-w-3xl mx-auto" dir="rtl">
      <div className="flex items-center gap-3 mb-8">
        <Link
          href={`/events/${id}/photos`}
          className="w-10 h-10 bg-white border border-zinc-200 rounded-xl flex items-center justify-center text-zinc-600 hover:bg-zinc-50 hover:text-amber-600 transition-colors shrink-0"
        >
          <ArrowRight className="w-4 h-4" />
        </Link>
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">استيراد الصور</h1>
          <p className="text-zinc-500 text-sm mt-0.5 truncate">{event.name}</p>
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
        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5 text-amber-700" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-amber-900 mb-1">لا يوجد تكامل مرتبط</p>
            <p className="text-sm text-amber-800 mb-3 leading-relaxed">
              لاستيراد الصور من Google Drive، اربط حسابك أولاً من صفحة التكاملات.
            </p>
            <Link
              href="/settings/integrations"
              className="inline-flex items-center gap-2 text-sm bg-zinc-900 hover:bg-zinc-800 text-white px-4 py-2 rounded-xl font-bold transition-colors"
            >
              <Cloud className="w-4 h-4" />
              اذهب إلى التكاملات
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
