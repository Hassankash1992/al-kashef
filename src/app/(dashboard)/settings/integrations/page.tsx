import { requireTenant } from "@/lib/tenant";
import { db } from "@/lib/db";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import IntegrationsHub from "@/components/dashboard/integrations/IntegrationsHub";

export default async function IntegrationsPage() {
  const tenantUser = await requireTenant();
  const { tenant } = tenantUser;

  const integrations = await db.integration.findMany({
    where: { tenantId: tenant.id },
    select: { type: true, connected: true, config: true },
  });

  const storageConfig = await db.storageConfig.findUnique({
    where: { tenantId: tenant.id },
    select: { provider: true },
  });

  const byType = Object.fromEntries(integrations.map((i) => [i.type, i]));
  const driveEmail = byType["GOOGLE_DRIVE"]?.connected
    ? (byType["GOOGLE_DRIVE"].config as any)?.email
    : null;

  return (
    <div className="p-8 max-w-3xl mx-auto" dir="rtl">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/settings" className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowRight className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">التكاملات</h1>
          <p className="text-gray-500 text-sm">اربط خدماتك الخاصة بالمنصة</p>
        </div>
      </div>

      <IntegrationsHub
        googleDrive={{ connected: byType["GOOGLE_DRIVE"]?.connected ?? false, email: driveEmail }}
        awsS3={{ connected: byType["AWS_S3"]?.connected ?? false }}
        cloudflareR2={{ connected: byType["CLOUDFLARE_R2"]?.connected ?? false }}
        defaultStorage={storageConfig?.provider ?? "PLATFORM"}
      />
    </div>
  );
}
