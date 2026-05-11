import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function DELETE() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantUser = await db.tenantUser.findFirst({
    where: { clerkUserId: userId },
    select: { tenantId: true },
  });
  if (!tenantUser) return NextResponse.json({ error: "No tenant" }, { status: 404 });

  await db.integration.updateMany({
    where: { tenantId: tenantUser.tenantId, type: "GOOGLE_DRIVE" },
    data: {
      connected: false,
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
      config: {},
    },
  });

  return NextResponse.json({ success: true });
}
