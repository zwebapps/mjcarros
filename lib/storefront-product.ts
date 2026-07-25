import { MongoClient, ObjectId } from "mongodb";
import {
  getMongoDbName,
  getMongoDbUri,
  skipMongoConnectionDuringBuild,
} from "@/lib/mongodb-connection";
import { isProductHidden } from "@/lib/product-visibility";

export type StorefrontProductDoc = {
  _id: ObjectId;
  title: string;
  description?: string;
  price?: number;
  finalPrice?: number;
  imageURLs?: string[];
  category?: string;
  sold?: boolean;
  updatedAt?: Date | string;
  modelName?: string;
  year?: number;
  fuelType?: string;
  transmission?: string;
  mileage?: number;
  condition?: string;
};

export async function getStorefrontProductById(
  productId: string
): Promise<StorefrontProductDoc | null> {
  if (skipMongoConnectionDuringBuild() || !ObjectId.isValid(productId)) {
    return null;
  }

  let client: MongoClient | undefined;
  try {
    client = new MongoClient(getMongoDbUri(), {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    await client.connect();
    const doc = await client
      .db(getMongoDbName())
      .collection("products")
      .findOne({ _id: new ObjectId(productId) });

    if (!doc || isProductHidden(doc)) return null;
    return doc as StorefrontProductDoc;
  } catch {
    return null;
  } finally {
    await client?.close();
  }
}
