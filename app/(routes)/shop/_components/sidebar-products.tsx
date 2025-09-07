import { db } from "@/lib/db";
import SidebarItems from "./sidebar-items";
import PriceInput from "./price-input";
import { Product as UIProduct } from "@/types";

const SidebarProducts = async () => {
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

  return (
    <div className="w-1/6 max-sm:w-full p-4 flex flex-col gap-y-4">
      <div>
        <p className="font-semibold mt-1 mb-2">Category</p>
        <SidebarItems categories={dbCategories} />
      </div>
      <div>
        <PriceInput data={products} />
      </div>
    </div>
  );
};

export default SidebarProducts;
