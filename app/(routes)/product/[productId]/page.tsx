import { type Metadata } from "next";
import { db } from "@/lib/db"; // Use your global Prisma client
import { siteConfig } from "@/config/site";
import ProductDetail from "./_components/product-detail";

export async function generateMetadata({
  params,
}: {
  params: { productId: string };
}): Promise<Metadata> {
  // If db is not initialized (e.g., during build), return default metadata
  if (!db) {
    return {
      title: "Product | MJ Carros",
      description: "Product details",
    };
  }

  try {
    const product = await db.product.findUnique({
      where: { id: params.productId },
    });

    if (!product) {
      return {
        title: "Product Not Found | MJ Carros",
        description: "The requested product could not be found",
      };
    }

    return {
      title: `${product.title} | ${siteConfig.name}`,
      description: product.description,
    };
  } catch (error) {
    return {
      title: "Product | MJ Carros",
      description: "Product details",
    };
  }
}

const ProductPage = ({ params }: { params: { productId: string } }) => {
  return <ProductDetail productId={params.productId} />;
};

export default ProductPage;
