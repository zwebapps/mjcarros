import Link from "next/link";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/ui/product-card";
import { HeroCarousel } from "@/components/home/hero-carousel";
import { HomeCtaSection } from "@/components/home/home-cta-section";
import { skipMongoConnectionDuringBuild } from "@/lib/mongodb-connection";
import {
  getFeaturedProducts,
  getCategoriesWithProductCounts,
  getBillboards,
} from "@/lib/data-access";
import { prisma } from "@/lib/prisma";
import { Product } from "@/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
  if (skipMongoConnectionDuringBuild()) {
    return [];
  }

  try {
    const [categories, billboards, productCategories] = await Promise.all([
      getCategoriesWithProductCounts(),
      getBillboards(),
      prisma.product.findMany({ select: { category: true } }),
    ]);

    const counts = new Map<string, number>();
    for (const p of productCategories) {
      const key = String(p.category || "").trim();
      if (!key) continue;
      counts.set(key, (counts.get(key) || 0) + 1);
    }

    const billboardImageById = new Map(
      billboards.map((b: (typeof billboards)[number]) => [b.id, String(b.imageURL || "")])
    );

    const slugify = (s: string) =>
      s
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9_-]/g, "");

    const rows = categories.map((cat: (typeof categories)[number]) => {
      const name = String(cat.category || "").trim();
      const count = counts.get(name) ?? cat.productCount ?? 0;
      const bbId = cat.billboardId || "";
      const billboardImage = (bbId && billboardImageById.get(bbId)) || "";
      const isPlaceholder =
        !billboardImage || billboardImage.includes("/placeholder-image.");
      const localCategoryImage = `/uploads/category/${slugify(name)}.jpg`;
      const image = isPlaceholder ? localCategoryImage : billboardImage;
      return { name, count, image };
    });

    for (const [name, count] of counts) {
      if (!rows.some((r: { name: string }) => r.name === name)) {
        const localCategoryImage = `/uploads/category/${slugify(name)}.jpg`;
        rows.push({ name, count, image: localCategoryImage });
      }
    }

    return rows.sort((a: { count: number }, b: { count: number }) => b.count - a.count).slice(0, 8);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

const HomePage = async () => {
  const featured = skipMongoConnectionDuringBuild()
    ? []
    : await getFeaturedProducts(8).catch(() => []);
  const categories = await getCategoriesWithCounts();

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
            {categories.map((category: { name: string; count: number; image: string }) => (
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
            {featured.map((product: (typeof featured)[number]) => (
              <ProductCard
                key={product._id}
                data={{ ...product, id: product._id } as Product}
              />
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

      <HomeCtaSection />
    </div>
  );
};

export default HomePage;
