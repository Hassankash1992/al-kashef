import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { z } from "zod";

const schema = z.object({
  plan: z.enum(["STARTER", "PRO", "AGENCY"]),
  status: z.enum(["TRIALING", "ACTIVE", "PAST_DUE", "CANCELLED", "EXPIRED"]),
  billingCycle: z.enum(["MONTHLY", "YEARLY"]).optional(),
  amount: z.number().min(0).optional(),
  currency: z.string().optional(),
  currentPeriodEnd: z.string().optional().nullable(), // ISO date
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;
  const { id: tenantId } = await params;

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  const { plan, status, billingCycle, amount, currency, currentPeriodEnd } = parsed.data;

  // حدّث خطة الـ tenant
  await db.tenant.update({ where: { id: tenantId }, data: { plan } });

  // أنشئ أو حدّث الاشتراك الحالي
  const existing = await db.subscription.findFirst({
    where: { tenantId, status: { in: ["ACTIVE", "TRIALING", "PAST_DUE"] } },
    orderBy: { createdAt: "desc" },
  });

  let subscription;
  if (existing) {
    subscription = await db.subscription.update({
      where: { id: existing.id },
      data: {
        plan, status,
        ...(billingCycle && { billingCycle }),
        ...(amount !== undefined && { amount }),
        ...(currency && { currency }),
        currentPeriodEnd: currentPeriodEnd ? new Date(currentPeriodEnd) : undefined,
        ...(status === "CANCELLED" && { cancelledAt: new Date() }),
      },
    });
  } else {
    subscription = await db.subscription.create({
      data: {
        tenantId, plan, status,
        billingCycle: billingCycle ?? "MONTHLY",
        amount: amount ?? 0,
        currency: currency ?? "SAR",
        currentPeriodStart: new Date(),
        currentPeriodEnd: currentPeriodEnd ? new Date(currentPeriodEnd) : undefined,
      },
    });
  }

  return NextResponse.json(subscription);
}
