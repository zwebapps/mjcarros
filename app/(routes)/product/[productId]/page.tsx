import { type Metadata } from "next";
import { siteConfig } from "@/config/site";
import ProductDetail from "./_components/product-detail";
import Link from "next/link";
import { skipMongoConnectionDuringBuild } from "@/lib/mongodb-connection";
import { getProductById } from "@/lib/data-access";

export async function generateMetadata({
  params,
}: {
  params: { productId: string };
}): Promise<Metadata> {
  if (skipMongoConnectionDuringBuild()) {
    return {
      title: "Product | MJ Carros",
      description: "Product details",
    };
  }

  try {
    const product = await getProductById(params.productId);

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
  } catch {
    return {
      title: "Product | MJ Carros",
      description: "Product details",
    };
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
