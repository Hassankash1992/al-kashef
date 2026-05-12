import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import archiver from "archiver";
import { Readable } from "stream";

const PLATFORM_S3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
  },
});
const PLATFORM_BUCKET = process.env.R2_BUCKET_NAME ?? "al-kashef-photos";

export async function POST(req: Request) {
  const body = await req.json();
  const { eventId, photoIds } = body;

  if (!eventId || !Array.isArray(photoIds) || photoIds.length === 0) {
    return NextResponse.json({ error: "eventId و photoIds مطلوبان" }, { status: 400 });
  }
  if (photoIds.length > 500) {
    return NextResponse.json({ error: "الحد الأقصى 500 صورة في التحميل الواحد" }, { status: 400 });
  }

  const event = await db.event.findUnique({
    where: { id: eventId },
    select: { id: true, slug: true, name: true, downloadEnabled: true, tenantId: true },
  });
  if (!event) return NextResponse.json({ error: "الفعالية غير موجودة" }, { status: 404 });
  if (!event.downloadEnabled) return NextResponse.json({ error: "التحميل معطّل لهذه الفعالية" }, { status: 403 });

  const photos = await db.photo.findMany({
    where: {
      id: { in: photoIds },
      eventId: event.id,
      tenantId: event.tenantId,
      status: { not: "DELETED" },
    },
    select: { id: true, storageKey: true, originalName: true },
  });

  if (photos.length === 0) {
    return NextResponse.json({ error: "لا توجد صور صالحة للتحميل" }, { status: 404 });
  }

  const archive = archiver("zip", { zlib: { level: 6 } });
  const chunks: Uint8Array[] = [];
  const collector = new Promise<Buffer>((resolve, reject) => {
    archive.on("data", (chunk) => chunks.push(chunk));
    archive.on("end", () => resolve(Buffer.concat(chunks)));
    archive.on("error", reject);
  });

  for (const photo of photos) {
    try {
      const obj = await PLATFORM_S3.send(
        new GetObjectCommand({ Bucket: PLATFORM_BUCKET, Key: photo.storageKey })
      );
      const buffer = Buffer.from(await obj.Body!.transformToByteArray());
      const filename = photo.originalName || `${photo.id}.jpg`;
      archive.append(buffer, { name: filename });
    } catch (err) {
      console.error(`Failed to fetch photo ${photo.id}:`, err);
    }
  }

  archive.finalize();
  const zipBuffer = await collector;

  return new NextResponse(new Uint8Array(zipBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${event.slug}-photos.zip"`,
      "Content-Length": String(zipBuffer.length),
    },
  });
}
