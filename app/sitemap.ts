import type { MetadataRoute } from "next";
import { MongoClient } from "mongodb";
import { toCategorySlug } from "@/lib/category-slug";
import { CLIENT_VISIBLE_PRODUCT_FILTER } from "@/lib/product-visibility";
import {
  getMongoDbName,
  getMongoDbUri,
  skipMongoConnectionDuringBuild,
} from "@/lib/mongodb-connection";
import { getSiteUrl } from "@/lib/site-url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const now = new Date();

  const entries: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: "daily", priority: 1 },
    {
      url: `${base}/shop`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${base}/featured`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.85,
    },
    {
      url: `${base}/contact`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  if (skipMongoConnectionDuringBuild()) {
    return entries;
  }

  let client: MongoClient | undefined;
  try {
    client = new MongoClient(getMongoDbUri(), {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    await client.connect();
    const db = client.db(getMongoDbName());
    const productsCollection = db.collection("products");

    const categoryNames = await productsCollection.distinct("category", {
      ...CLIENT_VISIBLE_PRODUCT_FILTER,
      category: { $type: "string", $ne: "" },
    });

    for (const name of categoryNames) {
      if (typeof name !== "string" || !name.trim()) continue;
      const slug = toCategorySlug(name);
      if (!slug) continue;
      entries.push({
        url: `${base}/shop/${encodeURIComponent(slug)}`,
        lastModified: now,
        changeFrequency: "daily",
        priority: 0.8,
      });
    }

    const products = await productsCollection
      .find(CLIENT_VISIBLE_PRODUCT_FILTER, {
        projection: { updatedAt: 1 },
      })
      .toArray();

    for (const product of products) {
      const id = product._id?.toString();
      if (!id) continue;
      const updated =
        product.updatedAt instanceof Date
          ? product.updatedAt
          : product.updatedAt
            ? new Date(product.updatedAt as string)
            : now;
      entries.push({
        url: `${base}/product/${id}`,
        lastModified: updated,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
  } catch (error) {
    console.error("[sitemap] Failed to load dynamic URLs:", error);
  } finally {
    await client?.close();
  }

  return entries;
}
