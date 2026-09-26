import { Metadata } from "next";
import ProductCard from "@/components/ui/product-card";
import filteredData from "@/app/utils/filteredData";
import { Product } from "@/types";
import { skipMongoConnectionDuringBuild } from "@/lib/mongodb-connection";
import { getFeaturedProducts } from "@/lib/data-access";

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
    if (skipMongoConnectionDuringBuild()) {
      return (
        <div className="text-center py-12">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Featured vehicles</h1>
          <p className="text-gray-600">No featured vehicles are available right now.</p>
        </div>
      );
    }

    const rows = await getFeaturedProducts();
    const products: Product[] = rows.map((p: (typeof rows)[number]) => ({
      id: p._id,
      title: p.title,
      description: p.description,
      price: p.price,
      finalPrice: p.finalPrice || undefined,
      discount: p.discount || undefined,
      featured: p.featured,
      sold: !!p.sold,
      negotiable: !!p.negotiable,
      imageURLs: p.imageURLs || [],
      category: p.category,
      categoryId: p.categoryId,
      createdAt: p.createdAt
        ? new Date(p.createdAt).toISOString()
        : new Date().toISOString(),
      updatedAt: p.updatedAt
        ? new Date(p.updatedAt).toISOString()
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
          <p className="text-gray-600">
            No featured vehicles match your filters. Try adjusting sort or search.
          </p>
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
