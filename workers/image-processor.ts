import { Worker } from "bullmq";
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import IORedis from "ioredis";
import { PrismaClient } from "@prisma/client";
import path from "path";

// Dynamic import for sharp (Windows compatibility)
let sharp: any;
try {
  sharp = require("sharp");
} catch {
  console.warn("Sharp not available — thumbnails will be skipped");
}

const connection = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

const db = new PrismaClient();

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.R2_BUCKET_NAME!;

const worker = new Worker(
  "image-processing",
  async (job) => {
    const { photoId, eventId, tenantId, storageKey } = job.data;
    console.log(`Processing photo ${photoId}...`);

    await db.photo.update({ where: { id: photoId }, data: { status: "PROCESSING" } });

    try {
      // Download original from R2
      const getCmd = new GetObjectCommand({ Bucket: BUCKET, Key: storageKey });
      const obj = await r2.send(getCmd);
      const chunks: Buffer[] = [];
      for await (const chunk of obj.Body as any) {
        chunks.push(Buffer.from(chunk));
      }
      const originalBuffer = Buffer.concat(chunks);

      const ext = path.extname(storageKey) || ".jpg";
      const baseName = path.basename(storageKey, ext);
      const dir = path.dirname(storageKey).replace("/photos/", "/");

      let thumbnailKey: string | null = null;
      let previewKey: string | null = null;
      let width: number | null = null;
      let height: number | null = null;

      if (sharp) {
        const image = sharp(originalBuffer);
        const meta = await image.metadata();
        width = meta.width ?? null;
        height = meta.height ?? null;

        // Generate thumbnail (400px)
        const thumbBuffer = await sharp(originalBuffer).resize(400, 400, { fit: "inside", withoutEnlargement: true }).jpeg({ quality: 80 }).toBuffer();
        thumbnailKey = `${dir}/thumbnails/${baseName}.jpg`;
        await r2.send(new PutObjectCommand({
          Bucket: BUCKET,
          Key: thumbnailKey,
          Body: thumbBuffer,
          ContentType: "image/jpeg",
        }));

        // Generate preview (1200px)
        const previewBuffer = await sharp(originalBuffer).resize(1200, 1200, { fit: "inside", withoutEnlargement: true }).jpeg({ quality: 85 }).toBuffer();
        previewKey = `${dir}/previews/${baseName}.jpg`;
        await r2.send(new PutObjectCommand({
          Bucket: BUCKET,
          Key: previewKey,
          Body: previewBuffer,
          ContentType: "image/jpeg",
        }));
      }

      await db.photo.update({
        where: { id: photoId },
        data: {
          status: "PROCESSED",
          thumbnailKey,
          previewKey,
          width,
          height,
        },
      });

      console.log(`Photo ${photoId} processed successfully`);
    } catch (err) {
      console.error(`Failed to process photo ${photoId}:`, err);
      await db.photo.update({
        where: { id: photoId },
        data: { status: "FAILED" },
      });
      throw err;
    }
  },
  { connection, concurrency: 5 }
);

worker.on("completed", (job) => console.log(`Job ${job.id} completed`));
worker.on("failed", (job, err) => console.error(`Job ${job?.id} failed:`, err));

console.log("Image processing worker started");
