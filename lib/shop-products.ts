import { Product } from "@/types";

/** Available listings first, sold vehicles at the end of the grid */
export function sortSoldLast(products: Product[]): Product[] {
  return [...products].sort((a, b) => {
    const aSold = a.sold ? 1 : 0;
    const bSold = b.sold ? 1 : 0;
    return aSold - bSold;
  });
}
