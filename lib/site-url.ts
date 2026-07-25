import { siteConfig } from "@/config/site";

/** Canonical public origin (no trailing slash). Prefer NEXT_PUBLIC_APP_URL in production. */
export function getSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (fromEnv) {
    return fromEnv.replace(/\/+$/, "");
  }
  return siteConfig.url.replace(/\/+$/, "");
}

export function absoluteUrl(path: string): string {
  const base = getSiteUrl();
  if (!path || path === "/") return base;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}
