/** Mongo filter: products visible on the storefront (hidden !== true). */
export const CLIENT_VISIBLE_PRODUCT_FILTER = {
  hidden: { $ne: true },
} as const;

export function isProductHidden(product: unknown): boolean {
  return (
    typeof product === "object" &&
    product !== null &&
    "hidden" in product &&
    (product as { hidden?: boolean }).hidden === true
  );
}
