import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export function isSuperAdmin(userId: string | null): boolean {
  if (!userId) return false;
  const ids = (process.env.SUPER_ADMIN_USER_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return ids.includes(userId);
}

export async function requireAdmin(): Promise<{ userId: string } | NextResponse> {
  const { userId } = await auth();
  if (!isSuperAdmin(userId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return { userId: userId! };
}
