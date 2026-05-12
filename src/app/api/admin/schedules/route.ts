import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { z } from "zod";

const TRIGGERS = [
  "ON_USER_SIGNUP", "ON_TENANT_CREATED", "ON_FIRST_EVENT", "ON_SUBSCRIPTION_CREATED",
  "ON_TRIAL_STARTED", "BEFORE_TRIAL_ENDED", "ON_SUBSCRIPTION_RENEWED",
  "BEFORE_SUBSCRIPTION_EXPIRY", "AFTER_SUBSCRIPTION_EXPIRED", "ON_PAYMENT_FAILED",
  "ON_PAYMENT_SUCCESS", "ON_TEAM_INVITE", "ON_PHOTO_UPLOAD_COMPLETE",
  "ON_FACE_SEARCH_DONE", "WEEKLY_DIGEST", "MONTHLY_DIGEST", "CUSTOM_CRON",
] as const;

const createSchema = z.object({
  templateId: z.string(),
  trigger: z.enum(TRIGGERS),
  triggerData: z.record(z.string(), z.any()).optional(),
  enabled: z.boolean().default(true),
});

export async function GET() {
  const ctx = await requireAdmin("schedules.read");
  if (ctx instanceof NextResponse) return ctx;

  const schedules = await db.notificationSchedule.findMany({
    include: { template: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(schedules);
}

export async function POST(req: Request) {
  const ctx = await requireAdmin("schedules.*");
  if (ctx instanceof NextResponse) return ctx;

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const schedule = await db.notificationSchedule.create({
    data: parsed.data,
    include: { template: true },
  });
  return NextResponse.json(schedule, { status: 201 });
}
