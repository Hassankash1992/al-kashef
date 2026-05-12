/**
 * Remove duplicate photos (same originalName + size in same event).
 * Keeps the oldest, marks rest as DELETED.
 */
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: eventId } = await params;

  const tenantUser = await db.tenantUser.findFirst({
    where: { clerkUserId: userId },
    select: { tenantId: true },
  });
  if (!tenantUser) return NextResponse.json({ error: "No tenant" }, { status: 404 });

  // Find duplicates by (originalName, size)
  const photos = await db.photo.findMany({
    where: {
      eventId,
      tenantId: tenantUser.tenantId,
      status: { not: "DELETED" },
    },
    select: { id: true, originalName: true, size: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const seen = new Map<string, string>(); // key -> first id
  const toDelete: string[] = [];
  let totalSizeFreed = 0;

  for (const p of photos) {
    const key = `${p.originalName}|${p.size}`;
    if (seen.has(key)) {
      toDelete.push(p.id);
      totalSizeFreed += p.size ?? 0;
    } else {
      seen.set(key, p.id);
    }
  }

  if (toDelete.length === 0) {
    return NextResponse.json({ success: true, removed: 0, message: "لا يوجد تكرار" });
  }

  await db.$transaction([
    db.photo.updateMany({
      where: { id: { in: toDelete } },
      data: { status: "DELETED" },
    }),
    db.event.update({
      where: { id: eventId },
      data: { totalPhotos: { decrement: toDelete.length } },
    }),
    db.tenant.update({
      where: { id: tenantUser.tenantId },
      data: { storageUsedBytes: { decrement: totalSizeFreed } },
    }),
  ]);

  return NextResponse.json({
    success: true,
    removed: toDelete.length,
    message: `تم حذف ${toDelete.length} صورة مكررة`,
  });
}
