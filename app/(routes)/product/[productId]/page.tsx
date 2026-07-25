import { type Metadata } from "next";
import { siteConfig } from "@/config/site";
import ProductDetail from "./_components/product-detail";
import Link from "next/link";
import { JsonLd } from "@/components/seo/json-ld";
import { buildProductJsonLd } from "@/lib/product-json-ld";
import { resolvePublicImageSrc } from "@/lib/resolve-image-src";
import { absoluteUrl } from "@/lib/site-url";
import { getStorefrontProductById } from "@/lib/storefront-product";

export async function generateMetadata({
  params,
}: {
  params: { productId: string };
}): Promise<Metadata> {
  const product = await getStorefrontProductById(params.productId);

  if (!product) {
    return {
      title: "Veículo não encontrado",
      description: "O veículo solicitado não está disponível.",
      robots: { index: false, follow: true },
    };
  }

  const title = product.title;
  const description =
    product.description?.slice(0, 160) ||
    `${product.title} — ${siteConfig.name}`;
  const canonical = `/product/${params.productId}`;
  const firstImage = Array.isArray(product.imageURLs)
    ? product.imageURLs.find((u) => typeof u === "string" && u.trim())
    : undefined;
  const ogImage = firstImage
    ? absoluteUrl(resolvePublicImageSrc(firstImage))
    : siteConfig.ogImage;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      url: absoluteUrl(canonical),
      title: `${title} | ${siteConfig.name}`,
      description,
      images: [{ url: ogImage, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${siteConfig.name}`,
      description,
      images: [ogImage],
    },
  };
}

const ProductPage = async ({ params }: { params: { productId: string } }) => {
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

  const product = await getStorefrontProductById(params.productId);

  return (
    <>
      {product ? (
        <JsonLd data={buildProductJsonLd(product, params.productId)} />
      ) : null}
      <ProductDetail productId={params.productId} />
    </>
  );
};

export default ProductPage;
