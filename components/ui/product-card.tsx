"use client";

import Link from "next/link";
import { Star } from "lucide-react";

interface Product {
  id: string;
  title: string;
  price: number;
  finalPrice?: number;
  discount?: number;
  imageURLs: string[];
  category: string;
  featured?: boolean;
}

interface ProductCardProps {
  data: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ data }) => {
  const product = data;
  const displayPrice = product.finalPrice || product.price;
  const hasDiscount = product.discount && product.discount > 0;
  
  return (
    <Link href={`/product/${product.id}`}>
      <div className="bg-white group cursor-pointer rounded-xl border p-4 space-y-4 hover:shadow-lg transition-shadow duration-300">
        <div className="aspect-square rounded-xl bg-gray-100 relative overflow-hidden">
          <img
            src={product.imageURLs[0] || "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400&h=300&fit=crop"}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-medium">
            {product.category}
          </div>
          {product.featured && (
            <div className="absolute top-2 left-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full font-medium">
              Featured
            </div>
          )}
          {hasDiscount && (
            <div className="absolute bottom-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded-full font-medium">
              -{product.discount}%
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          <h3 className="font-semibold text-lg text-gray-900 group-hover:text-blue-600 transition-colors">
            {product.title}
          </h3>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {hasDiscount ? (
                <>
                  <div className="text-2xl font-bold text-red-600">
                    ${displayPrice.toLocaleString()}
                  </div>
                  <div className="text-lg text-gray-500 line-through">
                    ${product.price.toLocaleString()}
                  </div>
                </>
              ) : (
                <div className="text-2xl font-bold text-gray-900">
                  ${displayPrice.toLocaleString()}
                </div>
              )}
            </div>
            <div className="text-sm text-gray-500">
              {product.category}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
