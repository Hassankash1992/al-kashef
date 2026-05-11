import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { DEFAULT_PLAN_LIMITS, withinLimit } from "@/lib/plans";

const createSchema = z.object({
  name: z.string().min(2).max(200),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/),
  type: z.enum(["WEDDING", "CONFERENCE", "GRADUATION", "CORPORATE", "BIRTHDAY", "OTHER"]).default("OTHER"),
  date: z.string().optional(),
  description: z.string().max(1000).optional(),
  downloadEnabled: z.boolean().default(true),
  faceSearchEnabled: z.boolean().default(true),
  galleryPublic: z.boolean().default(true),
  password: z.string().max(100).optional(),
});

async function getTenantUser(userId: string) {
  return db.tenantUser.findFirst({
    where: { clerkUserId: userId },
    include: { tenant: true },
  });
}

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantUser = await getTenantUser(userId);
  if (!tenantUser) return NextResponse.json({ error: "No tenant" }, { status: 404 });

  const events = await db.event.findMany({
    where: { tenantId: tenantUser.tenant.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { photos: true } } },
  });

  return NextResponse.json(events);
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantUser = await getTenantUser(userId);
  if (!tenantUser) return NextResponse.json({ error: "No tenant" }, { status: 404 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  const { name, slug, type, date, description, downloadEnabled, faceSearchEnabled, galleryPublic, password } = parsed.data;

  // تحقق من حدود الباقة
  const planKey = tenantUser.tenant.plan as "STARTER" | "PRO" | "AGENCY";
  const planConfig = (await db.planConfig.findUnique({ where: { plan: planKey as any } }))
    ?? DEFAULT_PLAN_LIMITS[planKey];

  const currentEventCount = await db.event.count({ where: { tenantId: tenantUser.tenant.id } });
  if (!withinLimit(currentEventCount, planConfig.maxEvents)) {
    return NextResponse.json(
      { error: `وصلت للحد الأقصى من الفعاليات (${planConfig.maxEvents}) في باقتك الحالية. قم بترقية الباقة.` },
      { status: 403 }
    );
  }

  const existing = await db.event.findUnique({
    where: { tenantId_slug: { tenantId: tenantUser.tenant.id, slug } },
  });
  if (existing) return NextResponse.json({ error: "هذا الرابط مستخدم لفعالية أخرى" }, { status: 409 });

  const event = await db.event.create({
    data: {
      tenantId: tenantUser.tenant.id,
      name,
      slug,
      type,
      date: date ? new Date(date) : null,
      description,
      downloadEnabled,
      faceSearchEnabled,
      galleryPublic,
      password: password || null,
      status: "DRAFT",
    },
  });

  return NextResponse.json(event, { status: 201 });
}
