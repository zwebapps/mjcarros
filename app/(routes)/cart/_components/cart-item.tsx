"use client";

import { useState } from "react";
import { Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { Product } from "@/types";
import Image from "next/image";

interface CartItemProps {
  data: Product;
}

const CartItem: React.FC<CartItemProps> = ({ data }) => {
  const cart = useCart();
  const [isLoading, setIsLoading] = useState(false);

  const onRemove = () => {
    cart.removeItem(data.id);
  };

  return (
    <div className="flex py-6 border-b">
      <div className="relative h-24 w-24 rounded-md overflow-hidden sm:h-48 sm:w-48">
        <Image
          fill
          src={data.imageURLs[0] || "/placeholder-image.jpg"}
          alt=""
          className="object-cover object-center"
        />
      </div>
      <div className="relative ml-4 flex flex-1 flex-col justify-between sm:ml-6">
        <div className="absolute z-10 right-0 top-0">
          <Button
            disabled={isLoading}
            size="sm"
            variant="outline"
            onClick={onRemove}
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex justify-between">
            <p className="text-lg font-semibold text-black">{data.title}</p>
          </div>
          <div className="flex text-sm">
            <p className="text-gray-500">{data.category}</p>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-black">
              ${data.finalPrice ? data.finalPrice.toLocaleString() : data.price.toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartItem;
