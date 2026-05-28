"use client";

import { useMemo, useState } from "react";
import axios from "axios";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getAuthHeaders } from "@/hooks/use-auth-headers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";

type Category = { id: string; category: string; _id?: string };
type Product = { id: string; title: string; price: number; imageURLs?: string[]; _id?: string };

export default function DealerProductsPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    title: "",
    categoryId: "",
    price: "",
    modelName: "",
    year: "",
    mileage: "",
    fuelType: "",
    transmission: "",
    color: "",
    description: "",
  });

  const { data: categories } = useQuery({
    queryKey: ["dealer-categories"],
    queryFn: async () => {
      const { data } = await axios.get("/api/categories", { headers: getAuthHeaders() });
      return data as Category[];
    },
  });

  const { data: products, isLoading } = useQuery({
    queryKey: ["dealer-products"],
    queryFn: async () => {
      const { data } = await axios.get("/api/dealer/products", { headers: getAuthHeaders() });
      return data as Product[];
    },
  });

  const canSubmit = useMemo(() => {
    return !!form.title.trim() && !!form.categoryId && Number(form.price) >= 0;
  }, [form]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    try {
      await axios.post(
        "/api/dealer/products",
        {
          title: form.title,
          categoryId: form.categoryId,
          price: Number(form.price),
          modelName: form.modelName || undefined,
          year: form.year ? Number(form.year) : undefined,
          mileage: form.mileage ? Number(form.mileage) : undefined,
          fuelType: form.fuelType || undefined,
          transmission: form.transmission || undefined,
          color: form.color || undefined,
          description: form.description || undefined,
          imageURLs: [],
        },
        { headers: { ...getAuthHeaders(), "Content-Type": "application/json" } }
      );
      toast.success("Vehicle created");
      setForm({
        title: "",
        categoryId: "",
        price: "",
        modelName: "",
        year: "",
        mileage: "",
        fuelType: "",
        transmission: "",
        color: "",
        description: "",
      });
      queryClient.invalidateQueries({ queryKey: ["dealer-products"] });
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to create vehicle");
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">My vehicles</h1>

      <form onSubmit={submit} className="bg-white rounded-lg shadow p-4 grid gap-3 md:grid-cols-3 mb-6">
        <Input
          placeholder="Title *"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
        />
        <select
          className="border rounded-md px-3 py-2"
          value={form.categoryId}
          onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
          required
        >
          <option value="">Select category *</option>
          {(categories ?? []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.category}
            </option>
          ))}
        </select>
        <Input
          placeholder="Price *"
          type="number"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
          required
        />
        <Input
          placeholder="Model"
          value={form.modelName}
          onChange={(e) => setForm({ ...form, modelName: e.target.value })}
        />
        <Input
          placeholder="Year"
          type="number"
          value={form.year}
          onChange={(e) => setForm({ ...form, year: e.target.value })}
        />
        <Input
          placeholder="Mileage"
          type="number"
          value={form.mileage}
          onChange={(e) => setForm({ ...form, mileage: e.target.value })}
        />
        <Input
          placeholder="Fuel type"
          value={form.fuelType}
          onChange={(e) => setForm({ ...form, fuelType: e.target.value })}
        />
        <Input
          placeholder="Transmission"
          value={form.transmission}
          onChange={(e) => setForm({ ...form, transmission: e.target.value })}
        />
        <Input
          placeholder="Color"
          value={form.color}
          onChange={(e) => setForm({ ...form, color: e.target.value })}
        />
        <textarea
          className="border rounded-md px-3 py-2 min-h-[90px] md:col-span-3"
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <div className="md:col-span-3 flex justify-end">
          <Button type="submit" disabled={!canSubmit}>
            Add vehicle
          </Button>
        </div>
      </form>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left">Title</th>
              <th className="px-4 py-3 text-right">Price</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(products ?? []).map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{p.title}</td>
                <td className="px-4 py-3 text-right">€{Number(p.price).toLocaleString("de-DE")}</td>
              </tr>
            ))}
            {!isLoading && !(products ?? []).length && (
              <tr>
                <td className="px-4 py-6 text-center text-gray-600" colSpan={2}>
                  No vehicles yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

