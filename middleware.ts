import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  verifyTokenMiddleware,
  extractTokenFromHeader,
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
  "/api/import-requests",
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
  if (/^\/api\/product\/[a-zA-Z0-9_-]+$/.test(path)) return true;
  if (path.startsWith("/api/product/category/")) return true;
  if (path.startsWith("/api/shop/")) return true;
  return false;
}

/** Customer import lead form (POST only). */
function isPublicImportLeadPost(request: NextRequest): boolean {
  return (
    request.method === "POST" &&
    request.nextUrl.pathname === "/api/import-requests"
  );
}

/** Files in /public (logo, placeholders, fonts) must not require JWT. */
function isPublicStaticAsset(pathname: string): boolean {
  return /\.(avif|bmp|gif|ico|jpe?g|png|svg|webp|woff2?|ttf|otf|eot)$/i.test(pathname);
}

/**
 * Admin UI routes (/admin/*) — auth is checked client-side via localStorage + AdminLayout.
 * Browser navigations do not send Authorization; APIs still require Bearer below.
 */
function isAdminUiPage(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicStaticAsset(pathname)) {
    return NextResponse.next();
  }

  if (isAdminUiPage(pathname)) {
    return NextResponse.next();
  }

  if (
    matchesPrefix(pathname, PUBLIC_PREFIXES) ||
    isPublicCatalogRead(request) ||
    isPublicImportLeadPost(request)
  ) {
    return NextResponse.next();
  }

  const isAdminRoute = matchesPrefix(pathname, ADMIN_PREFIXES);

  const token = extractTokenFromHeader(request.headers.get("authorization"));

  if (!token) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  const payload = await verifyTokenMiddleware(token);
  if (!payload) {
    return NextResponse.json(
      { error: "Invalid or expired token" },
      { status: 401 }
    );
  }

  if (isAdminRoute && !isAdminRole(payload.role)) {
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
    "/((?!api/auth|_next/static|_next/image|favicon.ico|uploads/|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|avif|woff2?|ttf|otf|eot)$).*)",
  ],
};
