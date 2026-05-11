import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { deleteObject } from "@/lib/storage";

async function getEventForUser(userId: string, eventId: string) {
  const tenantUser = await db.tenantUser.findFirst({
    where: { clerkUserId: userId },
    select: { tenantId: true },
  });
  if (!tenantUser) return null;
  return db.event.findUnique({
    where: { id: eventId, tenantId: tenantUser.tenantId },
    select: { id: true, tenantId: true },
  });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const event = await getEventForUser(userId, id);
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { photoIds } = await req.json();
  if (!Array.isArray(photoIds) || photoIds.length === 0) {
    return NextResponse.json({ error: "No photos specified" }, { status: 400 });
  }

  const photos = await db.photo.findMany({
    where: { id: { in: photoIds }, eventId: id, tenantId: event.tenantId },
    select: { id: true, storageKey: true, thumbnailKey: true, previewKey: true, size: true },
  });

  await Promise.allSettled(
    photos.flatMap((p) =>
      [p.storageKey, p.thumbnailKey, p.previewKey]
        .filter(Boolean)
        .map((key) => deleteObject(key!))
    )
  );

  const totalFreed = photos.reduce((sum, p) => sum + (p.size ?? 0), 0);

  await db.$transaction([
    db.photo.updateMany({
      where: { id: { in: photos.map((p) => p.id) } },
      data: { status: "DELETED" },
    }),
    db.event.update({
      where: { id },
      data: { totalPhotos: { decrement: photos.length } },
    }),
    db.tenant.update({
      where: { id: event.tenantId },
      data: { storageUsedBytes: { decrement: totalFreed } },
    }),
  ]);

  return NextResponse.json({ deleted: photos.length });
}
