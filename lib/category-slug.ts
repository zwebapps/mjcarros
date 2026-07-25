/** URL slug for `/shop/[category]` — must match sidebar and home links. */
export function toCategorySlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9_-]/g, "");
}
