import Link from "next/link";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/ui/product-card";
import { HeroCarousel } from "@/components/home/hero-carousel";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getFeaturedProducts() {
  let client: any;
  try {
    const { skipMongoConnectionDuringBuild, getMongoDbUri, getMongoDbName } = await import(
      "@/lib/mongodb-connection"
    );
    if (skipMongoConnectionDuringBuild()) {
      return [] as any[];
    }
    const { MongoClient } = await import("mongodb");
    const MONGODB_URI = getMongoDbUri();
    client = new MongoClient(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    await client.connect();
    const db = client.db(getMongoDbName());
    const productsCollection = db.collection("products");
    const docs = await productsCollection
      .find({ featured: true })
      .sort({ updatedAt: -1 })
      .limit(8)
      .toArray();
    return docs.map((p: any) => ({
      ...p,
      id: (p._id || "").toString(),
      imageURLs: Array.isArray(p.imageURLs) ? p.imageURLs : [],
    }));
  } catch (e) {
    console.warn("Failed to load featured products, returning empty list");
    return [] as any[];
  } finally {
    if (client) {
      await client.close();
    }
  }
}

const banners = [
  {
    id: "1",
    title: "Seasonal offers",
    subtitle: "Selected vehicles with competitive pricing",
    image:
      "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&h=400&fit=crop",
    cta: "View offers",
    link: "/shop",
  },
  {
    id: "2",
    title: "New arrivals",
    subtitle: "Recently added to our showroom inventory",
    image:
      "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&h=400&fit=crop",
    cta: "Explore featured",
    link: "/featured",
  },
];

async function getCategoriesWithCounts() {
  let client;
  try {
    const { skipMongoConnectionDuringBuild, getMongoDbUri, getMongoDbName } = await import(
      "@/lib/mongodb-connection"
    );
    if (skipMongoConnectionDuringBuild()) {
      return [];
    }
    const { MongoClient, ObjectId } = await import("mongodb");
    const MONGODB_URI = getMongoDbUri();
    client = new MongoClient(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    await client.connect();
    const db = client.db(getMongoDbName());
    const productsCollection = db.collection("products");
    const categoriesCollection = db.collection("categories");
    const billboardsCollection = db.collection("billboards");

    const [products, categories] = await Promise.all([
      productsCollection.find({}).project({ category: 1 }).toArray(),
      categoriesCollection.find({}).project({ category: 1, billboardId: 1 }).toArray(),
    ]);

    const counts = new Map<string, number>();
    for (const p of products) {
      const key = String(p.category || "").trim();
      if (!key) continue;
      counts.set(key, (counts.get(key) || 0) + 1);
    }

    const billboardIdByCategory = new Map<string, string>();
    for (const c of categories) {
      const key = String(c.category || "").trim();
      const bbId = c.billboardId ? String(c.billboardId) : "";
      if (key && bbId) billboardIdByCategory.set(key, bbId);
    }

    const billboardIds = Array.from(new Set(Array.from(billboardIdByCategory.values())));
    const billboards = billboardIds.length
      ? await billboardsCollection
          .find({ _id: { $in: billboardIds.map((id) => new ObjectId(id)) } })
          .project({ imageURL: 1 })
          .toArray()
      : [];

    const billboardImageById = new Map<string, string>();
    for (const b of billboards) {
      billboardImageById.set(String(b._id), String((b as any).imageURL || ""));
    }

    const slugify = (s: string) =>
      s
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9_-]/g, "");

    const rows = Array.from(counts.entries()).map(([name, count]) => {
      const bbId = billboardIdByCategory.get(name) || "";
      const billboardImage = (bbId && billboardImageById.get(bbId)) || "";
      const isPlaceholder =
        !billboardImage || billboardImage.includes("/placeholder-image.");
      const localCategoryImage = `/uploads/category/${slugify(name)}.jpg`;
      const image = isPlaceholder ? localCategoryImage : billboardImage;
      return { name, count, image };
    });

    return rows.sort((a, b) => b.count - a.count).slice(0, 8);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  } finally {
    if (client) {
      await client.close();
    }
  }
}

const HomePage = async () => {
  const [categories, featured] = await Promise.all([
    getCategoriesWithCounts(),
    getFeaturedProducts(),
  ]);

  return (
    <div className="page-canvas">
      <HeroCarousel />

      <section className="section-tint">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="section-heading mb-12">
            <h2>Browse by category</h2>
            <p>
              Explore our inventory organised by vehicle type — from everyday models to
              premium selections.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
            {categories.map((category) => (
              <Link
                key={category.name}
                href={`/shop/${category.name.toLowerCase()}`}
                className="group"
              >
                <div className="relative overflow-hidden rounded-xl border border-border bg-card shadow-card transition-all duration-300 group-hover:border-primary/40 group-hover:shadow-card-hover">
                  <img
                    src={category.image}
                    alt={category.name}
                    className="h-40 w-full object-cover transition-transform duration-500 group-hover:scale-[1.04] sm:h-44"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-brand/85 via-brand/40 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                    <h3 className="text-lg font-semibold tracking-tight">
                      {category.name}
                    </h3>
                    <p className="text-sm text-white/85">
                      {category.count} {category.count === 1 ? "vehicle" : "vehicles"}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section-tint-alt">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="section-heading mb-12">
            <h2>Featured inventory</h2>
            <p>
              A curated selection from our showroom — each vehicle prepared, priced clearly,
              and ready for you to view.
            </p>
          </div>
          <div className="product-grid">
            {featured.map((product: any) => (
              <ProductCard key={product.id} data={product} />
            ))}
          </div>
          <div className="mt-12 text-center">
            <Link href="/shop">
              <Button size="lg">View full inventory</Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
          {banners.map((banner) => (
            <div
              key={banner.id}
              className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-card"
            >
              <img
                src={banner.image}
                alt={banner.title}
                className="h-64 w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand/85 via-brand/35 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                <h3 className="mb-2 text-2xl font-bold tracking-tight">{banner.title}</h3>
                <p className="mb-4 text-base text-white/90">{banner.subtitle}</p>
                <Link href={banner.link}>
                  <Button size="lg">{banner.cta}</Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="gradient-brand py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Your next car, direct from MJ Carros
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-white/90 sm:text-lg">
            We sell our own stock — browse current vehicles, enquire online, and track your
            order with a secure MJ Carros account.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link href="/shop">
              <Button size="lg">View our stock</Button>
            </Link>
            <Link href="/sign-up">
              <Button
                size="lg"
                variant="outline"
                className="border-white/85 bg-transparent text-white hover:bg-white hover:text-brand"
              >
                Create account
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
