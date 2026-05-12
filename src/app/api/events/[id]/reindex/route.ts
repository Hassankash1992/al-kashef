import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isFaceRecognitionConfigured, indexPhotoFace } from "@/lib/face-recognition";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

const PLATFORM_S3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
  },
});
const PLATFORM_BUCKET = process.env.R2_BUCKET_NAME ?? "al-kashef-photos";

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

  const photos = await db.photo.findMany({
    where: {
      eventId,
      tenantId: tenantUser.tenantId,
      status: { not: "DELETED" },
      faceIndexed: false,
    },
    select: { id: true, storageKey: true },
  });

  // Fire-and-forget: index in background, return immediately
  indexAllPhotosBackground(photos, tenantUser.tenantId, eventId).catch(console.error);

  return NextResponse.json({
    success: true,
    queued: photos.length,
    message: `تم جدولة فهرسة ${photos.length} صورة في الخلفية`,
  });
}

async function indexAllPhotosBackground(
  photos: { id: string; storageKey: string }[],
  tenantId: string,
  eventId: string
): Promise<void> {
  for (const photo of photos) {
    try {
      const obj = await PLATFORM_S3.send(
        new GetObjectCommand({ Bucket: PLATFORM_BUCKET, Key: photo.storageKey })
      );
      const buffer = Buffer.from(await obj.Body!.transformToByteArray());
      await indexPhotoFace(tenantId, eventId, photo.id, buffer);
      await db.photo.update({
        where: { id: photo.id },
        data: { status: "FACE_INDEXED", faceIndexed: true },
      });
    } catch (err: any) {
      console.error(`Failed to index photo ${photo.id}:`, err.message);
    }
  }
}
