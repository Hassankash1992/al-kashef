import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getSiteSettings, upsertSiteSettings } from "@/lib/site-settings";

export async function GET() {
  const ctx = await requireAdmin("site.read");
  if (ctx instanceof NextResponse) return ctx;
  const settings = await getSiteSettings();
  return NextResponse.json(settings);
}

export async function PUT(req: Request) {
  const ctx = await requireAdmin("site.*");
  if (ctx instanceof NextResponse) return ctx;
  const body = await req.json();
  await upsertSiteSettings(body, ctx.userId);
  const fresh = await getSiteSettings();
  return NextResponse.json(fresh);
}
