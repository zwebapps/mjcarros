"use client";

import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { resolvePublicImageSrc } from "@/lib/resolve-image-src";
import { cn } from "@/lib/utils";
import { ListingBadgeStack } from "@/components/ui/listing-badge-stack";
import { NegotiableRibbon, SaleRibbon } from "@/components/ui/listing-ribbons";

interface Product {
  _id?: string;
  id: string;
  title: string;
  price: number;
  finalPrice?: number;
  discount?: number;
  imageURLs: string[];
  category: string;
  featured?: boolean;
  sold?: boolean;
  negotiable?: boolean;
}

interface ProductCardProps {
  data: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ data }) => {
  const product = data;
  const displayPrice = product.finalPrice || product.price;
  const hasDiscount = product.discount && product.discount > 0;
  const isSold = !!product.sold;
  const raw = product.imageURLs?.[0];
  const thumbSrc = raw
    ? resolvePublicImageSrc(raw)
    : "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1200&h=750&fit=crop";

  return (
    <Link href={`/product/${product._id || product.id}`} className="block h-full">
      <article
        className={cn(
          "group flex h-full cursor-pointer flex-col overflow-hidden rounded-xl border border-border bg-card shadow-card",
          "transition-all duration-300 hover:border-primary/50 hover:shadow-card-hover"
        )}
      >
        <div className="relative aspect-[16/10] overflow-hidden bg-muted">
          <img
            src={thumbSrc}
            alt={product.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
          {isSold && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/65">
              <span className="rounded-md bg-foreground px-5 py-2 text-sm font-bold tracking-wide text-background">
                SOLD
              </span>
            </div>
          )}

          <ListingBadgeStack
            category={product.category}
            featured={product.featured}
            sold={isSold}
            className="right-3 top-3"
          />

          {hasDiscount && !isSold && <SaleRibbon />}
          {product.negotiable && !isSold && <NegotiableRibbon />}
        </div>

        <div className="flex flex-grow flex-col p-5 sm:p-6">
          <h3 className="line-clamp-2 text-lg font-semibold leading-snug tracking-tight text-card-foreground transition-colors group-hover:text-primary sm:text-xl">
            {product.title}
          </h3>

          <div className="mt-auto pt-4">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              {hasDiscount ? (
                <>
                  <span className="text-2xl font-bold tabular-nums tracking-tight text-destructive sm:text-[1.65rem]">
                    {formatCurrency(displayPrice, "EUR")}
                  </span>
                  <span className="text-base text-muted-foreground line-through tabular-nums">
                    {formatCurrency(product.price, "EUR")}
                  </span>
                </>
              ) : (
                <span className="text-2xl font-bold tabular-nums tracking-tight text-primary sm:text-[1.65rem]">
                  {formatCurrency(displayPrice, "EUR")}
                </span>
              )}
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
};

export default ProductCard;
