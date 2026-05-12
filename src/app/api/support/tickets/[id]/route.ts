import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { getAdminContext } from "@/lib/admin-auth";

// Get single ticket with messages
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const adminCtx = await getAdminContext(userId);

  const ticket = await db.supportTicket.findUnique({
    where: { id },
    include: {
      tenant: { select: { id: true, name: true, slug: true, plan: true } },
      messages: {
        orderBy: { createdAt: "asc" },
        where: adminCtx ? undefined : { isInternal: false },
      },
    },
  });

  if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Authorize: admin OR tenant owner
  if (!adminCtx) {
    const tenantUser = await db.tenantUser.findFirst({
      where: { clerkUserId: userId, tenantId: ticket.tenantId },
    });
    if (!tenantUser) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Mark as read for the viewer
  if (adminCtx) {
    if (ticket.unreadByAdmin > 0) {
      await db.supportTicket.update({ where: { id }, data: { unreadByAdmin: 0 } });
    }
  } else {
    if (ticket.unreadByClient > 0) {
      await db.supportTicket.update({ where: { id }, data: { unreadByClient: 0 } });
    }
  }

  return NextResponse.json(ticket);
}

// Update ticket (admin: status, priority, assigned, pinned)
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const adminCtx = await getAdminContext(userId);
  if (!adminCtx) return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const updateData: any = {};
  if (body.status) updateData.status = body.status;
  if (body.priority) updateData.priority = body.priority;
  if (body.assignedTo !== undefined) updateData.assignedTo = body.assignedTo;
  if (body.pinnedByAdmin !== undefined) updateData.pinnedByAdmin = body.pinnedByAdmin;
  if (body.status === "CLOSED") updateData.closedAt = new Date();

  const updated = await db.supportTicket.update({ where: { id }, data: updateData });
  return NextResponse.json(updated);
}
