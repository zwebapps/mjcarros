"use client";

import { getCategoryProducts } from "@/lib/apiCalls";
import { Product } from "@/types";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

type PriceInputProps = {
  data: Product[];
};

const PriceInput = ({ data }: PriceInputProps) => {
  const pathName = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const searchParamsKey = useMemo(() => searchParams?.toString() ?? "", [searchParams]);

  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(0);
  const [value, setValue] = useState<number>(0);

  const handleSortChange = useCallback(
    async (val: string, explicitMax?: number) => {
      const current = new URLSearchParams(Array.from(searchParams?.entries() || []));
      const ceiling = explicitMax ?? maxPrice;

      const num = Number(val);
      if (!val || Number.isNaN(num) || num >= ceiling) {
        current.delete("price");
      } else {
        current.set("price", String(Math.round(num)));
      }
      const search = current.toString();
      const query = search ? `?${search}` : "";
      const base = pathName ?? "/shop";

      await router.replace(`${base}${query}`);
    },
    [searchParams, pathName, router, maxPrice]
  );

  useEffect(() => {
    const applyUrlPrice = (computedMin: number, computedMax: number) => {
      const raw = searchParams?.get("price");
      if (raw == null || raw === "") {
        setValue(computedMax);
        return;
      }
      const n = Number(raw);
      if (Number.isNaN(n)) {
        setValue(computedMax);
        return;
      }
      const clamped = Math.min(Math.max(n, computedMin), computedMax);
      setValue(clamped);
    };

    const computeFromProducts = (products: Product[]) => {
      if (!products || products.length === 0) {
        setMinPrice(0);
        setMaxPrice(0);
        setValue(0);
        return;
      }
      const prices = products.map((p) =>
        p.finalPrice && p.finalPrice > 0 ? p.finalPrice : p.price
      );
      const computedMin = Math.min(...prices);
      const computedMax = Math.max(...prices);
      setMinPrice(computedMin);
      setMaxPrice(computedMax);
      applyUrlPrice(computedMin, computedMax);
    };

    const init = async () => {
      if (pathName?.startsWith("/shop/") && pathName !== "/shop") {
        const urlString = pathName.substring("/shop/".length);
        const categoryProducts = await getCategoryProducts(urlString);
        computeFromProducts(categoryProducts as unknown as Product[]);
        return;
      }
      if (data && data.length > 0) {
        computeFromProducts(data);
        return;
      }
      try {
        const res = await fetch("/api/shop/sidebar", { cache: "no-store" });
        if (res.ok) {
          const json = await res.json();
          computeFromProducts((json.products ?? []) as Product[]);
        } else {
          computeFromProducts([]);
        }
      } catch {
        computeFromProducts([]);
      }
    };

    void init();
  }, [pathName, data, searchParamsKey, searchParams]);

  return (
    <div className="range-container">
      <div className="range-label flex justify-between">
        <div className="flex flex-col gap-y-1">
          <p className="shop-filter-label mb-0">Price</p>
          <span className="text-lg font-bold tabular-nums text-primary">
            €{value?.toFixed(0)}
          </span>
        </div>
      </div>
      <input
        type="range"
        min={minPrice}
        max={maxPrice}
        value={value}
        step="1"
        onChange={(e) => {
          const n = parseFloat(e.target.value);
          setValue(n);
          void handleSortChange(e.target.value, maxPrice);
        }}
        className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-lg bg-muted accent-primary"
      />
    </div>
  );
};

export default PriceInput;
