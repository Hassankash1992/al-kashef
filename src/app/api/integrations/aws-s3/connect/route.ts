import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { encrypt } from "@/lib/crypto";
import { S3Adapter } from "@/lib/storage-adapter";
import { z } from "zod";

const schema = z.object({
  accessKeyId: z.string().min(16).max(128),
  secretAccessKey: z.string().min(16).max(256),
  bucket: z.string().min(3).max(63),
  region: z.string().min(1).max(50),
  cdnUrl: z.string().url().optional().or(z.literal("")),
  setAsDefault: z.boolean().default(false),
});

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantUser = await db.tenantUser.findFirst({
    where: { clerkUserId: userId },
    select: { tenantId: true },
  });
  if (!tenantUser) return NextResponse.json({ error: "No tenant" }, { status: 404 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  const { accessKeyId, secretAccessKey, bucket, region, cdnUrl, setAsDefault } = parsed.data;
  const { tenantId } = tenantUser;

  // Test connection before saving
  const adapter = new S3Adapter({ accessKeyId, secretAccessKey, bucket, region, cdnUrl: cdnUrl || undefined });
  const test = await adapter.testConnection();
  if (!test.ok) {
    return NextResponse.json({ error: `فشل اختبار الاتصال: ${test.message}` }, { status: 400 });
  }

  // Save integration with encrypted credentials
  await db.integration.upsert({
    where: { tenantId_type: { tenantId, type: "AWS_S3" } },
    create: {
      tenantId,
      type: "AWS_S3",
      connected: true,
      config: {
        encryptedAccessKey: encrypt(accessKeyId),
        encryptedSecretKey: encrypt(secretAccessKey),
        bucket,
        region,
        cdnUrl: cdnUrl || null,
      },
    },
    update: {
      connected: true,
      config: {
        encryptedAccessKey: encrypt(accessKeyId),
        encryptedSecretKey: encrypt(secretAccessKey),
        bucket,
        region,
        cdnUrl: cdnUrl || null,
      },
    },
  });

  // Optionally set as default storage for the tenant
  if (setAsDefault) {
    await db.storageConfig.upsert({
      where: { tenantId },
      create: {
        tenantId,
        provider: "AWS_S3",
        accessKey: encrypt(accessKeyId),
        secretKey: encrypt(secretAccessKey),
        bucket,
        region,
        cdnUrl: cdnUrl || null,
      },
      update: {
        provider: "AWS_S3",
        accessKey: encrypt(accessKeyId),
        secretKey: encrypt(secretAccessKey),
        bucket,
        region,
        cdnUrl: cdnUrl || null,
      },
    });
  }

  return NextResponse.json({ success: true, message: "تم ربط AWS S3 بنجاح" });
}
