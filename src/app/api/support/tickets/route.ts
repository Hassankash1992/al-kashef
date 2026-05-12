import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { z } from "zod";

const createSchema = z.object({
  subject: z.string().min(2).max(200),
  body: z.string().min(2).max(5000),
  category: z.string().optional(),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).optional(),
});

// List tenant's own tickets
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantUser = await db.tenantUser.findFirst({
    where: { clerkUserId: userId },
    select: { tenantId: true },
  });
  if (!tenantUser) return NextResponse.json({ error: "No tenant" }, { status: 404 });

  const tickets = await db.supportTicket.findMany({
    where: { tenantId: tenantUser.tenantId },
    orderBy: [{ pinnedByAdmin: "desc" }, { lastMessageAt: "desc" }, { createdAt: "desc" }],
    include: {
      _count: { select: { messages: true } },
    },
  });

  return NextResponse.json(tickets);
}

// Open new ticket
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantUser = await db.tenantUser.findFirst({
    where: { clerkUserId: userId },
    select: { tenantId: true },
  });
  if (!tenantUser) return NextResponse.json({ error: "No tenant" }, { status: 404 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const ticket = await db.supportTicket.create({
    data: {
      tenantId: tenantUser.tenantId,
      subject: parsed.data.subject,
      category: parsed.data.category,
      priority: parsed.data.priority ?? "NORMAL",
      status: "OPEN",
      lastMessageAt: new Date(),
      unreadByAdmin: 1,
      messages: {
        create: {
          fromType: "CLIENT",
          fromUserId: userId,
          body: parsed.data.body,
        },
      },
    },
  });

  return NextResponse.json(ticket, { status: 201 });
}
