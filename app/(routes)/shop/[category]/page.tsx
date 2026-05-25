import { Metadata } from "next";
import filteredData from "@/app/utils/filteredData";
import { sortSoldLast } from "@/lib/shop-products";
import { Product } from "@/types";
import ShopProductCard from "@/components/ui/shop-product-card";
import { skipMongoConnectionDuringBuild } from "@/lib/mongodb-connection";
import { prisma } from "@/lib/prisma";
import { withMongoIds } from "@/lib/serialize-api";

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

export const dynamic = "force-dynamic";

const CategoryPage = async ({ params, searchParams }: CategoryPageProps) => {
  try {
    if (skipMongoConnectionDuringBuild()) {
      return (
        <div className="px-6 py-12 text-center">
          <p className="text-muted-foreground">No vehicles in this category right now.</p>
        </div>
      );
    }

    const dbProducts = await prisma.product.findMany({
      where: { category: { equals: params.category, mode: "insensitive" } },
    });

    const products: Product[] = withMongoIds(dbProducts).map((p) => ({
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
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    }));

    const inCategory = products.filter(
      (p) => p.category.toLowerCase() === params.category.toLowerCase()
    );

    const displayed = sortSoldLast(filteredData(searchParams || {}, [...inCategory]));

    if (displayed.length === 0) {
      return (
        <div className="px-6 py-12 text-center">
          <p className="text-muted-foreground">No vehicles in this category right now.</p>
        </div>
      );
    }

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
        <p className="text-sm text-gray-500 mt-2">
          Error: {error instanceof Error ? error.message : "Unknown error"}
        </p>
      </div>
    );
  }
};

export default CategoryPage;
