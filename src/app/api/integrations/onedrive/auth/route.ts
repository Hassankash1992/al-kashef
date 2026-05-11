import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUrl } from "@/lib/integrations/onedrive";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantUser = await db.tenantUser.findFirst({
    where: { clerkUserId: userId },
    select: { tenantId: true },
  });
  if (!tenantUser) return NextResponse.json({ error: "No tenant" }, { status: 404 });

  if (!process.env.ONEDRIVE_CLIENT_ID) {
    return NextResponse.json({ error: "OneDrive غير مهيأ — أضف ONEDRIVE_CLIENT_ID في .env" }, { status: 503 });
  }

  return NextResponse.redirect(getAuthUrl(tenantUser.tenantId));
}
