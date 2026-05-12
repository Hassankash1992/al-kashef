import { db } from "@/lib/db";
import PaymentGatewayManager from "@/components/admin/PaymentGatewayManager";
import { CreditCard } from "lucide-react";

export default async function AdminPaymentsPage() {
  const configs = await db.paymentGatewayConfig.findMany();
  const recentPayments = await db.payment.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return (
    <div className="p-6 sm:p-8 max-w-5xl mx-auto" dir="rtl">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-amber-600" />
          بوابات الدفع
        </h1>
        <p className="text-zinc-500 text-sm mt-1">
          اربط بوابات الدفع لتفعيل الاشتراكات الآلية
        </p>
      </div>

      <PaymentGatewayManager
        initialConfigs={configs.map((c) => ({
          provider: c.provider,
          enabled: c.enabled,
          testMode: c.testMode,
          apiKeyMasked: c.apiKey ? "•••••••••" + c.apiKey.slice(-4) : "",
          webhookSecretConfigured: !!c.webhookSecret,
          baseUrl: c.baseUrl ?? "",
          defaultCurrency: c.defaultCurrency,
        }))}
        recentPayments={recentPayments.map((p) => ({
          id: p.id,
          provider: p.provider,
          amount: p.amount,
          currency: p.currency,
          status: p.status,
          customerEmail: p.customerEmail,
          createdAt: p.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
