"use client";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import EditForm from "./edit-form";
import Spinner from "@/components/Spinner";
import toast from "react-hot-toast";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export type SizeProduct = {
  sizeId: string;
  id: string;
};

export type createData = {
  title: string;
  description: string;
  price: number;
  _id?: string;
  id: string;
  imageURLs: string[];
  category: string;
  featured: boolean;
  productSizes?: SizeProduct[];
  categoryId: string;
  discount?: number;
  modelName?: string;
  year?: number;
  stockQuantity?: number;
  color?: string;
  fuelType?: string;
  transmission?: string;
  mileage?: number;
  condition?: string;
};
const EditProduct = () => {
  const params = useParams();
  const router = useRouter();

  const { productId } = params;

  const { data, isLoading } = useQuery({
    queryKey: ["product"],
    queryFn: async () => {
      const { data } = await axios.get(`/api/product/edit/${productId}`);
      return data as createData;
    },
  });
  if (isLoading || !data) {
    return (
      <div>
        <Spinner />
      </div>
    );
  }

  if (!data) {
    return <div>Product not found</div>;
  }

  const handleFormSubmit = async (formData: FormData) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const res = await axios.put(`/api/product/edit/${productId}`, formData, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      toast.success("Product edit successfully");
      router.push("/admin/products");
    } catch (error) {
      toast.error("Something went wrong");
    }
  };

  return (
    <div className="flex flex-col gap-4 justify-center items-center max-md:justify-start">
      <div className="self-end pr-4">
        <Link href={`/product/${data._id || data.id}`} target="_blank">
          <Button variant="outline">View product</Button>
        </Link>
      </div>
      <EditForm onSubmit={handleFormSubmit} data={data} />
    </div>
  );
};

export default EditProduct;
