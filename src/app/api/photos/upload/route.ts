import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getImageProcessingQueue } from "@/lib/queue";

export const maxDuration = 60; // allow synchronous processing on Vercel

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantUser = await db.tenantUser.findFirst({
    where: { clerkUserId: userId },
    select: { tenantId: true },
  });
  if (!tenantUser) return NextResponse.json({ error: "No tenant" }, { status: 404 });

  const { photoId, eventId } = await req.json();

  const photo = await db.photo.findUnique({
    where: { id: photoId, tenantId: tenantUser.tenantId, eventId },
    select: { id: true, storageKey: true },
  });
  if (!photo) return NextResponse.json({ error: "Photo not found" }, { status: 404 });

  await db.photo.update({ where: { id: photoId }, data: { status: "PROCESSING" } });
  await db.event.update({ where: { id: eventId }, data: { totalPhotos: { increment: 1 } } });

  // Try BullMQ queue first
  let queued = false;
  try {
    await getImageProcessingQueue().add("process-image", {
      photoId,
      eventId,
      tenantId: tenantUser.tenantId,
      storageKey: photo.storageKey,
    }, {
      attempts: 3,
      backoff: { type: "exponential", delay: 2000 },
    });
    queued = true;
  } catch {
    queued = false;
  }

  if (queued) {
    // Worker will handle it asynchronously
    return NextResponse.json({ success: true, mode: "async" });
  }

  // No worker — process synchronously (await) so it actually completes on Vercel
  try {
    const { processPhotoInline } = await import("@/lib/image-processor");
    await processPhotoInline(photoId);
    return NextResponse.json({ success: true, mode: "inline" });
  } catch (err: any) {
    console.error("[upload] inline processing failed:", err?.message);
    return NextResponse.json({ success: true, mode: "inline-failed", warning: err?.message });
  }
}
