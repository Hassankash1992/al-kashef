import { NextRequest, NextResponse } from "next/server";
import { exchangeCode, saveDropboxIntegration } from "@/lib/integrations/dropbox";
import { encrypt } from "@/lib/crypto";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state"); // tenantId
  const error = searchParams.get("error");
  const base = process.env.NEXT_PUBLIC_APP_URL!;

  if (error || !code || !state) {
    return NextResponse.redirect(`${base}/settings/integrations/dropbox?error=${encodeURIComponent(error ?? "cancelled")}`);
  }

  try {
    const tokens = await exchangeCode(code);

    // Save with proper encryption
    await db.integration.upsert({
      where: { tenantId_type: { tenantId: state, type: "GOOGLE_DRIVE" } },
      create: {
        tenantId: state,
        type: "GOOGLE_DRIVE",
        connected: true,
        config: {
          provider: "DROPBOX",
          encryptedAccessToken: encrypt(tokens.accessToken),
          encryptedRefreshToken: encrypt(tokens.refreshToken),
          accountId: tokens.accountId,
          email: tokens.email,
        },
      },
      update: {
        connected: true,
        config: {
          provider: "DROPBOX",
          encryptedAccessToken: encrypt(tokens.accessToken),
          encryptedRefreshToken: encrypt(tokens.refreshToken),
          accountId: tokens.accountId,
          email: tokens.email,
        },
      },
    });

    return NextResponse.redirect(`${base}/settings/integrations/dropbox?success=1`);
  } catch (err: any) {
    return NextResponse.redirect(`${base}/settings/integrations/dropbox?error=${encodeURIComponent(err.message)}`);
  }
}
