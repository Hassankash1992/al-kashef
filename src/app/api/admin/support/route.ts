import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(req: Request) {
  const ctx = await requireAdmin("support.read");
  if (ctx instanceof NextResponse) return ctx;

  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const priority = url.searchParams.get("priority");

  const where: any = {};
  if (status) where.status = status;
  if (priority) where.priority = priority;

  const tickets = await db.supportTicket.findMany({
    where,
    orderBy: [
      { pinnedByAdmin: "desc" },
      { priority: "desc" },
      { lastMessageAt: "desc" },
    ],
    take: 100,
    include: {
      tenant: { select: { id: true, name: true, slug: true, plan: true } },
      _count: { select: { messages: true } },
    },
  });

  const totalUnread = await db.supportTicket.count({
    where: { unreadByAdmin: { gt: 0 } },
  });

  return NextResponse.json({ tickets, totalUnread });
}
