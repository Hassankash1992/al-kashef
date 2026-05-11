import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUrl } from "@/lib/integrations/google-drive";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantUser = await db.tenantUser.findFirst({
    where: { clerkUserId: userId },
    select: { tenantId: true },
  });
  if (!tenantUser) return NextResponse.json({ error: "No tenant" }, { status: 404 });

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return NextResponse.json(
      { error: "Google OAuth غير مهيأ — أضف GOOGLE_CLIENT_ID و GOOGLE_CLIENT_SECRET في ملف .env" },
      { status: 503 }
    );
  }

  const url = getAuthUrl(tenantUser.tenantId);
  return NextResponse.redirect(url);
}
