import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CheckCircle, XCircle, Loader2, ArrowLeft } from "lucide-react";

export default async function BillingCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ paymentId?: string; Id?: string }>;
}) {
  const { paymentId, Id } = await searchParams;

  if (Id) {
    // MyFatoorah sometimes redirects with their Id — verify and redirect
    const { consumeCallback } = await import("@/lib/payments/myfatoorah");
    await consumeCallback(Id);
  }

  if (!paymentId) redirect("/billing");

  const payment = await db.payment.findUnique({ where: { id: paymentId } });
  if (!payment) redirect("/billing");

  const success = payment.status === "PAID";
  const pending = payment.status === "PENDING" || payment.status === "INITIATED";

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6" dir="rtl">
      <div className="max-w-md w-full bg-white rounded-3xl border border-zinc-100 shadow-2xl p-8 text-center">
        <div className={`inline-flex w-20 h-20 rounded-2xl items-center justify-center mb-5 ${
          success
            ? "bg-emerald-50 border-2 border-emerald-300"
            : pending
              ? "bg-amber-50 border-2 border-amber-300"
              : "bg-red-50 border-2 border-red-300"
        }`}>
          {success ? (
            <CheckCircle className="w-10 h-10 text-emerald-600" />
          ) : pending ? (
            <Loader2 className="w-10 h-10 text-amber-600 animate-spin" />
          ) : (
            <XCircle className="w-10 h-10 text-red-600" />
          )}
        </div>
        <h1 className="text-2xl font-bold text-zinc-900 mb-2">
          {success ? "🎉 تم الدفع بنجاح" : pending ? "بانتظار التأكيد" : "فشل الدفع"}
        </h1>
        <p className="text-zinc-600 mb-6 leading-relaxed">
          {success
            ? "تم تفعيل اشتراكك. ستصلك فاتورة على إيميلك."
            : pending
              ? "نُحقّق من حالة الدفع، قد يستغرق هذا بعض الوقت."
              : payment.errorMessage || "لم تكتمل عملية الدفع. حاول مرة أخرى أو تواصل مع الدعم."}
        </p>
        <div className="bg-zinc-50 rounded-xl p-3 mb-6 text-sm space-y-1">
          <div className="flex justify-between">
            <span className="text-zinc-500">المبلغ:</span>
            <span className="font-bold text-zinc-900">{payment.amount} {payment.currency}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">رقم العملية:</span>
            <code className="font-mono text-xs text-zinc-700">{payment.id.slice(0, 8)}...</code>
          </div>
        </div>
        <Link
          href="/billing"
          className="inline-flex items-center gap-2 bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-700 hover:from-amber-200 text-black px-6 py-3 rounded-xl text-sm font-bold shadow-lg shadow-amber-500/20 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          العودة للاشتراك
        </Link>
      </div>
    </div>
  );
}
