import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { DEFAULT_PLAN_LIMITS } from "@/lib/plans";
import { z } from "zod";

export async function GET() {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  // اجلب من DB أو استخدم الافتراضيات
  const dbConfigs = await db.planConfig.findMany();
  const result = (["STARTER", "PRO", "AGENCY"] as const).map((plan) => {
    const db = dbConfigs.find((c) => c.plan === plan);
    return db ?? { plan, ...DEFAULT_PLAN_LIMITS[plan] };
  });

  return NextResponse.json(result);
}

const schema = z.object({
  plan: z.enum(["STARTER", "PRO", "AGENCY"]),
  displayName: z.string().min(1),
  maxEvents: z.number().int(),
  maxPhotosPerEvent: z.number().int(),
  maxStorageGB: z.number(),
  maxTeamMembers: z.number().int(),
  faceSearchEnabled: z.boolean(),
  customDomainEnabled: z.boolean(),
  watermarkRemoval: z.boolean(),
  priceMonthly: z.number().min(0),
  priceYearly: z.number().min(0),
});

export async function PUT(req: Request) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  const config = await db.planConfig.upsert({
    where: { plan: parsed.data.plan },
    create: parsed.data,
    update: parsed.data,
  });

  return NextResponse.json(config);
}
