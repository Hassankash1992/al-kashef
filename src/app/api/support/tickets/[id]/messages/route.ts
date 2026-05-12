import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { getAdminContext } from "@/lib/admin-auth";
import { z } from "zod";

const messageSchema = z.object({
  body: z.string().min(1).max(5000),
  isInternal: z.boolean().optional(),
  attachments: z.array(z.object({ url: z.string(), name: z.string() })).optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: ticketId } = await params;
  const body = await req.json();
  const parsed = messageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const ticket = await db.supportTicket.findUnique({
    where: { id: ticketId },
    select: { id: true, tenantId: true, status: true },
  });
  if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });

  const adminCtx = await getAdminContext(userId);
  let fromType: "CLIENT" | "ADMIN";
  let adminUserDbId: string | null = null;
  let fromName: string | undefined;

  if (adminCtx) {
    fromType = "ADMIN";
    if (!adminCtx.isSuperAdmin) {
      const adminUser = await db.adminUser.findUnique({ where: { clerkUserId: userId } });
      adminUserDbId = adminUser?.id ?? null;
      fromName = adminUser?.name ?? "الدعم الفني";
    } else {
      fromName = "الدعم الفني";
    }
  } else {
    const tenantUser = await db.tenantUser.findFirst({
      where: { clerkUserId: userId, tenantId: ticket.tenantId },
    });
    if (!tenantUser) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    fromType = "CLIENT";
  }

  // Internal notes are admin-only
  if (parsed.data.isInternal && fromType !== "ADMIN") {
    return NextResponse.json({ error: "Internal notes are admin-only" }, { status: 403 });
  }

  const message = await db.supportMessage.create({
    data: {
      ticketId,
      fromType,
      fromUserId: userId,
      fromName,
      body: parsed.data.body,
      attachments: parsed.data.attachments ?? undefined,
      isInternal: parsed.data.isInternal ?? false,
      adminUserId: adminUserDbId,
    },
  });

  // Update ticket counters
  const ticketUpdate: any = {
    lastMessageAt: new Date(),
  };

  if (!parsed.data.isInternal) {
    if (fromType === "CLIENT") {
      ticketUpdate.unreadByAdmin = { increment: 1 };
      ticketUpdate.status = "AWAITING_ADMIN";
    } else {
      ticketUpdate.unreadByClient = { increment: 1 };
      ticketUpdate.status = "AWAITING_CLIENT";
    }
  }

  await db.supportTicket.update({
    where: { id: ticketId },
    data: ticketUpdate,
  });

  return NextResponse.json(message, { status: 201 });
}
