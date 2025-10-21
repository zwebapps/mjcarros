import ProductCard from "@/components/ui/product-card";
import filteredData from "@/app/utils/filteredData";
import { Product } from "@/types";
import { MongoClient } from "mongodb";
import { getMongoDbUri, getMongoDbName } from "@/lib/mongodb-connection";

export const metadata = {
  title: "Shop | MJ Carros",
  description: "Shop for luxury cars, sports cars, SUVs, and electric vehicles",
};

// Force dynamic rendering since we use searchParams
export const dynamic = 'force-dynamic';

const ShopPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) => {
  try {
    // Query MongoDB directly during SSR to avoid self-HTTP calls
    const uri = getMongoDbUri();
    const client = new MongoClient(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    await client.connect();
    const db = client.db(getMongoDbName());
    const productsCollection = db.collection('products');
    const dbProducts = await productsCollection.find({}).toArray();
    await client.close();

    const products: Product[] = dbProducts.map((dbProduct: any) => ({
      id: dbProduct._id?.toString(),
      title: dbProduct.title,
      description: dbProduct.description,
      price: dbProduct.price,
      finalPrice: dbProduct.finalPrice || undefined,
      discount: dbProduct.discount || undefined,
      featured: dbProduct.featured,
      sold: !!dbProduct.sold,
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
