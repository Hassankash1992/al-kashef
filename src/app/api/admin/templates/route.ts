import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { z } from "zod";

const upsertSchema = z.object({
  key: z.string().min(2),
  title: z.string().min(2),
  description: z.string().optional(),
  channels: z.object({
    email: z.boolean().default(false),
    whatsapp: z.boolean().default(false),
    sms: z.boolean().default(false),
    inApp: z.boolean().default(false),
  }),
  emailSubject: z.string().optional(),
  emailBody: z.string().optional(),
  whatsappBody: z.string().optional(),
  smsBody: z.string().optional(),
  inAppTitle: z.string().optional(),
  inAppBody: z.string().optional(),
  enabled: z.boolean().default(true),
  variables: z.array(z.string()).optional(),
});

export async function GET() {
  const ctx = await requireAdmin("templates.read");
  if (ctx instanceof NextResponse) return ctx;
  const templates = await db.notificationTemplate.findMany({
    orderBy: { key: "asc" },
  });
  return NextResponse.json(templates);
}

export async function PUT(req: Request) {
  const ctx = await requireAdmin("templates.*");
  if (ctx instanceof NextResponse) return ctx;

  const body = await req.json();
  const parsed = upsertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const data = parsed.data;
  const template = await db.notificationTemplate.upsert({
    where: { key: data.key },
    update: { ...data, updatedBy: ctx.userId },
    create: { ...data, createdBy: ctx.userId, updatedBy: ctx.userId },
  });
  return NextResponse.json(template);
}
