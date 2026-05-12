import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isFaceRecognitionConfigured, indexPhotoFace } from "@/lib/face-recognition";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

export const maxDuration = 60; // Vercel Pro/Hobby allow up to 60s for /api routes

const PLATFORM_S3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
  },
});
const PLATFORM_BUCKET = process.env.R2_BUCKET_NAME ?? "al-kashef-photos";

const BATCH_SIZE = 5; // photos per request

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
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
    return NextResponse.json({ error: "البحث بالوجه غير مفعّل لهذه الفعالية" }, { status: 400 });
  }

  if (!await isFaceRecognitionConfigured()) {
    return NextResponse.json({ error: "خدمة التعرف على الوجوه غير مهيأة" }, { status: 503 });
  }

  // Pick a small batch of unindexed photos
  const photos = await db.photo.findMany({
    where: {
      eventId,
      tenantId: tenantUser.tenantId,
      status: { not: "DELETED" },
      faceIndexed: false,
    },
    select: { id: true, storageKey: true },
    take: BATCH_SIZE,
  });

  if (photos.length === 0) {
    return NextResponse.json({
      done: true,
      processed: 0,
      remaining: 0,
      message: "كل الصور مفهرسة بالفعل",
    });
  }

  // Process SEQUENTIALLY (Face++ free tier has 5 RPS limit)
  let succeeded = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const photo of photos) {
    try {
      const obj = await PLATFORM_S3.send(
        new GetObjectCommand({ Bucket: PLATFORM_BUCKET, Key: photo.storageKey })
      );
      const buffer = Buffer.from(await obj.Body!.transformToByteArray());
      await indexPhotoFace(tenantUser.tenantId, eventId, photo.id, buffer);
      await db.photo.update({
        where: { id: photo.id },
        data: { status: "FACE_INDEXED", faceIndexed: true },
      });
      succeeded++;
    } catch (err: any) {
      failed++;
      const msg = err?.message ?? "unknown";
      errors.push(`${photo.id}: ${msg}`);
      console.error(`[reindex] photo ${photo.id} failed:`, msg);
      // Mark photo so we know it tried (for now still keep faceIndexed=false to allow retry)
    }
  }

  // Count remaining
  const remaining = await db.photo.count({
    where: {
      eventId,
      tenantId: tenantUser.tenantId,
      status: { not: "DELETED" },
      faceIndexed: false,
    },
  });

  return NextResponse.json({
    done: remaining === 0,
    processed: succeeded,
    failed,
    remaining,
    errors: errors.slice(0, 5), // first 5 errors for debugging
    message: remaining > 0
      ? `تمت فهرسة ${succeeded}، باقي ${remaining}${failed > 0 ? ` (${failed} فشلت)` : ""}`
      : `اكتملت فهرسة جميع الصور`,
  });
}
