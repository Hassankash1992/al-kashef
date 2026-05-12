import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { z } from "zod";

const updateSchema = z.object({
  enabled: z.boolean().optional(),
  phoneNumberId: z.string().optional(),
  accessToken: z.string().optional(),
  businessAccountId: z.string().optional(),
  webhookSecret: z.string().optional(),
  testNumber: z.string().optional(),
  defaultTemplate: z.string().optional(),
  rateLimitPerMin: z.number().int().min(1).max(1000).optional(),
});

export async function GET() {
  const ctx = await requireAdmin("site.read");
  if (ctx instanceof NextResponse) return ctx;
  const config = await db.whatsAppConfig.findUnique({ where: { id: 1 } });
  // Mask sensitive
  if (config) {
    return NextResponse.json({
      ...config,
      accessToken: config.accessToken ? "•••••••••" + config.accessToken.slice(-4) : null,
      webhookSecret: config.webhookSecret ? "•••••••••" : null,
    });
  }
  return NextResponse.json({ enabled: false });
}

export async function PUT(req: Request) {
  const ctx = await requireAdmin("site.*");
  if (ctx instanceof NextResponse) return ctx;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const config = await db.whatsAppConfig.upsert({
    where: { id: 1 },
    update: { ...parsed.data, updatedBy: ctx.userId },
    create: { id: 1, ...parsed.data, updatedBy: ctx.userId },
  });
  return NextResponse.json({ success: true, enabled: config.enabled });
}
