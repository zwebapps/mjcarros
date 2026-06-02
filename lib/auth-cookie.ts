import type { NextResponse } from "next/server";

export const AUTH_COOKIE_NAME = "authToken";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 7,
};

export function setAuthCookie(response: NextResponse, token: string) {
  response.cookies.set(AUTH_COOKIE_NAME, token, cookieOptions);
}

export function clearAuthCookie(response: NextResponse) {
  response.cookies.set(AUTH_COOKIE_NAME, "", {
    ...cookieOptions,
    maxAge: 0,
  });
}

export function getTokenFromCookie(
  cookieHeader: string | null | undefined
): string | null {
  if (!cookieHeader) return null;

  for (const part of cookieHeader.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === AUTH_COOKIE_NAME) {
      const value = rest.join("=");
      return value ? decodeURIComponent(value) : null;
    }
  }

  return null;
}
