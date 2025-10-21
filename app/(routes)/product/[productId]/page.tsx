import { type Metadata } from "next";
import { MongoClient } from "mongodb";
import { siteConfig } from "@/config/site";
import ProductDetail from "./_components/product-detail";
import Link from "next/link";

import { getMongoDbUri, getMongoDbName } from "@/lib/mongodb-connection";

const MONGODB_URI = getMongoDbUri();

export async function generateMetadata({
  params,
}: {
  params: { productId: string };
}): Promise<Metadata> {
  let client;
  
  try {
    client = new MongoClient(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    await client.connect();
    const db = client.db(getMongoDbName());
    const productsCollection = db.collection('products');
    
    const { ObjectId } = await import('mongodb');
    const product = await productsCollection.findOne({ _id: new ObjectId(params.productId) });

    if (!product) {
      return {
        title: "Product Not Found | MJ Carros",
        description: "The requested product could not be found",
      };
    }

    return {
      title: `${product.title} | ${siteConfig.name}`,
      description: product.description || "Product details",
    };
  } catch (error) {
    return {
      title: "Product | MJ Carros",
      description: "Product details",
    };
  } finally {
    if (client) {
      await client.close();
    }
  }
}

const ProductPage = ({ params }: { params: { productId: string } }) => {
  if (!params?.productId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg mb-4">Invalid product ID</p>
          <Link href="/shop" className="text-blue-600 hover:text-blue-800 underline">
            Back to shop
          </Link>
        </div>
      </div>
    );
  }
  
  return <ProductDetail productId={params.productId} />;
};

export default ProductPage;
