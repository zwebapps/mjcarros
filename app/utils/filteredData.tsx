import { Product } from "@/types";

const filteredData = (params: any, data: Product[]) => {
  const getPriceForSorting = (product: Product) => {
    return product.finalPrice && product.finalPrice > 0
      ? product.finalPrice
      : product.price;
  };

  if (params.sort === "price-low-to-high") {
    data.sort(
      (a: any, b: any) => +getPriceForSorting(a) - +getPriceForSorting(b)
    );
  } else if (params.sort === "price-high-to-low") {
    data.sort(
      (a: any, b: any) => +getPriceForSorting(b) - +getPriceForSorting(a)
    );
  } else if (params.sort === "latest-arrivals") {
    data.sort(
      (a: any, b: any) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  let result = data;

  if (params.price) {
    result = result.filter((product: Product) => {
      if (product.finalPrice && product.finalPrice > 0) {
        return +product.finalPrice <= +params.price;
      }
      return +product.price <= +params.price;
    });
  }

  if (params.q) {
    const q = Array.isArray(params.q)
      ? params.q.join(" ").toLowerCase().trim()
      : String(params.q || "").toLowerCase().trim();
    result = result.filter((product: Product) => {
      const haystack = `${product.title} ${product.description || ""} ${product.category || ""}`.toLowerCase();
      return haystack.includes(q);
    });
  }

  return result;
};

export default filteredData;
