import { MongoClient } from "mongodb";
import SidebarItems from "./sidebar-items";
import PriceInput from "./price-input";
import { Product as UIProduct } from "@/types";
import {
  getMongoDbUri,
  getMongoDbName,
  skipMongoConnectionDuringBuild,
} from "@/lib/mongodb-connection";
import {
  sortCategoriesForDisplay,
  DEFAULT_CATEGORY_ORDER,
} from "@/lib/default-categories";

const SidebarProducts = async () => {
  if (skipMongoConnectionDuringBuild()) {
    const sortedCategories = sortCategoriesForDisplay(
      DEFAULT_CATEGORY_ORDER.map((name) => ({ id: name, category: name, count: 0 }))
    );
    return (
      <div className="w-1/6 max-sm:w-full p-4 flex flex-col gap-y-4">
        <div>
          <p className="font-semibold mt-1 mb-2">Category</p>
          <SidebarItems categories={sortedCategories} totalCount={0} />
        </div>
        <div>
          <PriceInput data={[]} />
        </div>
      </div>
    );
  }

  let client: MongoClient | undefined;

  try {
    const uri = getMongoDbUri();
    const dbNameResolved = getMongoDbName();
    client = new MongoClient(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    await client.connect();
    const db = client.db(dbNameResolved);
    const categoriesCollection = db.collection("categories");
    const productsCollection = db.collection("products");

    const [dbCategories, dbProducts] = await Promise.all([
      categoriesCollection.find({}).toArray(),
      productsCollection.find({}).toArray(),
    ]);

    const products: UIProduct[] = dbProducts.map((p) => ({
      id: p._id ? p._id.toString() : "",
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
      createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: p.updatedAt ? new Date(p.updatedAt).toISOString() : new Date().toISOString(),
    }));

    const availableProducts = products.filter((product) => !product.sold);

    const categoryToCount: Record<string, number> = availableProducts.reduce((acc, product) => {
      const key = String(product.category || "").trim();
      if (!key) return acc;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Distinct category labels from the full catalog (including sold). Otherwise when every car is sold,
    // `categoryToCount` is empty and the sidebar showed no rows while the price slider still had data.
    const namesFromAllProducts = new Set<string>();
    for (const product of products) {
      const key = String(product.category || "").trim();
      if (key) namesFromAllProducts.add(key);
    }

    // Union: DB categories, categories seen on any product (any stock), and available-only counts.
    const byName = new Map<string, { id: string; category: string; count: number }>();
    for (const c of dbCategories) {
      const name = String(c.category || "").trim();
      if (!name) continue;
      byName.set(name, {
        id: c._id?.toString?.() ? c._id.toString() : name,
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

    // Nothing in DB and no product.category strings — still show default taxonomy so the nav isn't empty.
    if (byName.size === 0) {
      for (const name of DEFAULT_CATEGORY_ORDER) {
        byName.set(name, { id: name, category: name, count: 0 });
      }
    }

    const categoriesWithCount = Array.from(byName.values());

    const sortedCategories = sortCategoriesForDisplay(categoriesWithCount);

    return (
      <div className="w-1/6 max-sm:w-full p-4 flex flex-col gap-y-4">
        <div>
          <p className="font-semibold mt-1 mb-2">Category</p>
          <SidebarItems
            categories={sortedCategories}
            totalCount={availableProducts.length}
          />
        </div>
        <div>
          <PriceInput data={availableProducts} />
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error fetching sidebar data:", error);
    // Degrade gracefully: empty sidebar instead of failing the page
    return (
      <div className="w-1/6 max-sm:w-full p-4 flex flex-col gap-y-4">
        <div>
          <p className="font-semibold mt-1 mb-2">Category</p>
          <SidebarItems categories={[]} totalCount={0} />
        </div>
        <div>
          <PriceInput data={[]} />
        </div>
      </div>
    );
  } finally {
    if (client) {
      await client.close();
    }
  }
};

export default SidebarProducts;
