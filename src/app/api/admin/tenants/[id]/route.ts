import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { z } from "zod";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;

  const tenant = await db.tenant.findUnique({
    where: { id },
    include: {
      subscriptions: { orderBy: { createdAt: "desc" }, take: 5 },
      invoices: { orderBy: { createdAt: "desc" }, take: 10 },
      adminMessages: { orderBy: { createdAt: "desc" }, take: 10 },
      domains: true,
      _count: { select: { events: true, users: true } },
    },
  });

  if (!tenant) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [eventCount, photoCount] = await Promise.all([
    db.event.count({ where: { tenantId: id } }),
    db.photo.count({ where: { tenantId: id, status: { not: "DELETED" } } }),
  ]);

  return NextResponse.json({ ...tenant, eventCount, photoCount });
}

const patchSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  slug: z.string().min(2).max(100).optional(),
  plan: z.enum(["STARTER", "PRO", "AGENCY"]).optional(),
  isActive: z.boolean().optional(),
  notes: z.string().max(2000).optional().nullable(),
  primaryColor: z.string().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  // تحقق من تفرد الـ slug إذا تغيّر
  if (parsed.data.slug) {
    const existing = await db.tenant.findFirst({
      where: { slug: parsed.data.slug, NOT: { id } },
    });
    if (existing) return NextResponse.json({ error: "هذا الـ slug مستخدم بالفعل" }, { status: 409 });
  }

  const updated = await db.tenant.update({ where: { id }, data: parsed.data });
  return NextResponse.json(updated);
}
