import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { createInvoice } from "@/lib/payments/myfatoorah";
import { z } from "zod";

const checkoutSchema = z.object({
  plan: z.enum(["STARTER", "PRO", "AGENCY"]),
  billingCycle: z.enum(["MONTHLY", "YEARLY"]),
  provider: z.enum(["MYFATOORAH"]).default("MYFATOORAH"),
});

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantUser = await db.tenantUser.findFirst({
    where: { clerkUserId: userId },
    include: { tenant: true },
  });
  if (!tenantUser) return NextResponse.json({ error: "No tenant" }, { status: 404 });

  const body = await req.json();
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  // Get plan price
  const planConfig = await db.planConfig.findUnique({ where: { plan: parsed.data.plan } });
  if (!planConfig) return NextResponse.json({ error: "الباقة غير موجودة" }, { status: 404 });

  const amount = parsed.data.billingCycle === "MONTHLY" ? planConfig.priceMonthly : planConfig.priceYearly;
  if (amount <= 0) return NextResponse.json({ error: "هذه الباقة مجانية" }, { status: 400 });

  // Create payment record
  const payment = await db.payment.create({
    data: {
      tenantId: tenantUser.tenant.id,
      provider: parsed.data.provider,
      amount,
      currency: "SAR",
      status: "INITIATED",
      customerEmail: req.headers.get("x-user-email") ?? undefined,
    },
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://al-kashef.vercel.app";

  // Create MyFatoorah invoice
  const result = await createInvoice({
    amount,
    currency: "SAR",
    customerName: tenantUser.tenant.name,
    customerEmail: payment.customerEmail ?? "no-email@kashef.app",
    description: `اشتراك باقة ${parsed.data.plan} - ${parsed.data.billingCycle === "MONTHLY" ? "شهري" : "سنوي"}`,
    callbackUrl: `${baseUrl}/billing/callback?paymentId=${payment.id}`,
    errorUrl: `${baseUrl}/billing?error=payment_failed`,
    customerReference: payment.id,
    language: "ar",
  });

  if (!result.ok) {
    await db.payment.update({
      where: { id: payment.id },
      data: { status: "FAILED", errorMessage: result.error },
    });
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  await db.payment.update({
    where: { id: payment.id },
    data: {
      providerInvoiceId: result.invoiceId,
      paymentUrl: result.paymentUrl,
      status: "PENDING",
      rawResponse: result.raw,
    },
  });

  return NextResponse.json({ paymentUrl: result.paymentUrl, paymentId: payment.id });
}
