"use client";
import { formatCurrency } from "@/lib/utils";

import { ShoppingCart } from "lucide-react";

import { Category, Product } from "@/types";
import { Button } from "../ui/button";
import useCart from "@/hooks/use-cart";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface InfoProps {
  data: Product;
}

const Info: React.FC<InfoProps> = ({ data }) => {
  const cart = useCart();

  const onAddToCart = () => {
    cart.addItem(data);
  };

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
                {formatCurrency(Number(data?.price), 'EUR')}
              </span>
              <div className="bg-red-600 text-sm text-white p-1 px-2 font-semibold rounded-sm">
                -{data?.discount}%
              </div>
            </div>
            <p className="text-2xl text-gray-900 font-semibold mt-1">
              {formatCurrency(Number(data.finalPrice), 'EUR')}
            </p>
          </div>
        ) : (
          <p className="text-2xl text-gray-900 font-semibold">
            {formatCurrency(Number(data?.price), 'EUR')}
          </p>
        )}
      </div>

      {/* Rich Description */}
      <div className="mt-6 prose max-w-none prose-headings:mt-4 prose-th:text-gray-900 prose-td:text-gray-700">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{data?.description || ''}</ReactMarkdown>
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
