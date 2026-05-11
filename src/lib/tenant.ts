import { auth } from "@clerk/nextjs/server";
import { db } from "./db";
import { redirect } from "next/navigation";

export async function getCurrentTenant() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const tenantUser = await db.tenantUser.findFirst({
    where: { clerkUserId: userId },
    include: { tenant: true },
  });

  return tenantUser;
}

export async function requireTenant() {
  const tenantUser = await getCurrentTenant();
  if (!tenantUser) redirect("/onboarding");
  return tenantUser;
}

export async function getTenantBySlug(slug: string) {
  return db.tenant.findUnique({ where: { slug } });
}

export async function getTenantByDomain(domain: string) {
  const domainRecord = await db.domain.findUnique({
    where: { domain, verified: true },
    include: { tenant: true },
  });
  return domainRecord?.tenant ?? null;
}
