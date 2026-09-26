"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { getAuthHeaders } from "@/hooks/use-auth-headers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DealerDashboardPage() {
  const { data: profile } = useQuery({
    queryKey: ["dealer-me"],
    queryFn: async () => {
      const { data } = await axios.get("/api/dealer/me", { headers: getAuthHeaders() });
      return data;
    },
  });

  const { data: imports } = useQuery({
    queryKey: ["dealer-imports"],
    queryFn: async () => {
      const { data } = await axios.get("/api/dealer/imports", { headers: getAuthHeaders() });
      return data as unknown[];
    },
  });

  const { data: products } = useQuery({
    queryKey: ["dealer-products"],
    queryFn: async () => {
      const { data } = await axios.get("/api/dealer/products", { headers: getAuthHeaders() });
      return data as unknown[];
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">
        {profile?.companyName ?? "Dealer portal"}
      </h1>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Assigned leads</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{imports?.length ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Listed vehicles</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{products?.length ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Verified</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{profile?.verified ? "Yes" : "Pending"}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
