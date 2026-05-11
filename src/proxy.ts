import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",                   // الصفحة الرئيسية (Landing)
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/g/(.*)",             // المعرض العام
  "/cd/(.*)",            // custom-domain rewrite target
  "/api/gallery(.*)",
  "/api/webhooks(.*)",
  "/api/domains/verify(.*)",
]);

const isAdminRoute = createRouteMatcher(["/admin(.*)"]);

function isSuperAdmin(userId: string | null): boolean {
  if (!userId) return false;
  const ids = (process.env.SUPER_ADMIN_USER_IDS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  return ids.includes(userId);
}

export default clerkMiddleware(async (auth, request: NextRequest) => {
  const { userId } = await auth();
  const { pathname, hostname } = request.nextUrl;

  // ── Custom Domain Routing ─────────────────────────────────────────────────
  const mainHost = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000")
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");

  const isCustomDomain =
    hostname &&
    hostname !== mainHost &&
    hostname !== "localhost" &&
    !hostname.endsWith(".localhost") &&
    !hostname.startsWith("www.");

  if (isCustomDomain && !pathname.startsWith("/cd/") && !pathname.startsWith("/api/")) {
    const url = request.nextUrl.clone();
    url.pathname = `/cd${pathname === "/" ? "" : pathname}`;
    return NextResponse.rewrite(url);
  }

  // ── Admin Protection ──────────────────────────────────────────────────────
  if (isAdminRoute(request)) {
    if (!userId) {
      const signInUrl = new URL("/sign-in", request.url);
      signInUrl.searchParams.set("redirect_url", request.url);
      return NextResponse.redirect(signInUrl);
    }
    if (!isSuperAdmin(userId)) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // ── Standard Auth ─────────────────────────────────────────────────────────
  if (!isPublicRoute(request)) {
    await auth.protect();
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
