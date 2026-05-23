"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale } from "@/components/locale-provider";

function formatCategoryLabel(segment: string): string {
  const decoded = decodeURIComponent(segment);
  return decoded
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const ShopToolbar = () => {
  const pathName = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useLocale();

  const title = useMemo(() => {
    if (!pathName?.startsWith("/shop/") || pathName === "/shop") {
      return t("shop.title");
    }
    const segment = pathName.replace(/^\/shop\//, "").split("/")[0] ?? "";
    return formatCategoryLabel(segment);
  }, [pathName, t]);

  const [selectedSort, setSelectedSort] = useState<string>(
    (searchParams?.get("sort") as string) || ""
  );

  const handleSortChange = useCallback(
    async (value: string) => {
      const current = new URLSearchParams(Array.from(searchParams?.entries() || []));

      if (!value || value === "") {
        current.delete("sort");
      } else {
        current.set("sort", value);
      }
      const search = current.toString();
      const query = search ? `?${search}` : "";

      await router.replace(`${pathName}${query}`);
      setSelectedSort(value);
    },
    [searchParams, pathName, router]
  );

  useEffect(() => {
    setSelectedSort(searchParams?.get("sort") || "");
  }, [searchParams]);

  return (
    <div className="shop-toolbar">
      <h1 className="shop-toolbar-title">{title}</h1>
      <div className="flex items-center gap-2">
        <label htmlFor="shop-sort" className="text-sm font-semibold text-foreground">
          {t("shop.sortBy")}
        </label>
        <select
          id="shop-sort"
          className="rounded-md border border-border bg-card px-3 py-2 text-sm font-medium text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          name="sorting"
          value={selectedSort}
          onChange={(e) => handleSortChange(e.target.value)}
        >
          <option value="">{t("shop.relevance")}</option>
          <option value="latest-arrivals">{t("shop.latestArrivals")}</option>
          <option value="price-low-to-high">{t("shop.priceLowHigh")}</option>
          <option value="price-high-to-low">{t("shop.priceHighLow")}</option>
        </select>
      </div>
    </div>
  );
};

export default ShopToolbar;
