"use client";

import axios from "axios";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getAuthHeaders } from "@/hooks/use-auth-headers";
import { IMPORT_STATUSES, importStatusLabel } from "@/lib/import-labels";
import { Button } from "@/components/ui/button";

type ImportRow = {
  _id: string;
  fullName: string;
  email: string;
  status: string;
  brand?: string;
  model?: string;
};

export default function DealerImportsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["dealer-imports"],
    queryFn: async () => {
      const { data } = await axios.get("/api/dealer/imports", { headers: getAuthHeaders() });
      return data as ImportRow[];
    },
  });

  const updateStatus = async (id: string, status: string) => {
    await axios.patch(
      `/api/import-requests/${id}`,
      { status },
      { headers: { ...getAuthHeaders(), "Content-Type": "application/json" } }
    );
    queryClient.invalidateQueries({ queryKey: ["dealer-imports"] });
  };

  if (isLoading) return <p>Loading…</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">My import leads</h1>
      <div className="space-y-4">
        {(data ?? []).map((row) => (
          <div key={row._id} className="bg-white rounded-lg shadow p-4 flex flex-wrap gap-4 justify-between">
            <div>
              <p className="font-semibold">{row.fullName}</p>
              <p className="text-sm text-gray-600">{row.email}</p>
              <p className="text-sm">
                {[row.brand, row.model].filter(Boolean).join(" ") || "Vehicle TBD"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select
                className="border rounded px-2 py-1"
                value={row.status}
                onChange={(e) => updateStatus(row._id, e.target.value)}
              >
                {IMPORT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {importStatusLabel(s)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ))}
        {!data?.length && (
          <p className="text-gray-600">No leads assigned yet. Contact MJ Carros admin.</p>
        )}
      </div>
    </div>
  );
}
