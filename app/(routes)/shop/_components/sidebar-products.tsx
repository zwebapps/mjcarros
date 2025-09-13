import { db } from "@/lib/db";
import SidebarItems from "./sidebar-items";
import PriceInput from "./price-input";
import { Product as UIProduct } from "@/types";

const SidebarProducts = async () => {
  if (!db) {
    return [];
  }
  const [dbCategories, dbProducts] = await Promise.all([
    db.category.findMany(),
    db.product.findMany({ include: { productSizes: { include: { size: true } } } }),
  ]);

  const products: UIProduct[] = dbProducts.map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    price: p.price,
    finalPrice: p.finalPrice || undefined,
    discount: p.discount || undefined,
    featured: p.featured,
    imageURLs: p.imageURLs,
    category: p.category,
    categoryId: p.categoryId,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));

  // Compute counts per category based on products
  const categoryToCount: Record<string, number> = products.reduce((acc, product) => {
    const key = product.category;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const categoriesWithCount = dbCategories.map((c) => ({
    ...c,
    count: categoryToCount[c.category] || 0,
  }));

  return (
    <div className="w-1/6 max-sm:w-full p-4 flex flex-col gap-y-4">
      <div>
        <p className="font-semibold mt-1 mb-2">Category</p>
        <SidebarItems categories={categoriesWithCount as any} totalCount={products.length} />
      </div>
      <div>
        <PriceInput data={products} />
      </div>
    </div>
  );
};

export default SidebarProducts;
