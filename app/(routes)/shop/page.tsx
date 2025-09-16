import ProductCard from "@/components/ui/product-card";
import filteredData from "@/app/utils/filteredData";
import { Product } from "@/types";

export const metadata = {
  title: "Shop | MJ Carros",
  description: "Shop for luxury cars, sports cars, SUVs, and electric vehicles",
};

const ShopPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) => {
  try {
    // Fetch products from API
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/product`, {
      cache: 'no-store' // Ensure fresh data
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.status}`);
    }
    
    const dbProducts = await response.json();

    const products: Product[] = dbProducts.map((dbProduct: any) => ({
      id: dbProduct._id?.toString(),
      title: dbProduct.title,
      description: dbProduct.description,
      price: dbProduct.price,
      finalPrice: dbProduct.finalPrice || undefined,
      discount: dbProduct.discount || undefined,
      featured: dbProduct.featured,
      imageURLs: dbProduct.imageURLs || [],
      category: dbProduct.category,
      categoryId: dbProduct.categoryId,
      createdAt: dbProduct.createdAt ? new Date(dbProduct.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: dbProduct.updatedAt ? new Date(dbProduct.updatedAt).toISOString() : new Date().toISOString(),
    }));

    if (!products || products.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-600">No products found.</p>
        </div>
      );
    }

    const displayed = filteredData(searchParams || {}, [...products]);

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-8 xl:gap-10">
        {displayed.map((product: Product) => (
          <ProductCard key={product.id} data={product} />
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
