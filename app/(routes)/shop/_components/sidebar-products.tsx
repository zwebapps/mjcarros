"use client";

import { useEffect, useState } from "react";
import SidebarItems from "./sidebar-items";
import PriceInput from "./price-input";
import { Product } from "@/types";
import {
  sortCategoriesForDisplay,
  DEFAULT_CATEGORY_ORDER,
} from "@/lib/default-categories";
import type { ShopSidebarPayload } from "@/lib/shop-sidebar-data";

const fallbackCategories = sortCategoriesForDisplay(
  DEFAULT_CATEGORY_ORDER.map((name) => ({ id: name, category: name, count: 0 }))
);

const SidebarProducts = () => {
  const [data, setData] = useState<ShopSidebarPayload | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch("/api/shop/sidebar", { cache: "no-store" });
        if (!res.ok) throw new Error("sidebar fetch failed");
        const json = (await res.json()) as ShopSidebarPayload;
        if (!cancelled) {
          setData(json);
          setError(false);
        }
      } catch (e) {
        console.error("Shop sidebar load error:", e);
        if (!cancelled) setError(true);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const categories = data?.categories ?? fallbackCategories;
  const totalCount = data?.totalCount ?? 0;
  const products = (data?.products ?? []) as Product[];

  return (
    <aside className="shop-sidebar">
      <div className="shop-sidebar-inner">
        <div>
          <p className="shop-sidebar-title">Category</p>
          {error && !data && (
            <p className="mb-2 text-xs text-destructive">Could not load counts. Refresh the page.</p>
          )}
          <SidebarItems categories={categories} totalCount={totalCount} />
        </div>
        <div className="shop-filter-panel">
          <PriceInput data={products} />
        </div>
      </div>
    </aside>
  );
};

export default SidebarProducts;
