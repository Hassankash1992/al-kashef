import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getImageProcessingQueue } from "@/lib/queue";
import { isRekognitionConfigured } from "@/lib/rekognition";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: eventId } = await params;

  const tenantUser = await db.tenantUser.findFirst({
    where: { clerkUserId: userId },
    select: { tenantId: true },
  });
  if (!tenantUser) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  const event = await db.event.findUnique({
    where: { id: eventId, tenantId: tenantUser.tenantId },
    select: { id: true, faceSearchEnabled: true },
  });
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!event.faceSearchEnabled) {
    return NextResponse.json({ error: "Face search not enabled for this event" }, { status: 400 });
  }

  if (!await isRekognitionConfigured()) {
    return NextResponse.json({ error: "Rekognition not configured" }, { status: 503 });
  }

  await getImageProcessingQueue().add(
    "reindex-event",
    { eventId, tenantId: tenantUser.tenantId },
    { attempts: 2, backoff: { type: "fixed", delay: 5000 } }
  );

  return NextResponse.json({ success: true, message: "تم جدولة إعادة فهرسة الوجوه" });
}
