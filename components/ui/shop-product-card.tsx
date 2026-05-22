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

interface ShopProductCardProps {
  data: Product;
}

const ShopProductCard: React.FC<ShopProductCardProps> = ({ data }) => {
  const product = data;
  const displayPrice = product.finalPrice || product.price;
  const hasDiscount = product.discount && product.discount > 0;
  const isNegotiable = !!product.negotiable;
  const isSold = !!product.sold;
  const raw = product.imageURLs?.[0];
  const thumbSrc = raw
    ? resolvePublicImageSrc(raw)
    : "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1200&h=750&fit=crop";

  return (
    <Link href={`/product/${product._id || product.id}`} className="block h-full">
      <article
        className={cn(
          "group flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm",
          "transition-shadow duration-200 hover:shadow-md"
        )}
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          <img
            src={thumbSrc}
            alt={product.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
          {isSold && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/65">
              <span className="rounded bg-brand px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-brand-foreground">
                Sold
              </span>
            </div>
          )}
          {hasDiscount && !isSold && <SaleRibbon />}
          {isNegotiable && !isSold && <NegotiableRibbon />}
          <ListingBadgeStack
            category={product.category}
            featured={product.featured}
            sold={isSold}
          />
        </div>

        <div className="bg-brand px-3 py-2.5 text-center">
          <h3 className="line-clamp-2 text-sm font-bold uppercase leading-snug tracking-wide text-brand-foreground">
            {product.title}
          </h3>
        </div>

        <div className="border-t border-border bg-card px-3 py-3 text-center">
          {hasDiscount ? (
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-xl font-bold tabular-nums text-primary sm:text-2xl">
                {formatCurrency(displayPrice, "EUR")}
              </span>
              <span className="text-sm text-muted-foreground line-through tabular-nums">
                {formatCurrency(product.price, "EUR")}
              </span>
            </div>
          ) : (
            <span className="text-xl font-bold tabular-nums text-primary sm:text-2xl">
              {formatCurrency(displayPrice, "EUR")}
            </span>
          )}
        </div>
      </article>
    </Link>
  );
};

export default ShopProductCard;
