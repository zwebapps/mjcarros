import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  verifyTokenMiddleware,
  extractTokenFromRequest,
} from "./lib/auth-middleware";
import { isAdminRole } from "./lib/roles";

const PUBLIC_PREFIXES = [
  "/",
  "/shop",
  "/product",
  "/featured",
  "/contact",
  "/cart",
  "/orders",
  "/api/auth/signin",
  "/api/auth/signup",
  "/api/auth/signout",
  "/api/contact",
  "/api/checkout",
  "/api/webhook",
  "/api/paypal",
  "/api/orders/confirm",
  "/api/orders/guest",
  "/api/translate",
  "/sign-in",
  "/sign-up",
] as const;

/** Admin panel + management APIs — ADMIN role only. */
const ADMIN_PREFIXES = [
  "/admin",
  "/api/admin",
  "/api/categories",
  "/api/product",
  "/api/products",
  "/api/billboards",
  "/api/upload",
  "/api/sizes",
  "/api/graph",
  "/api/clerk",
  "/api/contact/cms",
  "/api/orders",
] as const;

function matchesPrefix(pathname: string, prefixes: readonly string[]): boolean {
  return prefixes.some((route) => {
    if (route === "/") return pathname === "/";
    return pathname === route || pathname.startsWith(`${route}/`);
  });
}

/** Storefront catalog reads (GET only) — no login required. */
function isPublicCatalogRead(request: NextRequest): boolean {
  if (request.method !== "GET") return false;
  const path = request.nextUrl.pathname;
  if (path === "/api/product") return true;
  if (/^\/api\/product\/[a-fA-F0-9]{24}$/.test(path)) return true;
  if (path.startsWith("/api/product/category/")) return true;
  if (path.startsWith("/api/shop/")) return true;
  return false;
}

function wantsHtml(request: NextRequest): boolean {
  const accept = request.headers.get("accept") || "";
  return accept.includes("text/html");
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (matchesPrefix(pathname, PUBLIC_PREFIXES) || isPublicCatalogRead(request)) {
    return NextResponse.next();
  }

  const isAdminRoute = matchesPrefix(pathname, ADMIN_PREFIXES);

  const token = extractTokenFromRequest(
    request.headers.get("authorization"),
    request.headers.get("cookie")
  );

  if (!token) {
    if (pathname.startsWith("/admin")) {
      const signInUrl = new URL("/sign-in", request.url);
      signInUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(signInUrl);
    }
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  const payload = await verifyTokenMiddleware(token);
  if (!payload) {
    if (pathname.startsWith("/admin")) {
      const signInUrl = new URL("/sign-in", request.url);
      signInUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(signInUrl);
    }
    return NextResponse.json(
      { error: "Invalid or expired token" },
      { status: 401 }
    );
  }

  if (isAdminRoute && !isAdminRole(payload.role)) {
    if (pathname.startsWith("/admin") && wantsHtml(request)) {
      return NextResponse.redirect(
        new URL("/sign-in?error=admin_required", request.url)
      );
    }
    return NextResponse.json(
      { error: "Admin access required" },
      { status: 403 }
    );
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-user-id", payload.userId);
  requestHeaders.set("x-user-email", payload.email);
  requestHeaders.set("x-user-role", payload.role);

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|uploads/).*)",
  ],
};
