/**
 * Main worker process.
 *
 * Job pipeline per photo:
 *   upload → process-image (thumbnails) → index-faces (Rekognition)
 *
 * Start: npm run worker
 */

import "dotenv/config";
import { Worker, Queue, type Job } from "bullmq";
import IORedis from "ioredis";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import path from "path";
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { runImport, type SourceProvider } from "../src/lib/integrations/importer";
import {
  indexPhotoFaces,
  removeFacesForPhoto,
  ensureCollection,
  isRekognitionConfigured,
} from "../src/lib/rekognition";

let sharp: any;
try {
  sharp = require("sharp");
} catch {
  console.warn("⚠️ Sharp not available — thumbnails skipped");
}

// ─── Connections ──────────────────────────────────────────────────────────────

const redisConnection = new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});
const BUCKET = process.env.R2_BUCKET_NAME!;

const imageQueue = new Queue("image-processing", { connection: redisConnection });

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function downloadFromR2(key: string): Promise<Buffer> {
  const obj = await r2.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
  const chunks: Buffer[] = [];
  for await (const chunk of obj.Body as any) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks);
}

async function uploadToR2(key: string, data: Buffer, contentType: string): Promise<void> {
  await r2.send(new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: data, ContentType: contentType }));
}

// ─── Worker ───────────────────────────────────────────────────────────────────

const worker = new Worker(
  "image-processing",
  async (job: Job) => {
    const { name, data } = job;

    // ── 1. Drive Import ──────────────────────────────────────────────────────
    if (name === "import-from-drive") {
      const { jobId, tenantId, eventId, provider, sourceFolderId, syncMode } = data;
      console.log(`[Import] ${provider} job=${jobId}`);
      await runImport({
        jobId, tenantId, eventId,
        provider: provider as SourceProvider,
        sourceFolderId,
        syncMode,
      });
      return;
    }

    // ── 2. Image Processing (thumbnails + previews) ──────────────────────────
    if (name === "process-image") {
      const { photoId, eventId, tenantId, storageKey } = data;
      console.log(`[Image] photo=${photoId}`);

      await db.photo.update({ where: { id: photoId }, data: { status: "PROCESSING" } });

      try {
        const original = await downloadFromR2(storageKey);
        const ext = ".jpg";
        const baseName = path.basename(storageKey, path.extname(storageKey));
        const dir = path.dirname(storageKey).replace(/\/photos$/, "");

        let thumbnailKey: string | null = null;
        let previewKey: string | null = null;
        let width: number | null = null;
        let height: number | null = null;

        if (sharp) {
          const meta = await sharp(original).metadata();
          width = meta.width ?? null;
          height = meta.height ?? null;

          const thumbBuf = await sharp(original)
            .resize(400, 400, { fit: "inside", withoutEnlargement: true })
            .jpeg({ quality: 80 })
            .toBuffer();
          thumbnailKey = `${dir}/thumbnails/${baseName}${ext}`;
          await uploadToR2(thumbnailKey, thumbBuf, "image/jpeg");

          const previewBuf = await sharp(original)
            .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
            .jpeg({ quality: 85 })
            .toBuffer();
          previewKey = `${dir}/previews/${baseName}${ext}`;
          await uploadToR2(previewKey, previewBuf, "image/jpeg");
        }

        await db.photo.update({
          where: { id: photoId },
          data: { status: "PROCESSED", thumbnailKey, previewKey, width, height },
        });

        // ── Queue face indexing if event has it enabled ──
        const event = await db.event.findUnique({
          where: { id: eventId },
          select: { faceSearchEnabled: true },
        });

        if (event?.faceSearchEnabled && await isRekognitionConfigured()) {
          await imageQueue.add("index-faces", {
            photoId, eventId, tenantId,
            imageKey: thumbnailKey ?? storageKey,
          }, {
            attempts: 3,
            backoff: { type: "exponential", delay: 3000 },
          });
        }

        console.log(`[Image] Done: ${photoId}`);
      } catch (err) {
        console.error(`[Image] Failed: ${photoId}`, err);
        await db.photo.update({ where: { id: photoId }, data: { status: "FAILED" } });
        throw err;
      }
      return;
    }

    // ── 3. Face Indexing (Rekognition) ───────────────────────────────────────
    if (name === "index-faces") {
      const { photoId, eventId, tenantId, imageKey } = data;
      console.log(`[Face] Indexing photo=${photoId} event=${eventId}`);

      try {
        // Remove any previously indexed faces for this photo (idempotent re-index)
        const existingFaces = await db.photoFace.findMany({
          where: { photoId },
          select: { faceId: true },
        });
        if (existingFaces.length > 0) {
          await removeFacesForPhoto(tenantId, eventId, existingFaces.map((f) => f.faceId));
          await db.photoFace.deleteMany({ where: { photoId } });
        }

        const imageBuffer = await downloadFromR2(imageKey);
        const indexedFaces = await indexPhotoFaces(tenantId, eventId, photoId, imageBuffer);

        if (indexedFaces.length > 0) {
          await db.photoFace.createMany({
            data: indexedFaces.map((f) => ({
              photoId,
              faceId: f.faceId,
              confidence: f.confidence,
              boundingBox: f.boundingBox as any,
            })),
          });
        }

        await db.photo.update({
          where: { id: photoId },
          data: { faceIndexed: true, status: "FACE_INDEXED" },
        });

        console.log(`[Face] Done: ${photoId} — ${indexedFaces.length} face(s) indexed`);
      } catch (err: any) {
        console.error(`[Face] Failed: ${photoId}`, err.message);
        // Don't fail the whole photo — face indexing is best-effort
        await db.photo.update({ where: { id: photoId }, data: { faceIndexed: false } });
      }
      return;
    }

    // ── 4. Bulk Re-index (trigger from dashboard) ────────────────────────────
    if (name === "reindex-event") {
      const { eventId, tenantId } = data;
      console.log(`[Reindex] event=${eventId}`);

      const photos = await db.photo.findMany({
        where: { eventId, status: { in: ["PROCESSED", "FACE_INDEXED"] } },
        select: { id: true, thumbnailKey: true, storageKey: true },
      });

      for (const photo of photos) {
        await imageQueue.add("index-faces", {
          photoId: photo.id,
          eventId,
          tenantId,
          imageKey: photo.thumbnailKey ?? photo.storageKey,
        }, { attempts: 3, backoff: { type: "exponential", delay: 2000 } });
      }

      console.log(`[Reindex] Queued ${photos.length} photos for event=${eventId}`);
      return;
    }
  },
  { connection: redisConnection, concurrency: 5 }
);

worker.on("completed", (job) => console.log(`✓ ${job.name}:${job.id}`));
worker.on("failed", (job, err) => console.error(`✗ ${job?.name}:${job?.id} — ${err.message}`));

process.on("SIGTERM", async () => {
  await worker.close();
  await db.$disconnect();
  process.exit(0);
});

console.log("🚀 Worker started — queues: image-processing [process-image | index-faces | import-from-drive | reindex-event]");
