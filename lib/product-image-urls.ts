/** Normalize product image URL for deduplication (trim, no trailing slash). */
function normalizeImageUrlKey(url: string): string {
  return url.trim().replace(/\/+$/, "");
}

export function isValidProductImageUrl(url: string): boolean {
  const u = url.trim();
  if (!u || u === "-") return false;
  return (
    u.startsWith("/uploads/") ||
    u.startsWith("http://") ||
    u.startsWith("https://")
  );
}

/** Merge URL lists, keep first occurrence, drop invalid entries. */
export function mergeProductImageUrls(
  ...groups: (string[] | undefined | null)[]
): string[] {
  const seen = new Set<string>();
  const out: string[] = [];

  for (const group of groups) {
    if (!Array.isArray(group)) continue;
    for (const raw of group) {
      if (typeof raw !== "string") continue;
      const trimmed = raw.trim();
      if (!isValidProductImageUrl(trimmed)) continue;
      const key = normalizeImageUrlKey(trimmed);
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(trimmed);
    }
  }

  return out;
}
