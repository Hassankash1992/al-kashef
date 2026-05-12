import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import QRCode from "qrcode";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const tenantUser = await db.tenantUser.findFirst({
    where: { clerkUserId: userId },
    include: { tenant: true },
  });
  if (!tenantUser) return NextResponse.json({ error: "No tenant" }, { status: 404 });

  const event = await db.event.findUnique({
    where: { id, tenantId: tenantUser.tenant.id },
    select: { slug: true },
  });
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  const url = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://kashef.app"}/g/${tenantUser.tenant.slug}/${event.slug}`;

  const dataUrl = await QRCode.toDataURL(url, {
    errorCorrectionLevel: "H",
    margin: 2,
    width: 1024,
    color: {
      dark: "#0a0a0a",
      light: "#ffffff",
    },
  });

  // Convert data URL to buffer
  const base64 = dataUrl.replace(/^data:image\/png;base64,/, "");
  const buffer = Buffer.from(base64, "base64");

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `inline; filename="qr-${event.slug}.png"`,
      "Cache-Control": "public, max-age=86400",
    },
  });
}
