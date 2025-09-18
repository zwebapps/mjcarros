"use client";

import Gallery from "@/components/gallery/gallery";
import Info from "@/components/gallery/info";
import Container from "@/components/ui/container";
import ProductCard from "@/components/ui/product-card";
import { type Product } from "@/types";
import { useQueries } from "@tanstack/react-query";
import axios from "axios";
import { useParams } from "next/navigation";
import LoadingSkeleton from "./loading-skeleton";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

const ProductItem = () => {
  const params = useParams();
  const productId = params?.productId as string | undefined;

  const [productQuery, relatedQuery] = useQueries({
    queries: [
      {
        queryKey: ["single product", productId],
        queryFn: async () =>
          await axios.get(`/api/product/${productId}`).then((res) => res.data),
      },
      {
        queryKey: ["related products"],
        queryFn: async () => {
          const response = await axios.get("/api/product/");
          return response.data;
        },
      },
    ],
  });

  if (productQuery.isLoading || relatedQuery.isLoading) {
    return (
      <Container>
        <LoadingSkeleton />
      </Container>
    );
  }

  if (!productQuery.data || !relatedQuery.data) {
    return <Container>Something went wrong!</Container>;
  }

  const filteredData: Product[] = relatedQuery?.data?.filter(
    (item: Product) => item.category === productQuery?.data?.category && (productQuery.data._id || productQuery.data.id) !== (item._id || item.id)
  );

  return (
    <div className="bg-white">
      <Container>
        <div className="px-4 py-10 sm:px-6 lg:px-16">
          <Link href="/shop" className="flex items-center mb-5 gap-x-1">
            <ArrowLeft className="w-5 h-5" />
            <p className="text-md font-semibold">Back to shop</p>
          </Link>
          <div className="lg:grid lg:grid-cols-[500px_minmax(400px,_1fr)_100px] lg:items-start lg:gap-x-8">
            <Gallery images={productQuery.data?.imageURLs} />
            <div className="mt-10 px-4 sm:mt-16 sm:px-0 lg:mt-0">
              <Info data={productQuery?.data} />
            </div>
          </div>

          <hr className="my-10" />
          <div className="space-y-4">
           {
            filteredData.length > 0 && <h3 className="font-semibold text-3xl">Recommended</h3>
           }
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredData?.map((item: Product) => {
                return <ProductCard key={item._id || item.id} data={item} />;
              })}
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default ProductItem;
