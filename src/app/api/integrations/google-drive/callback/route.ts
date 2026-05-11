import { NextRequest, NextResponse } from "next/server";
import { exchangeCode, saveDriveIntegration } from "@/lib/integrations/google-drive";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state"); // tenantId
  const error = searchParams.get("error");

  const base = process.env.NEXT_PUBLIC_APP_URL!;

  if (error || !code || !state) {
    return NextResponse.redirect(
      `${base}/settings/integrations/google-drive?error=${encodeURIComponent(error ?? "cancelled")}`
    );
  }

  try {
    const tokens = await exchangeCode(code);
    await saveDriveIntegration(state, tokens);
    return NextResponse.redirect(`${base}/settings/integrations/google-drive?success=1`);
  } catch (err: any) {
    console.error("Google Drive callback error:", err);
    return NextResponse.redirect(
      `${base}/settings/integrations/google-drive?error=${encodeURIComponent(err.message)}`
    );
  }
}
