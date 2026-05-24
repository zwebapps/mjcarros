import { NextRequest, NextResponse } from "next/server";
import { extractTokenFromHeader, verifyToken, type JWTPayload } from "@/lib/auth";
import { isAdminRole, type AppRole } from "@/lib/roles";

type GuardResult =
  | { ok: true; user: JWTPayload }
  | { ok: false; response: NextResponse };

function getBearerUser(request: NextRequest): JWTPayload | null {
  const fromHeader = request.headers.get("x-user-role")
    ? ({
        userId: request.headers.get("x-user-id") || "",
        email: request.headers.get("x-user-email") || "",
        role: request.headers.get("x-user-role") || "",
      } as JWTPayload)
    : null;

  if (fromHeader?.userId && fromHeader.email && fromHeader.role) {
    return fromHeader;
  }

  const token = extractTokenFromHeader(request.headers.get("authorization"));
  if (!token) return null;
  return verifyToken(token);
}

/** Any authenticated user (USER, CUSTOMER, or ADMIN). */
export function requireAuth(request: NextRequest): GuardResult {
  const user = getBearerUser(request);
  if (!user) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      ),
    };
  }
  return { ok: true, user };
}

/** Dealership admin only. */
export function requireAdmin(request: NextRequest): GuardResult {
  const auth = requireAuth(request);
  if (!auth.ok) return auth;
  if (!isAdminRole(auth.user.role)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      ),
    };
  }
  return auth;
}

/** Require one of the given roles. */
export function requireRole(
  request: NextRequest,
  allowed: AppRole[]
): GuardResult {
  const auth = requireAuth(request);
  if (!auth.ok) return auth;
  const role = auth.user.role as AppRole;
  if (!allowed.includes(role)) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  return auth;
}
