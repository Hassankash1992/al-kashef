import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { deleteCollection, isRekognitionConfigured } from "@/lib/rekognition";

async function getEventForUser(userId: string, eventId: string) {
  const tenantUser = await db.tenantUser.findFirst({
    where: { clerkUserId: userId },
    select: { tenantId: true },
  });
  if (!tenantUser) return null;
  return db.event.findUnique({
    where: { id: eventId, tenantId: tenantUser.tenantId },
  });
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const event = await getEventForUser(userId, id);
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(event);
}

const patchSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  type: z.enum(["WEDDING", "CONFERENCE", "GRADUATION", "CORPORATE", "BIRTHDAY", "OTHER"]).optional(),
  date: z.string().optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).optional(),
  password: z.string().max(100).optional().nullable(),
  downloadEnabled: z.boolean().optional(),
  faceSearchEnabled: z.boolean().optional(),
  galleryPublic: z.boolean().optional(),
  watermarkEnabled: z.boolean().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const event = await getEventForUser(userId, id);
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  const updated = await db.event.update({
    where: { id },
    data: {
      ...parsed.data,
      date: parsed.data.date ? new Date(parsed.data.date) : parsed.data.date === null ? null : undefined,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const event = await getEventForUser(userId, id);
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Clean up Rekognition collection if face search was used
  if (event.faceSearchEnabled && await isRekognitionConfigured()) {
    await deleteCollection(event.tenantId, id).catch(() => {});
  }

  await db.event.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
