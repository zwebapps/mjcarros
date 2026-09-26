/** Prisma `where` fragment: products visible on the storefront. */
export const CLIENT_VISIBLE_PRODUCT_FILTER = {
  hidden: false,
} as const;

export function isProductHidden(product: unknown): boolean {
  return (
    typeof product === "object" &&
    product !== null &&
    "hidden" in product &&
    (product as { hidden?: boolean }).hidden === true
  );
}
