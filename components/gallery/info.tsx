"use client";
import { formatCurrency } from "@/lib/utils";

import { ShoppingCart } from "lucide-react";

import { Category, Product } from "@/types";
import { Button } from "../ui/button";
import useCart from "@/hooks/use-cart";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import { formatProductDescription } from "@/lib/format-product-description";

interface InfoProps {
  data: Product;
}

const Info: React.FC<InfoProps> = ({ data }) => {
  const cart = useCart();

  const onAddToCart = () => {
    cart.addItem(data);
  };

  return (
    <div className="min-w-0 max-w-full">
      <h1 className="text-3xl font-bold text-gray-900 break-words">{data.title}</h1>

      {/* Category badges — flex-wrap so labels never run together on narrow widths */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="inline-block bg-blue-600 text-white text-sm px-3 py-1 rounded-full font-medium">
          {data.category}
        </span>
        {data.featured && (
          <span className="inline-block bg-yellow-500 text-white text-sm px-3 py-1 rounded-full font-medium">
            Featured
          </span>
        )}
      </div>

      {/* Pricing */}
      <div className="mt-3">
        {data.finalPrice && data.finalPrice > 0 && data.discount && data.discount > 0 ? (
          <div className="font-semibold">
            <div className="flex items-center gap-2">
              <span className="text-gray-500 line-through">
                {formatCurrency(Number(data?.price), "EUR")}
              </span>
              <div className="rounded-sm bg-red-600 p-1 px-2 text-sm font-semibold text-white">
                -{data?.discount}%
              </div>
            </div>
            <p className="mt-1 text-2xl font-semibold text-gray-900">
              {formatCurrency(Number(data.finalPrice), "EUR")}
            </p>
          </div>
        ) : (
          <p className="text-2xl font-semibold text-gray-900">
            {formatCurrency(Number(data?.price), "EUR")}
          </p>
        )}
      </div>

      {/* Rich description — markdown + tab-separated tables from admin editor */}
      <div className="mt-6 min-w-0 w-full">
        <div
          className={[
            "product-description prose prose-neutral max-w-none",
            "prose-headings:mt-6 prose-headings:mb-2 prose-headings:break-words prose-headings:text-gray-900",
            "prose-p:my-3 prose-p:break-words prose-p:leading-relaxed prose-p:text-gray-700",
            "prose-ul:my-3 prose-li:my-1 prose-li:break-words",
            "prose-strong:text-gray-900",
            "[&_a]:break-all [&_code]:break-all",
          ].join(" ")}
        >
          <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
            {formatProductDescription(data?.description || "")}
          </ReactMarkdown>
        </div>
      </div>

      {/* sizes removed */}

      {/* Add to Cart Button */}
      <div className="mt-10 flex items-center gap-x-3">
        <Button
          onClick={onAddToCart}
          className="flex items-center gap-x-2"
          disabled={!!data.sold}
        >
          {data.sold ? 'Sold' : 'Add To Cart'}
          {!data.sold && <ShoppingCart size={20} />}
        </Button>
      </div>
    </div>
  );
};

export default Info;
