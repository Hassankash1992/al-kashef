import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// DELETE — حذف دومين
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const tenantUser = await db.tenantUser.findFirst({
    where: { clerkUserId: userId },
    select: { tenantId: true },
  });
  if (!tenantUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const domain = await db.domain.findUnique({ where: { id } });
  if (!domain || domain.tenantId !== tenantUser.tenantId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.domain.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

// POST /api/domains/[id]/verify — تشغيل التحقق
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const tenantUser = await db.tenantUser.findFirst({
    where: { clerkUserId: userId },
    select: { tenantId: true },
  });
  if (!tenantUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const domain = await db.domain.findUnique({ where: { id } });
  if (!domain || domain.tenantId !== tenantUser.tenantId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // محاولة التحقق HTTP — نرسل طلب لـ /.well-known/kashef-verify
  // الدومين يجب أن يكون مضبوطاً على CNAME للمنصة
  await db.domain.update({
    where: { id },
    data: { status: "VERIFYING", lastChecked: new Date() },
  });

  try {
    const res = await fetch(`http://${domain.domain}/.well-known/kashef-verify`, {
      signal: AbortSignal.timeout(5000),
    });
    const text = await res.text();
    const verified = text.trim() === domain.verifyToken;

    await db.domain.update({
      where: { id },
      data: {
        verified,
        status: verified ? "VERIFIED" : "ERROR",
        lastChecked: new Date(),
      },
    });

    return NextResponse.json({ verified, message: verified ? "تم التحقق بنجاح!" : "لم يتم التحقق — تأكد من إعداد CNAME والملف" });
  } catch {
    await db.domain.update({
      where: { id },
      data: { status: "ERROR", lastChecked: new Date() },
    });
    return NextResponse.json({ verified: false, message: "فشل الاتصال بالدومين — تأكد من أن DNS محدّث" });
  }
}
