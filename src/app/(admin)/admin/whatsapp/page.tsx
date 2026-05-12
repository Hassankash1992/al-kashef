import { db } from "@/lib/db";
import WhatsAppForm from "@/components/admin/WhatsAppForm";
import { MessageCircle } from "lucide-react";

export default async function AdminWhatsAppPage() {
  const config = await db.whatsAppConfig.findUnique({ where: { id: 1 } });

  return (
    <div className="p-6 sm:p-8 max-w-4xl mx-auto" dir="rtl">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight flex items-center gap-2">
          <MessageCircle className="w-6 h-6 text-amber-600" />
          WhatsApp Business API
        </h1>
        <p className="text-zinc-500 text-sm mt-1">
          اربط WhatsApp Cloud API لإرسال رسائل التنبيهات والمعارض للضيوف.
        </p>
      </div>

      <WhatsAppForm
        initial={{
          enabled: config?.enabled ?? false,
          phoneNumberId: config?.phoneNumberId ?? "",
          accessTokenMasked: config?.accessToken ? "•••••••••" + config.accessToken.slice(-4) : "",
          businessAccountId: config?.businessAccountId ?? "",
          webhookSecret: config?.webhookSecret ? "configured" : "",
          testNumber: config?.testNumber ?? "",
          rateLimitPerMin: config?.rateLimitPerMin ?? 80,
        }}
      />
    </div>
  );
}
