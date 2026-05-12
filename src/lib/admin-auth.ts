import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "./db";

export type AdminRole = "SUPER_ADMIN" | "ADMIN" | "SUPPORT" | "BILLING" | "CONTENT" | "VIEWER";

export interface AdminContext {
  userId: string;
  role: AdminRole;
  isSuperAdmin: boolean;
  permissions: string[];
}

const PERMISSIONS_BY_ROLE: Record<AdminRole, string[]> = {
  SUPER_ADMIN: ["*"],
  ADMIN: [
    "tenants.*", "billing.*", "messages.*", "support.*",
    "site.read", "templates.*", "schedules.*",
    "admins.read", "admins.invite",
  ],
  SUPPORT: [
    "support.*", "tenants.read", "messages.read",
  ],
  BILLING: [
    "billing.*", "tenants.read", "invoices.*",
  ],
  CONTENT: [
    "site.*", "templates.*", "schedules.*", "tenants.read",
  ],
  VIEWER: [
    "tenants.read", "billing.read", "support.read",
    "site.read", "templates.read",
  ],
};

export function isSuperAdminFromEnv(userId: string | null): boolean {
  if (!userId) return false;
  const ids = (process.env.SUPER_ADMIN_USER_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return ids.includes(userId);
}

// Backward compatibility
export const isSuperAdmin = isSuperAdminFromEnv;

export async function getAdminContext(userId: string | null): Promise<AdminContext | null> {
  if (!userId) return null;

  if (isSuperAdminFromEnv(userId)) {
    return {
      userId,
      role: "SUPER_ADMIN",
      isSuperAdmin: true,
      permissions: ["*"],
    };
  }

  const adminUser = await db.adminUser.findUnique({
    where: { clerkUserId: userId },
  });

  if (!adminUser || !adminUser.active) return null;

  const role = adminUser.role as AdminRole;
  const customPerms = (adminUser.permissions as string[] | null) ?? [];
  const rolePerms = PERMISSIONS_BY_ROLE[role] ?? [];

  return {
    userId,
    role,
    isSuperAdmin: false,
    permissions: [...new Set([...rolePerms, ...customPerms])],
  };
}

export function hasPermission(ctx: AdminContext, permission: string): boolean {
  if (ctx.permissions.includes("*")) return true;
  if (ctx.permissions.includes(permission)) return true;
  // Wildcard match: "billing.*" matches "billing.read"
  const [section] = permission.split(".");
  return ctx.permissions.some((p) => p === `${section}.*`);
}

export async function requireAdmin(permission?: string): Promise<AdminContext | NextResponse> {
  const { userId } = await auth();
  const ctx = await getAdminContext(userId);
  if (!ctx) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (permission && !hasPermission(ctx, permission)) {
    return NextResponse.json({ error: "Insufficient permissions", required: permission }, { status: 403 });
  }
  return ctx;
}
