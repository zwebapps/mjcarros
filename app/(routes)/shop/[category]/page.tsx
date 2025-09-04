import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProducts } from "@/lib/apiCalls";
import filteredData from "@/app/utils/filteredData";
import { Product } from "@/types";
import ProductCard from "@/components/ui/product-card";
import Container from "@/components/ui/container";

interface CategoryPageProps {
  params: {
    category: string;
  };
  searchParams: {
    [key: string]: string | string[] | undefined;
  };
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  return {
    title: `${params.category} | MJ Carros`,
    description: `Browse ${params.category} vehicles`,
  };
}

const CategoryPage = async ({
  params,
  searchParams,
}: CategoryPageProps) => {
  const data = await getProducts();

  if (!data) {
    notFound();
  }

  const filtered = data.filter(
    (product: Product) =>
      product.category.toLowerCase() === params.category.toLowerCase()
  );

  let sorted: Product[] | undefined;

  if (searchParams.sort) {
    sorted = filteredData(searchParams, filtered);
  }

  return (
    <Container>
      <div className="flex flex-col gap-y-8 mt-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {(sorted || filtered)?.map((product: Product) => (
            <ProductCard key={product.id} data={product} />
          ))}
        </div>
      </div>
    </Container>
  );
};

export default CategoryPage;
