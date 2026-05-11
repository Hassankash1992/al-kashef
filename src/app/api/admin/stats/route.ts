import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET() {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const [
    totalTenants,
    activeTenants,
    totalEvents,
    totalPhotos,
    totalSearches,
    recentTenants,
    planCounts,
    monthlyRevenue,
  ] = await Promise.all([
    db.tenant.count(),
    db.tenant.count({ where: { isActive: true } }),
    db.event.count(),
    db.photo.count({ where: { status: { not: "DELETED" } } }),
    db.faceSearch.count(),
    db.tenant.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, slug: true, plan: true, isActive: true, createdAt: true },
    }),
    db.tenant.groupBy({ by: ["plan"], _count: { plan: true } }),
    db.invoice.aggregate({
      where: {
        status: "PAID",
        paidAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
      },
      _sum: { amount: true },
    }),
  ]);

  return NextResponse.json({
    totalTenants,
    activeTenants,
    totalEvents,
    totalPhotos,
    totalSearches,
    recentTenants,
    planCounts: Object.fromEntries(planCounts.map((p) => [p.plan, p._count.plan])),
    monthlyRevenue: monthlyRevenue._sum.amount ?? 0,
  });
}
