import ProductCard from "@/components/ui/product-card";
import { PrismaClient } from "@prisma/client";
import { Product } from "@/types";

const prisma = new PrismaClient();

export const metadata = {
  title: "Shop | MJ Carros",
  description: "Shop for luxury cars, sports cars, SUVs, and electric vehicles",
};

const ShopPage = async () => {
  try {
    const dbProducts = await prisma.product.findMany({
      include: {
        productSizes: {
          include: {
            size: true,
          },
        },
      },
    });

    // Transform the database products to match the Product interface
    const products: Product[] = dbProducts.map(dbProduct => ({
      id: dbProduct.id,
      title: dbProduct.title,
      description: dbProduct.description,
      price: dbProduct.price,
      finalPrice: dbProduct.finalPrice || undefined,
      discount: dbProduct.discount || undefined,
      featured: dbProduct.featured,
      imageURLs: dbProduct.imageURLs,
      category: dbProduct.category,
      categoryId: dbProduct.categoryId,
      createdAt: dbProduct.createdAt.toISOString(),
      updatedAt: dbProduct.updatedAt.toISOString(),
    }));

    console.log('Shop page - Products data:', products);
    console.log('Shop page - Data length:', products?.length);

    if (!products || products.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-600">No products found.</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
        {products.map((product: Product) => (
          <ProductCard key={product.id} data={product} />
        ))}
      </div>
    );
  } catch (error) {
    console.error('Shop page error:', error);
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Error loading products. Please try again.</p>
        <p className="text-sm text-gray-500 mt-2">Error: {error instanceof Error ? error.message : 'Unknown error'}</p>
      </div>
    );
  }
};

export default ShopPage;
