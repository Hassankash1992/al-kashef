import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { z } from "zod";

const createSchema = z.object({
  clerkUserId: z.string().min(5),
  email: z.string().email().optional(),
  name: z.string().optional(),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "SUPPORT", "BILLING", "CONTENT", "VIEWER"]),
  permissions: z.array(z.string()).optional(),
});

export async function GET() {
  const ctx = await requireAdmin("admins.read");
  if (ctx instanceof NextResponse) return ctx;

  const admins = await db.adminUser.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(admins);
}

export async function POST(req: Request) {
  const ctx = await requireAdmin("admins.invite");
  if (ctx instanceof NextResponse) return ctx;

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const existing = await db.adminUser.findUnique({
    where: { clerkUserId: parsed.data.clerkUserId },
  });
  if (existing) {
    return NextResponse.json({ error: "هذا المستخدم مسجّل مسبقاً كأدمن" }, { status: 409 });
  }

  const admin = await db.adminUser.create({
    data: {
      clerkUserId: parsed.data.clerkUserId,
      email: parsed.data.email,
      name: parsed.data.name,
      role: parsed.data.role,
      permissions: parsed.data.permissions ?? [],
      invitedBy: ctx.userId,
    },
  });

  return NextResponse.json(admin, { status: 201 });
}
