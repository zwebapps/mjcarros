import { NextRequest } from "next/server";
import { extractTokenFromHeader, verifyToken } from "@/lib/auth";
import { AppRole, normalizeRole } from "@/lib/roles";

export type AuthContext = {
  userId: string;
  email: string;
  role: AppRole;
};

export function authFromRequest(request: NextRequest): AuthContext | null {
  const headerRole = request.headers.get("x-user-role");
  const headerId = request.headers.get("x-user-id");
  const headerEmail = request.headers.get("x-user-email");
  if (headerId && headerRole) {
    return {
      userId: headerId,
      email: headerEmail || "",
      role: normalizeRole(headerRole),
    };
  }

  const token = extractTokenFromHeader(request.headers.get("authorization"));
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload) return null;
  return {
    userId: payload.userId,
    email: payload.email,
    role: normalizeRole(payload.role),
  };
}

export function requireAuth(request: NextRequest): AuthContext | null {
  return authFromRequest(request);
}
