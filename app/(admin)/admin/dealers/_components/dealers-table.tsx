"use client";

import { useState } from "react";
import axios from "axios";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Spinner from "@/components/Spinner";
import TitleHeader from "@/app/(admin)/_components/title-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAuthHeaders } from "@/hooks/use-auth-headers";
import toast from "react-hot-toast";

type DealerRow = {
  _id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone?: string;
  country: string;
  verified: boolean;
  importCount?: number;
  productCount?: number;
};

export default function DealersTable() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    companyName: "",
    contactName: "",
    email: "",
    phone: "",
    password: "",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["dealers"],
    queryFn: async () => {
      const { data } = await axios.get("/api/dealers", { headers: getAuthHeaders() });
      return data as DealerRow[];
    },
  });

  const createDealer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post("/api/dealers", form, {
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      });
      toast.success("Dealer created");
      setForm({ companyName: "", contactName: "", email: "", phone: "", password: "" });
      queryClient.invalidateQueries({ queryKey: ["dealers"] });
    } catch {
      toast.error("Failed to create dealer");
    }
  };

  if (isLoading) return <Spinner />;

  return (
    <>
      <TitleHeader title="Dealers" description="Partner dealerships (Germany)" count={data?.length} />
      <form onSubmit={createDealer} className="admin-card p-4 mb-6 grid gap-3 md:grid-cols-3 flux-shadow">
        <Input
          placeholder="Company name"
          value={form.companyName}
          onChange={(e) => setForm({ ...form, companyName: e.target.value })}
          required
        />
        <Input
          placeholder="Contact name"
          value={form.contactName}
          onChange={(e) => setForm({ ...form, contactName: e.target.value })}
          required
        />
        <Input
          placeholder="Email"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
        <Input
          placeholder="Phone"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />
        <Input
          placeholder="Portal password (optional)"
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <Button type="submit" className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground flux-glow">
          Add dealer
        </Button>
      </form>
      <div className="admin-card overflow-x-auto flux-shadow">
        <table className="admin-table">
          <thead className="bg-muted/30">
            <tr>
              <th className="admin-th">Company</th>
              <th className="admin-th">Contact</th>
              <th className="admin-th">Email</th>
              <th className="admin-th text-center">Leads</th>
              <th className="admin-th text-center">Cars</th>
              <th className="admin-th text-center">Verified</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {(data ?? []).map((d) => (
              <tr key={d._id} className="transition hover:bg-muted/30">
                <td className="admin-td font-medium text-foreground">{d.companyName}</td>
                <td className="admin-td">{d.contactName}</td>
                <td className="admin-td">{d.email}</td>
                <td className="admin-td text-center">{d.importCount ?? 0}</td>
                <td className="admin-td text-center">{d.productCount ?? 0}</td>
                <td className="admin-td text-center">
                  <span
                    className={[
                      "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
                      d.verified
                        ? "bg-emerald-500/10 text-emerald-700"
                        : "bg-muted text-muted-foreground",
                    ].join(" ")}
                  >
                    {d.verified ? "Verified" : "Pending"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
