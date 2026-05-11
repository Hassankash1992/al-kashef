/**
 * Unified storage abstraction.
 * The rest of the system never cares where data actually lives.
 * Swap provider without touching business logic.
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { decrypt } from "./crypto";

// ─── Interface ────────────────────────────────────────────────────────────────

export interface StorageAdapter {
  /** Upload a buffer and return the final public/signed URL */
  upload(key: string, data: Buffer, contentType: string): Promise<string>;
  /** Get a public URL (CDN or signed) for a key */
  getPublicUrl(key: string): string;
  /** Generate a presigned PUT URL for direct browser upload */
  getPresignedUploadUrl(key: string, contentType: string, expiresIn?: number): Promise<string>;
  /** Generate a presigned GET URL for temporary download */
  getPresignedDownloadUrl(key: string, expiresIn?: number): Promise<string>;
  /** Delete an object */
  delete(key: string): Promise<void>;
  /** Test that the credentials work — throws if not */
  testConnection(): Promise<{ ok: boolean; message: string }>;
  /** The provider name */
  provider: string;
}

// ─── Cloudflare R2 (Platform default) ────────────────────────────────────────

export class R2Adapter implements StorageAdapter {
  readonly provider = "CLOUDFLARE_R2";
  private client: S3Client;
  private bucket: string;
  private cdnUrl: string;

  constructor(opts?: {
    accountId?: string;
    accessKeyId?: string;
    secretAccessKey?: string;
    bucket?: string;
    cdnUrl?: string;
  }) {
    const accountId = opts?.accountId ?? process.env.R2_ACCOUNT_ID!;
    this.bucket = opts?.bucket ?? process.env.R2_BUCKET_NAME!;
    this.cdnUrl = (opts?.cdnUrl ?? process.env.R2_PUBLIC_URL!).replace(/\/$/, "");
    this.client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: opts?.accessKeyId ?? process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: opts?.secretAccessKey ?? process.env.R2_SECRET_ACCESS_KEY!,
      },
    });
  }

  async upload(key: string, data: Buffer, contentType: string): Promise<string> {
    await this.client.send(
      new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: data, ContentType: contentType })
    );
    return this.getPublicUrl(key);
  }

  getPublicUrl(key: string): string {
    return `${this.cdnUrl}/${key}`;
  }

  async getPresignedUploadUrl(key: string, contentType: string, expiresIn = 3600): Promise<string> {
    return getSignedUrl(
      this.client,
      new PutObjectCommand({ Bucket: this.bucket, Key: key, ContentType: contentType }),
      { expiresIn }
    );
  }

  async getPresignedDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
    return getSignedUrl(
      this.client,
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      { expiresIn }
    );
  }

  async delete(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  async testConnection(): Promise<{ ok: boolean; message: string }> {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
      return { ok: true, message: "الاتصال ناجح" };
    } catch (err: any) {
      return { ok: false, message: err.message ?? "فشل الاتصال" };
    }
  }
}

// ─── AWS S3 ───────────────────────────────────────────────────────────────────

export class S3Adapter implements StorageAdapter {
  readonly provider = "AWS_S3";
  private client: S3Client;
  private bucket: string;
  private cdnUrl?: string;
  private region: string;

  constructor(opts: {
    accessKeyId: string;
    secretAccessKey: string;
    bucket: string;
    region: string;
    cdnUrl?: string;
  }) {
    this.bucket = opts.bucket;
    this.region = opts.region;
    this.cdnUrl = opts.cdnUrl?.replace(/\/$/, "");
    this.client = new S3Client({
      region: opts.region,
      credentials: {
        accessKeyId: opts.accessKeyId,
        secretAccessKey: opts.secretAccessKey,
      },
    });
  }

  async upload(key: string, data: Buffer, contentType: string): Promise<string> {
    await this.client.send(
      new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: data, ContentType: contentType })
    );
    return this.getPublicUrl(key);
  }

  getPublicUrl(key: string): string {
    if (this.cdnUrl) return `${this.cdnUrl}/${key}`;
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
  }

  async getPresignedUploadUrl(key: string, contentType: string, expiresIn = 3600): Promise<string> {
    return getSignedUrl(
      this.client,
      new PutObjectCommand({ Bucket: this.bucket, Key: key, ContentType: contentType }),
      { expiresIn }
    );
  }

  async getPresignedDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
    return getSignedUrl(
      this.client,
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      { expiresIn }
    );
  }

  async delete(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  async testConnection(): Promise<{ ok: boolean; message: string }> {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
      return { ok: true, message: "الاتصال ناجح" };
    } catch (err: any) {
      const msg = err.$metadata?.httpStatusCode === 403 ? "خطأ في الصلاحيات — تحقق من الـ Access Key" : err.message;
      return { ok: false, message: msg };
    }
  }
}

// ─── Factory: resolve adapter from DB config ──────────────────────────────────

export interface TenantStorageConfig {
  provider: string;
  accessKey?: string | null;
  secretKey?: string | null;
  bucket?: string | null;
  region?: string | null;
  endpoint?: string | null;
  cdnUrl?: string | null;
}

export function getStorageAdapter(config?: TenantStorageConfig | null): StorageAdapter {
  if (!config || config.provider === "PLATFORM") {
    return new R2Adapter();
  }

  const accessKey = config.accessKey ? decrypt(config.accessKey) : "";
  const secretKey = config.secretKey ? decrypt(config.secretKey) : "";

  if (config.provider === "AWS_S3") {
    return new S3Adapter({
      accessKeyId: accessKey,
      secretAccessKey: secretKey,
      bucket: config.bucket!,
      region: config.region ?? "us-east-1",
      cdnUrl: config.cdnUrl ?? undefined,
    });
  }

  if (config.provider === "CLOUDFLARE_R2") {
    const accountId = config.endpoint ?? "";
    return new R2Adapter({
      accountId,
      accessKeyId: accessKey,
      secretAccessKey: secretKey,
      bucket: config.bucket!,
      cdnUrl: config.cdnUrl ?? undefined,
    });
  }

  return new R2Adapter();
}

// ─── Key builders ─────────────────────────────────────────────────────────────

export function buildPhotoKey(tenantId: string, eventId: string, filename: string) {
  return `tenants/${tenantId}/events/${eventId}/photos/${filename}`;
}
export function buildThumbnailKey(tenantId: string, eventId: string, filename: string) {
  return `tenants/${tenantId}/events/${eventId}/thumbnails/${filename}`;
}
export function buildPreviewKey(tenantId: string, eventId: string, filename: string) {
  return `tenants/${tenantId}/events/${eventId}/previews/${filename}`;
}
