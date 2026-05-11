import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { z } from "zod";

const schema = z.object({
  tenantId: z.string().optional(), // null = إرسال لكل المشتركين
  plan: z.enum(["STARTER", "PRO", "AGENCY"]).optional(), // فلتر بالباقة
  subject: z.string().min(2).max(200),
  body: z.string().min(5).max(5000),
});

export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const messages = await db.adminMessage.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { tenant: { select: { name: true, slug: true } } },
  });

  return NextResponse.json(messages);
}

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  const { tenantId, plan, subject, body: msgBody } = parsed.data;

  let targetIds: string[] = [];

  if (tenantId) {
    targetIds = [tenantId];
  } else {
    const filter: any = {};
    if (plan) filter.plan = plan;
    const tenants = await db.tenant.findMany({ where: filter, select: { id: true } });
    targetIds = tenants.map((t) => t.id);
  }

  const messages = await db.adminMessage.createMany({
    data: targetIds.map((tid) => ({
      tenantId: tid,
      subject,
      body: msgBody,
      sentBy: auth.userId,
    })),
  });

  return NextResponse.json({ sent: messages.count });
}
