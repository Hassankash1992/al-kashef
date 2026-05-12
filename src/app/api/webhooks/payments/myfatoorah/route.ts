import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { consumeCallback } from "@/lib/payments/myfatoorah";

/**
 * MyFatoorah webhook (or success callback).
 * Triggered when a payment status changes.
 * Verifies the payment via MyFatoorah API and updates our DB.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const url = new URL(req.url);

    // MyFatoorah sends paymentId or InvoiceId in webhook payload
    const invoiceId =
      body.Data?.InvoiceId?.toString() ||
      body.InvoiceId?.toString() ||
      url.searchParams.get("paymentId") ||
      url.searchParams.get("Id");

    if (!invoiceId) {
      return NextResponse.json({ error: "Missing invoice ID" }, { status: 400 });
    }

    const result = await consumeCallback(invoiceId);
    if (!result.ok) {
      console.error("[MF webhook]", result.error);
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    // If paid, activate subscription
    if (result.payment?.status === "PAID") {
      await activateSubscription(result.payment);
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[MF webhook] error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// GET for callback redirect
export async function GET(req: Request) {
  return POST(req);
}

async function activateSubscription(payment: any): Promise<void> {
  // Cancel any existing active subscription
  await db.subscription.updateMany({
    where: { tenantId: payment.tenantId, status: "ACTIVE" },
    data: { status: "EXPIRED", cancelledAt: new Date() },
  });

  const monthsToAdd = 1; // TODO: derive from billingCycle in payment metadata
  const periodStart = new Date();
  const periodEnd = new Date();
  periodEnd.setMonth(periodEnd.getMonth() + monthsToAdd);

  // Create new active subscription
  const sub = await db.subscription.create({
    data: {
      tenantId: payment.tenantId,
      plan: "PRO", // TODO: derive from payment metadata
      status: "ACTIVE",
      billingCycle: "MONTHLY",
      amount: payment.amount,
      currency: payment.currency,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
    },
  });

  // Create invoice record
  await db.invoice.create({
    data: {
      tenantId: payment.tenantId,
      subscriptionId: sub.id,
      amount: payment.amount,
      currency: payment.currency,
      status: "PAID",
      description: `اشتراك ${sub.plan} - ${sub.billingCycle === "MONTHLY" ? "شهري" : "سنوي"}`,
      paidAt: new Date(),
      periodStart,
      periodEnd,
    },
  });

  // Update tenant plan
  await db.tenant.update({
    where: { id: payment.tenantId },
    data: { plan: "PRO" },
  });

  // Link payment to subscription/invoice
  await db.payment.update({
    where: { id: payment.id },
    data: { subscriptionId: sub.id },
  });
}
