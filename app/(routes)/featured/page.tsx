import { Metadata } from "next";
import ProductCard from "@/components/ui/product-card";
import filteredData from "@/app/utils/filteredData";
import { Product } from "@/types";
import { MongoClient } from "mongodb";
import { getMongoDbUri, getMongoDbName } from "@/lib/mongodb-connection";

export const metadata: Metadata = {
  title: "Featured | MJ Carros",
  description: "Featured vehicles and special offers",
};

export const dynamic = "force-dynamic";

const FeaturedPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) => {
  try {
    const uri = getMongoDbUri();
    const client = new MongoClient(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    await client.connect();
    const db = client.db(getMongoDbName());
    const productsCollection = db.collection("products");
    const dbProducts = await productsCollection
      .find({ featured: true })
      .sort({ updatedAt: -1 })
      .toArray();
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
      negotiable: !!dbProduct.negotiable,
      imageURLs: dbProduct.imageURLs || [],
      category: dbProduct.category,
      categoryId: dbProduct.categoryId,
      createdAt: dbProduct.createdAt
        ? new Date(dbProduct.createdAt).toISOString()
        : new Date().toISOString(),
      updatedAt: dbProduct.updatedAt
        ? new Date(dbProduct.updatedAt).toISOString()
        : new Date().toISOString(),
    }));

    const available = products.filter((p) => !p.sold);

    if (available.length === 0) {
      return (
        <div className="text-center py-12">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Featured vehicles</h1>
          <p className="text-gray-600">
            No featured vehicles are available right now. Browse the full shop for our listings.
          </p>
        </div>
      );
    }

    const displayed = filteredData(searchParams || {}, [...available]);

    if (displayed.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-600">No featured vehicles match your filters. Try adjusting sort or search.</p>
        </div>
      );
    }

    return (
      <>
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Featured vehicles</h1>
          <p className="mt-1 text-muted-foreground">Handpicked listings from our team</p>
        </div>
        <div className="product-grid">
          {displayed.map((product: Product) => (
            <ProductCard key={product.id} data={product} />
          ))}
        </div>
      </>
    );
  } catch (error) {
    console.error("Featured page error:", error);
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Error loading featured vehicles. Please try again.</p>
        <p className="text-sm text-gray-500 mt-2">
          {error instanceof Error ? error.message : "Unknown error"}
        </p>
      </div>
    );
  }
};

export default FeaturedPage;
