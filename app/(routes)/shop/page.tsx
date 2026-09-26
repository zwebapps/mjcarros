import ShopProductCard from "@/components/ui/shop-product-card";
import filteredData from "@/app/utils/filteredData";
import { sortSoldLast } from "@/lib/shop-products";
import { Product } from "@/types";
import { skipMongoConnectionDuringBuild } from "@/lib/mongodb-connection";
import { getAllProducts } from "@/lib/data-access";

export const metadata = {
  title: "Shop | MJ Carros",
  description: "Shop for luxury cars, sports cars, SUVs, and electric vehicles",
};

export const dynamic = "force-dynamic";

const ShopPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) => {
  try {
    if (skipMongoConnectionDuringBuild()) {
      return (
        <div className="px-6 py-12 text-center">
          <p className="text-muted-foreground">No vehicles in stock right now.</p>
        </div>
      );
    }

    const rows = await getAllProducts();
    const products: Product[] = rows.map((p: (typeof rows)[number]) => ({
      id: p._id,
      title: p.title,
      description: p.description,
      price: p.price,
      finalPrice: p.finalPrice || undefined,
      discount: p.discount || undefined,
      featured: p.featured,
      sold: !!p.sold,
      negotiable: !!p.negotiable,
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

    if (!products || products.length === 0) {
      return (
        <div className="px-6 py-12 text-center">
          <p className="text-muted-foreground">No vehicles in stock right now.</p>
        </div>
      );
    }

    const displayed = sortSoldLast(filteredData(searchParams || {}, [...products]));

    return (
      <div className="shop-grid-catalog">
        {displayed.map((product: Product) => (
          <ShopProductCard key={product.id} data={product} />
        ))}
      </div>
    );
  } catch (error) {
    console.error("Shop page error:", error);
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Error loading products. Please try again.</p>
        <p className="text-sm text-gray-500 mt-2">
          Error: {error instanceof Error ? error.message : "Unknown error"}
        </p>
      </div>
    );
  }
};

export default ShopPage;
