import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { z } from "zod";

const updateSchema = z.object({
  role: z.enum(["SUPER_ADMIN", "ADMIN", "SUPPORT", "BILLING", "CONTENT", "VIEWER"]).optional(),
  active: z.boolean().optional(),
  name: z.string().optional(),
  email: z.string().email().optional(),
  permissions: z.array(z.string()).optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireAdmin("admins.invite");
  if (ctx instanceof NextResponse) return ctx;

  const { id } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const updated = await db.adminUser.update({
    where: { id },
    data: parsed.data,
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireAdmin("admins.invite");
  if (ctx instanceof NextResponse) return ctx;

  const { id } = await params;
  await db.adminUser.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
