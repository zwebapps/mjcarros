"use client";

import { useEffect, useState } from "react";
import Gallery from "@/components/gallery/gallery";
import Info from "@/components/gallery/info";
import Container from "@/components/ui/container";
import ProductCard from "@/components/ui/product-card";
import { Product } from "@/types";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import Footer from "@/components/footer";
import Spinner from "@/components/Spinner";

interface ProductDetailProps {
  productId: string;
}

const ProductDetail: React.FC<ProductDetailProps> = ({ productId }) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        console.log('Fetching product:', productId);
        const response = await fetch(`/api/product/${productId}`);
        console.log('Response status:', response.status);
        
        if (!response.ok) {
          throw new Error('Failed to fetch product');
        }
        
        const data = await response.json();
        console.log('API response:', data);
        
        // Transform the database product to match the Product interface
        const transformedProduct: Product = {
          id: data.product.id,
          title: data.product.title,
          description: data.product.description,
          price: data.product.price,
          finalPrice: data.product.finalPrice || undefined,
          discount: data.product.discount || undefined,
          featured: data.product.featured,
          imageURLs: data.product.imageURLs,
          category: data.product.category,
          categoryId: data.product.categoryId,
          createdAt: data.product.createdAt,
          updatedAt: data.product.updatedAt,
        };

        // Transform related products
        const transformedRelatedProducts: Product[] = data.relatedProducts.map((dbProduct: any) => ({
          id: dbProduct.id,
          title: dbProduct.title,
          description: dbProduct.description,
          price: dbProduct.price,
          finalPrice: dbProduct.finalPrice || undefined,
          discount: dbProduct.discount || undefined,
          featured: dbProduct.featured,
          imageURLs: dbProduct.imageURLs,
          category: dbProduct.category,
          categoryId: dbProduct.categoryId,
          createdAt: dbProduct.createdAt,
          updatedAt: dbProduct.updatedAt,
        }));

        console.log('Transformed product:', transformedProduct);
        console.log('Transformed related products:', transformedRelatedProducts);

        setProduct(transformedProduct);
        setRelatedProducts(transformedRelatedProducts);
      } catch (err) {
        console.error('Error fetching product:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  console.log('Component state:', { isLoading, error, product, relatedProducts });

  if (isLoading) {
    console.log('Rendering loading state');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (error || !product) {
    console.log('Rendering error state:', { error, product });
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg mb-4">
            {error || "Product not found"}
          </p>
          <Link 
            href="/shop" 
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Back to shop
          </Link>
        </div>
      </div>
    );
  }

  console.log('Rendering product:', product);

  return (
    <div>
      <div className="bg-white">
        <Container>
          <div className="px-4 py-10 sm:px-6 lg:px-16">
            <Link href="/shop" className="flex items-center mb-5 gap-x-1">
              <ArrowLeft className="w-5 h-5" />
              <p className="text-md font-semibold">Back to shop</p>
            </Link>
            
            <div className="lg:grid lg:grid-cols-[500px_minmax(400px,_1fr)_100px] lg:items-start lg:gap-x-8">
              <Gallery images={product.imageURLs} />
              <div className="mt-10 px-4 sm:mt-16 sm:px-0 lg:mt-0">
                <Info
                  data={product}
                  categories={[]}
                  availableSizes={[]}
                />
              </div>
            </div>

            {relatedProducts.length > 0 && (
              <>
                <hr className="my-10" />
                <div className="space-y-4">
                  <h3 className="font-semibold text-3xl">Recommended</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {relatedProducts.map((item: Product) => (
                      <ProductCard key={item.id} data={item} />
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </Container>
      </div>
      <Footer />
    </div>
  );
};

export default ProductDetail;
