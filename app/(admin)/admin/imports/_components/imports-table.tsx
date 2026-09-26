"use client";

import { useState } from "react";
import axios from "axios";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Spinner from "@/components/Spinner";
import TitleHeader from "@/app/(admin)/_components/title-header";
import { Button } from "@/components/ui/button";
import { getAuthHeaders } from "@/hooks/use-auth-headers";
import { IMPORT_STATUSES, importStatusLabel } from "@/lib/import-labels";

type ImportRow = {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  status: string;
  brand?: string;
  model?: string;
  assignedDealerId?: string;
  dealer?: { companyName: string };
  escrow?: { status: string; amount: number };
};

type DealerOption = { _id: string; companyName: string };

export default function ImportsTable() {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<ImportRow | null>(null);
  const [depositAmount, setDepositAmount] = useState("500");

  const { data: imports, isLoading } = useQuery({
    queryKey: ["imports"],
    queryFn: async () => {
      const { data } = await axios.get("/api/import-requests", {
        headers: getAuthHeaders(),
      });
      return data as ImportRow[];
    },
  });

  const { data: dealers } = useQuery({
    queryKey: ["dealers"],
    queryFn: async () => {
      const { data } = await axios.get("/api/dealers", { headers: getAuthHeaders() });
      return data as DealerOption[];
    },
  });

  const patchImport = async (id: string, body: Record<string, unknown>) => {
    await axios.patch(`/api/import-requests/${id}`, body, {
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
    });
    queryClient.invalidateQueries({ queryKey: ["imports"] });
  };

  const requestDeposit = async (id: string) => {
    const { data } = await axios.post(
      `/api/import-requests/${id}/checkout`,
      { amount: Number(depositAmount) },
      { headers: { ...getAuthHeaders(), "Content-Type": "application/json" } }
    );
    if (data.url) window.open(data.url, "_blank");
  };

  const escrowAction = async (importId: string, action: "release" | "refund") => {
    await axios.post(
      `/api/escrow/${importId}/release`,
      { action },
      { headers: { ...getAuthHeaders(), "Content-Type": "application/json" } }
    );
    queryClient.invalidateQueries({ queryKey: ["imports"] });
  };

  if (isLoading) return <Spinner />;

  return (
    <>
      <TitleHeader
        title="Import pipeline"
        description="Germany → Portugal customer leads, dealer assignment, escrow"
        count={imports?.length}
      />
      <div className="admin-card overflow-x-auto flux-shadow">
        <table className="admin-table">
          <thead className="bg-muted/30">
            <tr>
              <th className="admin-th">Customer</th>
              <th className="admin-th">Vehicle</th>
              <th className="admin-th">Status</th>
              <th className="admin-th">Dealer</th>
              <th className="admin-th">Escrow</th>
              <th className="admin-th text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {(imports ?? []).map((row) => (
              <tr key={row._id} className="transition-colors hover:bg-muted/30">
                <td className="admin-td">
                  <div className="font-medium text-foreground">{row.fullName}</div>
                  <div className="text-muted-foreground">{row.email}</div>
                  <div className="text-muted-foreground">{row.phone}</div>
                </td>
                <td className="admin-td">
                  {[row.brand, row.model].filter(Boolean).join(" ") || "—"}
                </td>
                <td className="admin-td">
                  <select
                    className="admin-select max-w-[180px]"
                    value={row.status}
                    onChange={(e) => patchImport(row._id, { status: e.target.value })}
                  >
                    {IMPORT_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {importStatusLabel(s)}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="admin-td">
                  <select
                    className="admin-select max-w-[220px]"
                    value={row.assignedDealerId ?? ""}
                    onChange={(e) =>
                      patchImport(row._id, {
                        assignedDealerId: e.target.value || null,
                      })
                    }
                  >
                    <option value="">Unassigned</option>
                    {(dealers ?? []).map((d) => (
                      <option key={d._id} value={d._id}>
                        {d.companyName}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="admin-td">
                  {row.escrow ? (
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                      €{row.escrow.amount} • {row.escrow.status}
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="admin-td text-right space-x-2">
                  <Button size="sm" variant="outline" onClick={() => setSelected(row)}>
                    Details
                  </Button>
                  {row.escrow?.status === "HELD" && (
                    <>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => escrowAction(row._id, "release")}
                      >
                        Release
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => escrowAction(row._id, "refund")}
                      >
                        Refund
                      </Button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="admin-card p-6 max-w-md w-full shadow-xl flux-shadow flux-glow">
            <h3 className="text-lg font-semibold mb-2">{selected.fullName}</h3>
            <p className="text-sm text-muted-foreground mb-4">{selected.email}</p>
            <label className="block text-sm mb-1">Deposit amount (EUR)</label>
            <input
              className="admin-input mb-4"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setSelected(null)}>
                Close
              </Button>
              <Button
                className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground flux-glow"
                onClick={() => requestDeposit(selected._id)}
              >
                Stripe deposit link
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
