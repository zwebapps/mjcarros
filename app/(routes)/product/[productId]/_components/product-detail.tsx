"use client";

import { useEffect, useState } from "react";
import Gallery from "@/components/gallery/gallery";
import Info from "@/components/gallery/info";
import ProductCard from "@/components/ui/product-card";
import { Product } from "@/types";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import Spinner from "@/components/Spinner";
import { resolvePublicImageSrc } from "@/lib/resolve-image-src";
import { useLocale } from "@/components/locale-provider";
import { t as translate } from "@/lib/i18n";

interface ProductDetailProps {
  productId: string;
}

const ProductDetail: React.FC<ProductDetailProps> = ({ productId }) => {
  const { locale, t } = useLocale();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!productId) {
      setError(translate(locale, "product.invalidId"));
      setIsLoading(false);
      return;
    }

    const fetchProduct = async () => {
      try {
        const response = await fetch(`/api/product/${productId}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch product: ${response.status}`);
        }

        const data = await response.json();

        if (!data.product) {
          throw new Error(translate(locale, "product.notFound"));
        }

        const rawImages = data.product.imageURLs;
        const imageURLs: string[] = (
          Array.isArray(rawImages)
            ? rawImages.filter(
                (u: unknown) => typeof u === "string" && String(u).trim().length > 0
              )
            : rawImages != null && String(rawImages).trim() !== ""
              ? [String(rawImages)]
              : []
        ).map((u) => resolvePublicImageSrc(String(u)));

        const baseProduct: Product = {
          id: data.product._id?.toString(),
          title: data.product.title,
          description: data.product.description,
          price: data.product.price,
          finalPrice: data.product.finalPrice || undefined,
          discount: data.product.discount || undefined,
          featured: data.product.featured,
          sold: !!data.product.sold,
          negotiable: !!data.product.negotiable,
          imageURLs,
          category: data.product.category,
          categoryId: data.product.categoryId,
          modelName: data.product.modelName,
          year: data.product.year,
          fuelType: data.product.fuelType,
          transmission: data.product.transmission,
          mileage: data.product.mileage,
          condition: data.product.condition,
          createdAt: data.product.createdAt,
          updatedAt: data.product.updatedAt,
        };

        const mapImages = (p: {
          imageURLs?: unknown;
        }): string[] => {
          const raw = p?.imageURLs;
          const list = Array.isArray(raw)
            ? raw.filter(
                (u: unknown) => typeof u === "string" && String(u).trim().length > 0
              )
            : raw != null && String(raw).trim() !== ""
              ? [String(raw)]
              : [];
          return list.map((u) => resolvePublicImageSrc(String(u)));
        };

        const transformedRelatedProducts: Product[] = (
          data.relatedProducts || []
        ).map((dbProduct: Product & { _id?: string }) => ({
          id: dbProduct._id?.toString() || dbProduct.id,
          title: dbProduct.title,
          description: dbProduct.description,
          price: dbProduct.price,
          finalPrice: dbProduct.finalPrice || undefined,
          discount: dbProduct.discount || undefined,
          featured: dbProduct.featured,
          sold: !!dbProduct.sold,
          negotiable: !!dbProduct.negotiable,
          imageURLs: mapImages(dbProduct),
          category: dbProduct.category,
          categoryId: dbProduct.categoryId,
          createdAt: dbProduct.createdAt,
          updatedAt: dbProduct.updatedAt,
        }));

        setProduct(baseProduct);
        setRelatedProducts(transformedRelatedProducts);
      } catch (err) {
        console.error("Error fetching product:", err);
        setError(
          err instanceof Error ? err.message : translate(locale, "common.error")
        );
      } finally {
        setIsLoading(false);
      }
    };

    setIsLoading(true);
    void fetchProduct();
  }, [productId]);

  if (isLoading) {
    return (
      <div className="page-canvas flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <Spinner />
          <p className="mt-4 text-muted-foreground">{t("product.loading")}</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="page-canvas flex min-h-[50vh] items-center justify-center px-4">
        <div className="text-center">
          <p className="mb-4 text-lg text-destructive">
            {error || t("product.notFound")}
          </p>
          <Link
            href="/shop"
            className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
          >
            <ArrowLeft className="h-5 w-5 shrink-0" />
            {t("product.backToShop")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-canvas min-h-full w-full">
      <div className="product-page-shell mx-auto w-full max-w-[1400px] bg-card">
        <div className="px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
          <Link
            href="/shop"
            className="mb-6 inline-flex items-center gap-1 font-semibold text-foreground hover:text-primary"
          >
            <ArrowLeft className="h-5 w-5 shrink-0" />
            {t("product.backToShop")}
          </Link>

          <div className="lg:grid lg:grid-cols-[minmax(0,520px)_minmax(0,1fr)] lg:items-start lg:gap-x-10">
            <Gallery
              images={product.imageURLs}
              sold={product.sold}
              negotiable={!!product.negotiable}
            />
            <div className="mt-8 min-w-0 lg:mt-0">
              <Info data={product} />
            </div>
          </div>

          {relatedProducts.length > 0 && (
            <>
              <hr className="my-10 border-border" />
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-brand sm:text-3xl">
                  {t("product.recommended")}
                </h3>
                <div className="shop-grid-catalog !p-0">
                  {relatedProducts.map((item: Product) => (
                    <ProductCard key={item.id} data={item} />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
