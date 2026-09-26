"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { useLocale } from "@/components/locale-provider";
import { sortSoldLast } from "@/lib/shop-products";
import { Product } from "@/types";

type ListedProduct = Pick<Product, "title" | "sold"> & { _id: string };

/**
 * Link to the next vehicle in the shop's default order (newest first, sold last),
 * wrapping round to the first one after the last. Hidden until the list loads.
 */
export function NextCarLink({ productId }: { productId: string }) {
  const { t } = useLocale();
  const [next, setNext] = useState<ListedProduct | null>(null);

  useEffect(() => {
    let active = true;
    setNext(null);
    fetch("/api/product")
      .then((r) => (r.ok ? r.json() : []))
      .then((rows: ListedProduct[]) => {
        if (!active || !Array.isArray(rows)) return;
        const ordered = sortSoldLast(rows as unknown as Product[]) as unknown as ListedProduct[];
        const index = ordered.findIndex((p) => p._id === productId);
        if (index === -1 || ordered.length < 2) return;
        setNext(ordered[(index + 1) % ordered.length]);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [productId]);

  if (!next) return null;

  return (
    <Link
      href={`/product/${next._id}`}
      className="group inline-flex min-w-0 max-w-[60%] items-center gap-1 rounded-md font-semibold text-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:max-w-[50%]"
    >
      <span className="shrink-0">{t("product.nextCar")}</span>
      <span className="hidden truncate font-normal text-muted-foreground group-hover:text-primary sm:inline">
        · {next.title}
      </span>
      <ArrowRight className="h-5 w-5 shrink-0" aria-hidden="true" />
    </Link>
  );
}
