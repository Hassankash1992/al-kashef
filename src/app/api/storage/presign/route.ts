import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUploadPresignedUrl, buildKey } from "@/lib/storage";
import { DEFAULT_PLAN_LIMITS, withinLimit } from "@/lib/plans";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import path from "path";

const schema = z.object({
  eventId: z.string(),
  filename: z.string(),
  contentType: z.string().regex(/^image\//),
  size: z.number().max(20 * 1024 * 1024),
});

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantUser = await db.tenantUser.findFirst({
    where: { clerkUserId: userId },
    include: { tenant: true },
  });
  if (!tenantUser) return NextResponse.json({ error: "No tenant" }, { status: 404 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  const { eventId, filename, contentType, size } = parsed.data;
  const { tenant } = tenantUser;

  const event = await db.event.findUnique({
    where: { id: eventId, tenantId: tenant.id },
    select: { id: true },
  });
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  // ── Plan limits ───────────────────────────────────────────────────────────
  const planKey = tenant.plan as "STARTER" | "PRO" | "AGENCY";
  const planConfig = (await db.planConfig.findUnique({ where: { plan: planKey as any } }))
    ?? DEFAULT_PLAN_LIMITS[planKey];

  // 1. Photo count per event
  const photoCount = await db.photo.count({
    where: { eventId, tenantId: tenant.id, status: { not: "DELETED" } },
  });
  if (!withinLimit(photoCount, planConfig.maxPhotosPerEvent)) {
    return NextResponse.json(
      { error: `وصلت للحد الأقصى من الصور (${planConfig.maxPhotosPerEvent}) في هذه الفعالية. قم بترقية الباقة.` },
      { status: 403 }
    );
  }

  // 2. Total storage
  const storageUsed = Number(tenant.storageUsedBytes);
  const storageMaxBytes = planConfig.maxStorageGB === -1 ? Infinity : planConfig.maxStorageGB * 1024 * 1024 * 1024;
  if (storageUsed + size > storageMaxBytes) {
    return NextResponse.json(
      { error: `التخزين ممتلئ. حدك ${planConfig.maxStorageGB}GB. قم بترقية الباقة أو احذف صوراً.` },
      { status: 403 }
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  const ext = path.extname(filename) || ".jpg";
  const uniqueFilename = `${uuidv4()}${ext}`;
  const storageKey = buildKey(tenant.id, eventId, uniqueFilename);

  const presignedUrl = await getUploadPresignedUrl(storageKey, contentType);

  const [photo] = await db.$transaction([
    db.photo.create({
      data: {
        tenantId: tenant.id,
        eventId,
        storageKey,
        originalName: filename,
        mimeType: contentType,
        size,
        status: "UPLOADED",
      },
    }),
    db.tenant.update({
      where: { id: tenant.id },
      data: { storageUsedBytes: { increment: size } },
    }),
  ]);

  return NextResponse.json({ presignedUrl, photoId: photo.id, storageKey });
}
