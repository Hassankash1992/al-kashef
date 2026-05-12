/**
 * Inline image processing — fallback when BullMQ worker is not running.
 * Generates thumbnail + preview from R2, uploads back, updates Photo row.
 */

import sharp from "sharp";
import { db } from "./db";
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { indexPhotoFace, isFaceRecognitionConfigured } from "./face-recognition";

const PLATFORM_S3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
  },
});
const PLATFORM_BUCKET = process.env.R2_BUCKET_NAME ?? "al-kashef-photos";

export async function processPhotoInline(photoId: string): Promise<void> {
  const photo = await db.photo.findUnique({
    where: { id: photoId },
    select: { id: true, storageKey: true, tenantId: true, eventId: true },
  });
  if (!photo) return;

  try {
    await db.photo.update({ where: { id: photoId }, data: { status: "PROCESSING" } });

    // Download original from R2
    const obj = await PLATFORM_S3.send(
      new GetObjectCommand({ Bucket: PLATFORM_BUCKET, Key: photo.storageKey })
    );
    const buffer = Buffer.from(await obj.Body!.transformToByteArray());

    // Generate thumbnail (400x400 max) and preview (1280x1280 max)
    const [thumbBuf, previewBuf] = await Promise.all([
      sharp(buffer).resize(400, 400, { fit: "inside" }).webp({ quality: 80 }).toBuffer(),
      sharp(buffer).resize(1280, 1280, { fit: "inside" }).webp({ quality: 85 }).toBuffer(),
    ]);

    const thumbKey = photo.storageKey.replace(/(\.[^.]+)?$/, "_thumb.webp");
    const previewKey = photo.storageKey.replace(/(\.[^.]+)?$/, "_preview.webp");

    await Promise.all([
      PLATFORM_S3.send(
        new PutObjectCommand({
          Bucket: PLATFORM_BUCKET,
          Key: thumbKey,
          Body: thumbBuf,
          ContentType: "image/webp",
        })
      ),
      PLATFORM_S3.send(
        new PutObjectCommand({
          Bucket: PLATFORM_BUCKET,
          Key: previewKey,
          Body: previewBuf,
          ContentType: "image/webp",
        })
      ),
    ]);

    const meta = await sharp(buffer).metadata();

    await db.photo.update({
      where: { id: photoId },
      data: {
        thumbnailKey: thumbKey,
        previewKey: previewKey,
        width: meta.width,
        height: meta.height,
        status: "PROCESSED",
      },
    });

    // Auto-index face if face recognition is configured
    if (await isFaceRecognitionConfigured()) {
      try {
        await indexPhotoFace(photo.tenantId, photo.eventId, photo.id, buffer);
        await db.photo.update({
          where: { id: photoId },
          data: { status: "FACE_INDEXED", faceIndexed: true },
        });
      } catch (indexErr: any) {
        // Indexing failed but thumbnail succeeded — keep PROCESSED status
        console.error(`Face indexing failed for photo ${photoId}:`, indexErr.message);
      }
    }
  } catch (err: any) {
    console.error(`Failed to process photo ${photoId}:`, err);
    await db.photo.update({
      where: { id: photoId },
      data: { status: "FAILED" },
    });
  }
}
