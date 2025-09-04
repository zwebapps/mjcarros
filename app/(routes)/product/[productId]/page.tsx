import { type Metadata } from "next";
import { PrismaClient } from "@prisma/client";
import { notFound } from "next/navigation";
import { siteConfig } from "@/config/site";
import ProductDetail from "./_components/product-detail";

const prisma = new PrismaClient();

export async function generateMetadata({
  params,
}: {
  params: { productId: string };
}): Promise<Metadata> {
  try {
    const product = await prisma.product.findUnique({
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
