import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export const BUCKET = process.env.R2_BUCKET_NAME!;
export const CDN_URL = process.env.R2_PUBLIC_URL!;

export function getPublicUrl(key: string): string {
  return `${CDN_URL}/${key}`;
}

export function buildKey(tenantId: string, eventId: string, filename: string): string {
  return `tenants/${tenantId}/events/${eventId}/photos/${filename}`;
}

export function buildThumbnailKey(tenantId: string, eventId: string, filename: string): string {
  return `tenants/${tenantId}/events/${eventId}/thumbnails/${filename}`;
}

export function buildPreviewKey(tenantId: string, eventId: string, filename: string): string {
  return `tenants/${tenantId}/events/${eventId}/previews/${filename}`;
}

export async function getUploadPresignedUrl(
  key: string,
  contentType: string,
  expiresIn = 3600
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(r2Client, command, { expiresIn });
}

export async function getDownloadPresignedUrl(
  key: string,
  expiresIn = 3600
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });
  return getSignedUrl(r2Client, command, { expiresIn });
}

export async function deleteObject(key: string): Promise<void> {
  await r2Client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}

export { r2Client };
