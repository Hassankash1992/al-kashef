import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const VALID_TYPES = ["GOOGLE_DRIVE", "AWS_S3", "CLOUDFLARE_R2"] as const;

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ type: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { type } = await params;
  const upperType = type.toUpperCase().replace(/-/g, "_");

  if (!VALID_TYPES.includes(upperType as any)) {
    return NextResponse.json({ error: "نوع تكامل غير صحيح" }, { status: 400 });
  }

  const tenantUser = await db.tenantUser.findFirst({
    where: { clerkUserId: userId },
    select: { tenantId: true },
  });
  if (!tenantUser) return NextResponse.json({ error: "No tenant" }, { status: 404 });

  await db.integration.updateMany({
    where: { tenantId: tenantUser.tenantId, type: upperType as any },
    data: {
      connected: false,
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
      config: {},
    },
  });

  // If this was the default storage, revert to platform
  if (upperType === "AWS_S3" || upperType === "CLOUDFLARE_R2") {
    const storageConfig = await db.storageConfig.findUnique({
      where: { tenantId: tenantUser.tenantId },
    });
    if (storageConfig?.provider === upperType) {
      await db.storageConfig.update({
        where: { tenantId: tenantUser.tenantId },
        data: { provider: "PLATFORM", accessKey: null, secretKey: null, bucket: null, region: null, endpoint: null, cdnUrl: null },
      });
    }
  }

  return NextResponse.json({ success: true });
}
