import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireAdmin("schedules.*");
  if (ctx instanceof NextResponse) return ctx;
  const { id } = await params;
  const body = await req.json();
  const updated = await db.notificationSchedule.update({ where: { id }, data: body });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireAdmin("schedules.*");
  if (ctx instanceof NextResponse) return ctx;
  const { id } = await params;
  await db.notificationSchedule.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
