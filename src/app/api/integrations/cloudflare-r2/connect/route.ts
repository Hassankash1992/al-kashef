import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { encrypt } from "@/lib/crypto";
import { R2Adapter } from "@/lib/storage-adapter";
import { z } from "zod";

const schema = z.object({
  accountId: z.string().min(10),
  accessKeyId: z.string().min(16),
  secretAccessKey: z.string().min(16),
  bucket: z.string().min(3),
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

  const { accountId, accessKeyId, secretAccessKey, bucket, cdnUrl, setAsDefault } = parsed.data;
  const { tenantId } = tenantUser;

  // Test connection
  const adapter = new R2Adapter({ accountId, accessKeyId, secretAccessKey, bucket, cdnUrl: cdnUrl || undefined });
  const test = await adapter.testConnection();
  if (!test.ok) {
    return NextResponse.json({ error: `فشل اختبار الاتصال: ${test.message}` }, { status: 400 });
  }

  // Save integration
  await db.integration.upsert({
    where: { tenantId_type: { tenantId, type: "CLOUDFLARE_R2" } },
    create: {
      tenantId,
      type: "CLOUDFLARE_R2",
      connected: true,
      config: {
        encryptedAccessKey: encrypt(accessKeyId),
        encryptedSecretKey: encrypt(secretAccessKey),
        accountId,
        bucket,
        cdnUrl: cdnUrl || null,
      },
    },
    update: {
      connected: true,
      config: {
        encryptedAccessKey: encrypt(accessKeyId),
        encryptedSecretKey: encrypt(secretAccessKey),
        accountId,
        bucket,
        cdnUrl: cdnUrl || null,
      },
    },
  });

  if (setAsDefault) {
    await db.storageConfig.upsert({
      where: { tenantId },
      create: {
        tenantId,
        provider: "CLOUDFLARE_R2",
        accessKey: encrypt(accessKeyId),
        secretKey: encrypt(secretAccessKey),
        bucket,
        endpoint: accountId,
        cdnUrl: cdnUrl || null,
      },
      update: {
        provider: "CLOUDFLARE_R2",
        accessKey: encrypt(accessKeyId),
        secretKey: encrypt(secretAccessKey),
        bucket,
        endpoint: accountId,
        cdnUrl: cdnUrl || null,
      },
    });
  }

  return NextResponse.json({ success: true, message: "تم ربط Cloudflare R2 بنجاح" });
}
