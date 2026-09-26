import { prisma } from "@/lib/prisma";
import { legacyMongoFilter } from "@/lib/id-resolve";
import { skipMongoConnectionDuringBuild } from "@/lib/mongodb-connection";
import { isProductHidden } from "@/lib/product-visibility";

export type StorefrontProductDoc = {
  /** Public id used in URLs: the legacy Mongo id for migrated rows, else the cuid. */
  _id: string;
  title: string;
  description?: string;
  price?: number;
  finalPrice?: number | null;
  imageURLs?: string[];
  category?: string;
  sold?: boolean;
  updatedAt?: Date | string;
  modelName?: string | null;
  year?: number | null;
  fuelType?: string | null;
  transmission?: string | null;
  mileage?: number | null;
  condition?: string | null;
};

/** Resolves by cuid or legacy Mongo ObjectId; hidden products resolve to null. */
export async function getStorefrontProductById(
  productId: string
): Promise<StorefrontProductDoc | null> {
  if (skipMongoConnectionDuringBuild() || !productId) {
    return null;
  }

  try {
    const row = await prisma.product.findFirst({ where: legacyMongoFilter(productId) });
    if (!row || isProductHidden(row)) return null;
    return { ...row, _id: row.legacyMongoId ?? row.id };
  } catch {
    return null;
  }
}
