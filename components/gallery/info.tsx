"use client";

import { ShoppingCart } from "lucide-react";

import { Category, Product } from "@/types";
import { Button } from "../ui/button";

interface InfoProps {
  data: Product;
  categories: Category[];
  availableSizes: Category[];
}

const Info: React.FC<InfoProps> = ({ data, categories, availableSizes }) => {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900">{data.title}</h1>
      
      {/* Category Badge */}
      <div className="mt-3">
        <span className="inline-block bg-blue-600 text-white text-sm px-3 py-1 rounded-full font-medium">
          {data.category}
        </span>
        {data.featured && (
          <span className="ml-2 inline-block bg-yellow-500 text-white text-sm px-3 py-1 rounded-full font-medium">
            Featured
          </span>
        )}
      </div>

      {/* Pricing */}
      <div className="mt-3 flex items-end justify-between">
        {data.finalPrice && data.finalPrice > 0 && data.discount && data.discount > 0 ? (
          <div className="font-semibold">
            <div className="flex items-center gap-2">
              <span className="text-gray-500 line-through">
                ${Number(data?.price).toLocaleString()}
              </span>
              <div className="bg-red-600 text-sm text-white p-1 px-2 font-semibold rounded-sm">
                -{data?.discount}%
              </div>
            </div>
            <p className="text-2xl text-gray-900 font-semibold mt-1">
              ${data.finalPrice.toLocaleString()}
            </p>
          </div>
        ) : (
          <p className="text-2xl text-gray-900 font-semibold">
            ${Number(data?.price).toLocaleString()}
          </p>
        )}
      </div>

      {/* Description */}
      <div className="flex items-center gap-x-4 mt-3">
        <span className="text-sm font-serif text-[#4a4a4a]">
          {data?.description}
        </span>
      </div>

      {/* Size Selection - Only show if sizes are available */}
      {categories && categories.length > 0 && (
        <>
          <div className="flex mt-2 flex-wrap gap-2 flex-col">
            <span className="text-xl font-semibold py-2 text-gray-900">Size</span>
            <div className="flex flex-wrap gap-2">
              {categories?.map((category: any) => {
                const isSizeAvailableInCategory = availableSizes.some((size: any) => size.sizeId === category.id);
                return (
                  <Button
                    type="button"
                    className={`${
                      isSizeAvailableInCategory
                        ? ""
                        : "disabled:pointer-events-auto relative z-10 cursor-not-allowed overflow-hidden bg-neutral-100 text-neutral-500 ring-1 ring-neutral-300 before:absolute before:inset-x-0 before:-z-10 before:h-px before:-rotate-45 before:bg-neutral-300 before:transition-transform hover:bg-transparent"
                    } flex min-w-[48px] items-center justify-center rounded-full border px-2 py-1 text-sm`}
                    key={category.id}
                    disabled={!isSizeAvailableInCategory}
                  >
                    {category.name}
                  </Button>
                );
              })}
            </div>
          </div>
          <hr className="my-4" />
        </>
      )}

      {/* Add to Cart Button */}
      <div className="mt-10 flex items-center gap-x-3">
        <Button
          disabled={categories.length > 0}
          className="flex items-center gap-x-2"
        >
          Add To Cart
          <ShoppingCart size={20} />
        </Button>
      </div>
    </div>
  );
};

export default Info;
