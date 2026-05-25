import { Product as UIProduct } from "@/types";
import { skipMongoConnectionDuringBuild } from "@/lib/mongodb-connection";
import {
  sortCategoriesForDisplay,
  DEFAULT_CATEGORY_ORDER,
} from "@/lib/default-categories";
import { getAllProducts, getCategories } from "@/lib/data-access";
import { apiId } from "@/lib/serialize-api";

export type ShopSidebarCategory = {
  id: string;
  category: string;
  count: number;
};

export type ShopSidebarPayload = {
  categories: ShopSidebarCategory[];
  totalCount: number;
  products: UIProduct[];
};

export async function getShopSidebarData(): Promise<ShopSidebarPayload> {
  if (skipMongoConnectionDuringBuild()) {
    return { categories: [], totalCount: 0, products: [] };
  }

  try {
    const [dbCategories, dbProducts] = await Promise.all([
      getCategories(),
      getAllProducts(),
    ]);

    const products: UIProduct[] = dbProducts.map((p) => ({
      id: p._id,
      title: p.title,
      description: p.description,
      price: p.price,
      finalPrice: p.finalPrice || undefined,
      discount: p.discount || undefined,
      featured: p.featured,
      sold: !!p.sold,
      imageURLs: p.imageURLs || [],
      category: p.category,
      categoryId: p.categoryId,
      createdAt: p.createdAt
        ? new Date(p.createdAt).toISOString()
        : new Date().toISOString(),
      updatedAt: p.updatedAt
        ? new Date(p.updatedAt).toISOString()
        : new Date().toISOString(),
    }));

    const availableProducts = products.filter((product) => !product.sold);

    const categoryToCount: Record<string, number> = products.reduce(
      (acc, product) => {
        const key = String(product.category || "").trim();
        if (!key) return acc;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const namesFromAllProducts = new Set<string>();
    for (const product of products) {
      const key = String(product.category || "").trim();
      if (key) namesFromAllProducts.add(key);
    }

    const byName = new Map<string, ShopSidebarCategory>();
    for (const c of dbCategories) {
      const name = String(c.category || "").trim();
      if (!name) continue;
      byName.set(name, {
        id: apiId(c),
        category: name,
        count: categoryToCount[name] || 0,
      });
    }
    for (const name of Object.keys(categoryToCount)) {
      if (!byName.has(name)) {
        byName.set(name, { id: name, category: name, count: categoryToCount[name] || 0 });
      }
    }
    for (const name of namesFromAllProducts) {
      if (!byName.has(name)) {
        byName.set(name, { id: name, category: name, count: categoryToCount[name] || 0 });
      }
    }

    if (byName.size === 0) {
      for (const name of DEFAULT_CATEGORY_ORDER) {
        byName.set(name, { id: name, category: name, count: 0 });
      }
    }

    const sortedCategories = sortCategoriesForDisplay(Array.from(byName.values()));

    return {
      categories: sortedCategories,
      totalCount: products.length,
      products: availableProducts,
    };
  } catch (error) {
    console.error("getShopSidebarData error:", error);
    return { categories: [], totalCount: 0, products: [] };
  }
}
