import { NextRequest, NextResponse } from "next/server";
import { exchangeCode } from "@/lib/integrations/onedrive";
import { encrypt } from "@/lib/crypto";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const base = process.env.NEXT_PUBLIC_APP_URL!;

  if (error || !code || !state) {
    return NextResponse.redirect(`${base}/settings/integrations/onedrive?error=${encodeURIComponent(error ?? "cancelled")}`);
  }

  try {
    const tokens = await exchangeCode(code);

    await db.integration.upsert({
      where: { tenantId_type: { tenantId: state, type: "GOOGLE_DRIVE" } },
      create: {
        tenantId: state,
        type: "GOOGLE_DRIVE",
        connected: true,
        expiresAt: tokens.expiresAt,
        config: {
          provider: "ONEDRIVE",
          encryptedAccessToken: encrypt(tokens.accessToken),
          encryptedRefreshToken: encrypt(tokens.refreshToken),
          email: tokens.email,
          displayName: tokens.displayName,
        },
      },
      update: {
        connected: true,
        expiresAt: tokens.expiresAt,
        config: {
          provider: "ONEDRIVE",
          encryptedAccessToken: encrypt(tokens.accessToken),
          encryptedRefreshToken: encrypt(tokens.refreshToken),
          email: tokens.email,
          displayName: tokens.displayName,
        },
      },
    });

    return NextResponse.redirect(`${base}/settings/integrations/onedrive?success=1`);
  } catch (err: any) {
    return NextResponse.redirect(`${base}/settings/integrations/onedrive?error=${encodeURIComponent(err.message)}`);
  }
}
