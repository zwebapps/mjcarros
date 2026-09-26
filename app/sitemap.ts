import type { MetadataRoute } from "next";
import { toCategorySlug } from "@/lib/category-slug";
import { CLIENT_VISIBLE_PRODUCT_FILTER } from "@/lib/product-visibility";
import { skipMongoConnectionDuringBuild } from "@/lib/mongodb-connection";
import { prisma } from "@/lib/prisma";
import { getSiteUrl } from "@/lib/site-url";

// Built at request time: at image-build time there is no database, so a static sitemap would list no vehicles.
export const dynamic = "force-dynamic";

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

  try {
    const products = await prisma.product.findMany({
      where: CLIENT_VISIBLE_PRODUCT_FILTER,
      select: { id: true, legacyMongoId: true, category: true, updatedAt: true },
    });

    const categoryNames = new Set(
      products.map((p) => p.category.trim()).filter(Boolean)
    );
    for (const name of categoryNames) {
      const slug = toCategorySlug(name);
      if (!slug) continue;
      entries.push({
        url: `${base}/shop/${encodeURIComponent(slug)}`,
        lastModified: now,
        changeFrequency: "daily",
        priority: 0.8,
      });
    }

    for (const product of products) {
      entries.push({
        url: `${base}/product/${product.legacyMongoId ?? product.id}`,
        lastModified: product.updatedAt,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
  } catch (error) {
    console.error("[sitemap] Failed to load dynamic URLs:", error);
  }

  return entries;
}
