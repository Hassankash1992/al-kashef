import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const plan = searchParams.get("plan") ?? "";
  const status = searchParams.get("status") ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const pageSize = 20;

  const where: any = {};
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { slug: { contains: q, mode: "insensitive" } },
    ];
  }
  if (plan) where.plan = plan;
  if (status === "active") where.isActive = true;
  if (status === "inactive") where.isActive = false;

  const [tenants, total] = await Promise.all([
    db.tenant.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true, name: true, slug: true, plan: true, isActive: true,
        storageUsedBytes: true, createdAt: true,
        _count: { select: { events: true, users: true } },
        subscriptions: {
          where: { status: "ACTIVE" },
          select: { plan: true, status: true, currentPeriodEnd: true, amount: true },
          take: 1,
          orderBy: { createdAt: "desc" },
        },
      },
    }),
    db.tenant.count({ where }),
  ]);

  return NextResponse.json({ tenants, total, page, pageSize });
}
