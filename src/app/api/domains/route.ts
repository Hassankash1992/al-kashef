import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { randomBytes } from "crypto";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantUser = await db.tenantUser.findFirst({
    where: { clerkUserId: userId },
    select: { tenantId: true },
  });
  if (!tenantUser) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  const domains = await db.domain.findMany({
    where: { tenantId: tenantUser.tenantId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(domains);
}

const schema = z.object({
  domain: z.string()
    .min(4)
    .max(253)
    .regex(/^[a-zA-Z0-9][a-zA-Z0-9\-\.]+[a-zA-Z0-9]$/, "دومين غير صالح"),
});

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantUser = await db.tenantUser.findFirst({
    where: { clerkUserId: userId },
    include: { tenant: { select: { id: true, plan: true } } },
  });
  if (!tenantUser) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  // التحقق من أن الباقة تدعم الدومين المخصص
  // (سنتحقق من DB PlanConfig أو الافتراضي)
  if (tenantUser.tenant.plan === "STARTER") {
    return NextResponse.json(
      { error: "الدومين المخصص متاح في باقة احترافي أو وكالة فقط" },
      { status: 403 }
    );
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  const domainStr = parsed.data.domain.toLowerCase();

  // تحقق من التكرار
  const exists = await db.domain.findFirst({ where: { domain: domainStr } });
  if (exists) return NextResponse.json({ error: "هذا الدومين مسجل بالفعل" }, { status: 409 });

  const verifyToken = randomBytes(16).toString("hex");

  const domain = await db.domain.create({
    data: {
      tenantId: tenantUser.tenantId,
      domain: domainStr,
      verifyToken,
      status: "PENDING",
    },
  });

  return NextResponse.json(domain, { status: 201 });
}
