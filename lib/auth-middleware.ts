/**
 * Edge-safe JWT helpers for `middleware.ts` only.
 * Do not import `lib/auth.ts` from middleware — it pulls bcrypt/jsonwebtoken (Node-only).
 */
// Subpath import avoids the main `jose` barrel (JWE → deflate → CompressionStream) which Edge warns on.
import { jwtVerify } from "jose/jwt/verify";
import type { JWTPayload } from "./auth";
import { getTokenFromCookie } from "./auth-cookie";
import { normalizeRole } from "./roles";

export function extractTokenFromHeader(authHeader: string | null | undefined): string | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.substring(7);
}

export function extractTokenFromRequest(
  authHeader: string | null | undefined,
  cookieHeader: string | null | undefined
): string | null {
  return extractTokenFromHeader(authHeader) ?? getTokenFromCookie(cookieHeader);
}

function getJwtSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (secret) return new TextEncoder().encode(secret);
  if (process.env.NODE_ENV === "production") {
    return new TextEncoder().encode("");
  }
  return new TextEncoder().encode("development-jwt-secret-not-for-production");
}

/** HS256 verify compatible with tokens from `jwt.sign` in `lib/auth.ts`. */
export async function verifyTokenMiddleware(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecretKey(), {
      algorithms: ["HS256"],
    });
    return {
      userId: String(payload.userId ?? ""),
      email: String(payload.email ?? ""),
      role: normalizeRole(payload.role),
    };
  } catch {
    return null;
  }
}
