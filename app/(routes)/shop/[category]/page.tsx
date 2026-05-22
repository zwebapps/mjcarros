import { Metadata } from "next";
import filteredData from "@/app/utils/filteredData";
import { sortSoldLast } from "@/lib/shop-products";
import { Product } from "@/types";
import ShopProductCard from "@/components/ui/shop-product-card";
import { MongoClient } from "mongodb";
import { getMongoDbUri, getMongoDbName } from "@/lib/mongodb-connection"; 

interface CategoryPageProps {
  params: { category: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  return {
    title: `${params.category} | MJ Carros`,
    description: `Browse ${params.category} vehicles`,
  };
}

// Force dynamic rendering since we use searchParams
export const dynamic = 'force-dynamic';

const CategoryPage = async ({ params, searchParams }: CategoryPageProps) => {
  try {
    const uri = getMongoDbUri();
    const client = new MongoClient(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    await client.connect();
    const db = client.db(getMongoDbName());
    const productsCollection = db.collection('products');
    const dbProducts: any[] = await productsCollection.find({ category: new RegExp(`^${params.category}$`, 'i') }).toArray();

    const products: Product[] = dbProducts.map((dbProduct) => ({
      id: dbProduct._id?.toString(),
      title: dbProduct.title,
      description: dbProduct.description,
      price: dbProduct.price,
      finalPrice: dbProduct.finalPrice || undefined,
      discount: dbProduct.discount || undefined,
      featured: dbProduct.featured,
      sold: !!dbProduct.sold,
      negotiable: !!dbProduct.negotiable,
      imageURLs: dbProduct.imageURLs,
      category: dbProduct.category,
      categoryId: dbProduct.categoryId,
      createdAt: dbProduct.createdAt.toISOString(),
      updatedAt: dbProduct.updatedAt.toISOString(),
    }));

    const inCategory = products.filter(
      (p) => p.category.toLowerCase() === params.category.toLowerCase()
    );

    const displayed = sortSoldLast(filteredData(searchParams || {}, [...inCategory]));

    if (displayed.length === 0) {
      return (
        <div className="px-6 py-12 text-center">
          <p className="text-muted-foreground">
            No vehicles in this category right now.
          </p>
        </div>
      );
    }

    await client.close();
    return (
      <div className="shop-grid-catalog">
        {displayed.map((product: Product) => (
          <ShopProductCard key={product.id} data={product} />
        ))}
      </div>
    );
  } catch (error) {
    console.error("Category page error:", error);
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Error loading products. Please try again.</p>
        <p className="text-sm text-gray-500 mt-2">Error: {error instanceof Error ? error.message : 'Unknown error'}</p>
      </div>
    );
  }
};

export default CategoryPage;
