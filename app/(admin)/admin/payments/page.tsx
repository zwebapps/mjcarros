"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import TitleHeader from "@/app/(admin)/_components/title-header";
import Spinner from "@/components/Spinner";
import { getAuthHeaders } from "@/hooks/use-auth-headers";

export default function AdminPaymentsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["payments"],
    queryFn: async () => {
      const { data } = await axios.get("/api/payments", { headers: getAuthHeaders() });
      return data as {
        payments: Array<{ type: string; amount: number; status: string; createdAt: string }>;
        escrows: Array<{ status: string; amount: number; importRequest: { fullName: string } }>;
      };
    },
  });

  if (isLoading) return <Spinner />;

  return (
    <div className="p-4 mt-2 w-full max-w-none">
      <TitleHeader title="Payments & escrow" description="Order payments and import deposits" />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-semibold mb-3">Escrow accounts</h3>
          <ul className="space-y-2 text-sm">
            {(data?.escrows ?? []).map((e, i) => (
              <li key={i} className="flex justify-between border-b pb-2">
                <span>{e.importRequest?.fullName}</span>
                <span>
                  €{e.amount} — {e.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-semibold mb-3">Payment history</h3>
          <ul className="space-y-2 text-sm">
            {(data?.payments ?? []).map((p, i) => (
              <li key={i} className="flex justify-between border-b pb-2">
                <span>{p.type}</span>
                <span>
                  €{p.amount} — {p.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
