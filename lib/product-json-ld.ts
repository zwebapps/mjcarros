import { resolvePublicImageSrc } from "@/lib/resolve-image-src";
import { absoluteUrl } from "@/lib/site-url";
import { siteConfig } from "@/config/site";
import type { StorefrontProductDoc } from "@/lib/storefront-product";
import { markdownToPlainText } from "@/lib/plain-text";

function productImages(product: StorefrontProductDoc): string[] {
  const raw = product.imageURLs;
  const list = Array.isArray(raw)
    ? raw.filter((u): u is string => typeof u === "string" && u.trim().length > 0)
    : [];
  return list.map((u) => absoluteUrl(resolvePublicImageSrc(u)));
}

export function buildProductJsonLd(
  product: StorefrontProductDoc,
  productId: string
): Record<string, unknown> {
  const url = absoluteUrl(`/product/${productId}`);
  const images = productImages(product);
  const price =
    typeof product.finalPrice === "number" && product.finalPrice > 0
      ? product.finalPrice
      : product.price;

  const item: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: markdownToPlainText(product.description || "") || product.title,
    url,
    image: images.length > 0 ? images : undefined,
    brand: product.modelName
      ? { "@type": "Brand", name: product.modelName }
      : undefined,
    category: product.category,
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "EUR",
      price: typeof price === "number" ? price : undefined,
      availability: product.sold
        ? "https://schema.org/SoldOut"
        : "https://schema.org/InStock",
      seller: {
        "@type": "AutoDealer",
        name: siteConfig.name,
        url: absoluteUrl("/"),
      },
    },
  };

  if (product.year || product.fuelType || product.transmission || product.mileage) {
    item.additionalProperty = [
      product.year != null && { name: "year", value: String(product.year) },
      product.fuelType && { name: "fuelType", value: product.fuelType },
      product.transmission && { name: "transmission", value: product.transmission },
      product.mileage != null && { name: "mileage", value: String(product.mileage) },
      product.condition && { name: "condition", value: product.condition },
    ].filter(Boolean);
  }

  return item;
}
