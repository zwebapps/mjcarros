"use client";

import Link from "next/link";
import { Star } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

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
      <div className="bg-white group cursor-pointer rounded-xl border border-gray-200 hover:shadow-xl transition-all duration-300 hover:border-gray-300 h-full flex flex-col overflow-hidden">
        {/* Edge-to-edge image */}
        <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
          <img
            src={product.imageURLs[0] || "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop"}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          
          {/* Category Badge */}
          <div className="absolute top-3 right-3 bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-medium shadow-sm">
            {product.category}
          </div>
          
          {/* Featured Badge */}
          {product.featured && (
            <div className="absolute top-3 left-3 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full font-medium shadow-sm">
              Featured
            </div>
          )}
          
          {/* Discount Badge */}
          {hasDiscount && (
            <div className="absolute bottom-3 left-3 bg-red-600 text-white text-xs px-2 py-1 rounded-full font-medium shadow-sm">
              -{product.discount}%
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="p-4 flex-grow flex flex-col">
          <h3 className="font-semibold text-lg text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
            {product.title}
          </h3>
          
          <div className="mt-auto">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                {hasDiscount ? (
                  <>
                    <div className="text-2xl font-bold text-red-600">
                      {formatCurrency(displayPrice, 'EUR')}
                    </div>
                    <div className="text-base text-gray-500 line-through">
                      {formatCurrency(product.price, 'EUR')}
                    </div>
                  </>
                ) : (
                  <div className="text-2xl font-bold text-gray-900">
                    {formatCurrency(displayPrice, 'EUR')}
                  </div>
                )}
              </div>
            </div>
            
            <div className="text-sm text-gray-500 font-medium">
              {product.category}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
