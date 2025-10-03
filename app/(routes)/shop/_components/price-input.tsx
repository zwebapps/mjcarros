"use client";

import { getCategoryProducts, getAllProducts } from "@/lib/apiCalls";
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

  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(0);
  const [value, setValue] = useState<number>(0);

  const handleSortChange = useCallback(
    async (val: string) => {
      const current = new URLSearchParams(Array.from(searchParams?.entries() || []));

      const num = Number(val);
      if (!val || Number.isNaN(num) || num === maxPrice) {
        current.delete("price");
      } else {
        current.set("price", String(num));
      }
      const search = current.toString();
      const query = search ? `?${search}` : "";

      await router.replace(`${pathName}${query}`);
    },
    [searchParams, pathName, router, maxPrice]
  );

  useEffect(() => {
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
      setValue(computedMax);
    };

    const init = async () => {
      if (pathName?.startsWith("/shop/") && pathName !== "/shop") {
        const urlString = pathName.substring("/shop/".length);
        const categoryProducts = await getCategoryProducts(urlString);
        computeFromProducts(categoryProducts as unknown as Product[]);
      } else {
        if (data && data.length > 0) {
          computeFromProducts(data);
        } else {
          const all = await getAllProducts();
          computeFromProducts(all as unknown as Product[]);
        }
      }
    };

    init();
    // Recompute when pathname or data changes
  }, [pathName, data]);

  return (
    <div className="range-container mt-2">
      <div className="range-label flex justify-between">
        <div className="flex flex-col gap-y-1">
          <p className="font-semibold">Price</p>
          <span className="font-serif">${value?.toFixed(2)}</span>
        </div>
      </div>
      <input
        type="range"
        min={minPrice}
        max={maxPrice}
        value={value}
        step="1"
        onChange={(e) => {
          handleSortChange(e.target.value);
          setValue(parseFloat(e.target.value));
        }}
        className=" accent-neutral-800 w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
      />
    </div>
  );
};

export default PriceInput;
