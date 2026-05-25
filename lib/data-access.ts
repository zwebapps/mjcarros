import { prisma } from "./prisma";
import { legacyMongoFilter } from "./id-resolve";
import { withMongoId, withMongoIds } from "./serialize-api";

/** @param limit Omit or pass undefined to return all featured products (featured page). Home uses 8. */
export async function getFeaturedProducts(limit?: number) {
  const rows = await prisma.product.findMany({
    where: { featured: true },
    orderBy: { updatedAt: "desc" },
    ...(limit != null ? { take: limit } : {}),
  });
  return withMongoIds(rows).map((p) => ({
    ...p,
    imageURLs: Array.isArray(p.imageURLs) ? p.imageURLs : [],
  }));
}

export async function getAllProducts() {
  const rows = await prisma.product.findMany({ orderBy: { updatedAt: "desc" } });
  return withMongoIds(rows).map((p) => ({
    ...p,
    productCode: p.productCode || `PRD-${p.id.slice(-6).toUpperCase()}`,
    sold: !!p.sold,
  }));
}

export async function getProductById(id: string) {
  const row = await prisma.product.findFirst({ where: legacyMongoFilter(id) });
  if (!row) return null;
  const p = withMongoId(row);
  return {
    ...p,
    productCode: p.productCode || `PRD-${p.id.slice(-6).toUpperCase()}`,
    sold: !!p.sold,
  };
}

export async function getCategories() {
  return withMongoIds(await prisma.category.findMany({ orderBy: { createdAt: "desc" } }));
}

export async function getCategoriesWithProductCounts() {
  const categories = await getCategories();
  const counts = await prisma.product.groupBy({
    by: ["categoryId"],
    _count: { _all: true },
  });
  const countMap = new Map(counts.map((c) => [c.categoryId, c._count._all]));
  return categories.map((cat) => ({
    ...cat,
    productCount: countMap.get(cat.id) ?? 0,
  }));
}

export async function getBillboards() {
  return withMongoIds(await prisma.billboard.findMany({ orderBy: { createdAt: "desc" } }));
}
