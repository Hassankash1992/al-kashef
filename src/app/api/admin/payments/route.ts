import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { z } from "zod";

const updateSchema = z.object({
  provider: z.enum(["MYFATOORAH", "STRIPE", "MOYASAR", "TAP", "PAYTABS", "HYPERPAY"]),
  enabled: z.boolean().optional(),
  testMode: z.boolean().optional(),
  apiKey: z.string().optional(),
  publishableKey: z.string().optional(),
  webhookSecret: z.string().optional(),
  baseUrl: z.string().optional(),
  defaultCurrency: z.string().optional(),
  supportedCountries: z.array(z.string()).optional(),
  supportedMethods: z.array(z.string()).optional(),
});

export async function GET() {
  const ctx = await requireAdmin("billing.read");
  if (ctx instanceof NextResponse) return ctx;

  const configs = await db.paymentGatewayConfig.findMany();
  // Mask sensitive
  const safe = configs.map((c) => ({
    ...c,
    apiKey: c.apiKey ? "•••••••••" + c.apiKey.slice(-4) : null,
    webhookSecret: c.webhookSecret ? "•••••••••" : null,
  }));
  return NextResponse.json(safe);
}

export async function PUT(req: Request) {
  const ctx = await requireAdmin("billing.*");
  if (ctx instanceof NextResponse) return ctx;

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { provider, ...data } = parsed.data;
  const cleanData: any = { ...data, updatedBy: ctx.userId };
  if (!data.apiKey) delete cleanData.apiKey;
  if (!data.webhookSecret) delete cleanData.webhookSecret;

  const config = await db.paymentGatewayConfig.upsert({
    where: { provider },
    update: cleanData,
    create: { provider, ...cleanData },
  });

  return NextResponse.json({ success: true, enabled: config.enabled });
}
