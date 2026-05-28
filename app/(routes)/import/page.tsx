"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";
import { getAuthHeaders } from "@/hooks/use-auth-headers";

export default function ImportRequestPage() {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    brand: "",
    model: "",
    budgetRange: "",
    totalBudget: "",
    notes: "",
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/import-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ ...form, germanyOnly: true, country: "Portugal" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      toast.success("Request submitted! We will contact you soon.");
      setForm({
        fullName: "",
        phone: "",
        email: "",
        brand: "",
        model: "",
        budgetRange: "",
        totalBudget: "",
        notes: "",
      });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-canvas">
      <div className="mx-auto max-w-2xl px-4 py-16">
        <h1 className="text-3xl font-bold mb-2">Import your car from Germany</h1>
        <p className="text-muted-foreground mb-8">
          Tell us what you need. Our team and partner dealers will search, inspect, and
          deliver to Portugal with transparent pricing.
        </p>
        <form onSubmit={submit} className="space-y-4 bg-card border rounded-xl p-6 shadow-card">
          <Input
            placeholder="Full name *"
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            required
          />
          <Input
            placeholder="Email *"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <Input
            placeholder="Phone *"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              placeholder="Brand"
              value={form.brand}
              onChange={(e) => setForm({ ...form, brand: e.target.value })}
            />
            <Input
              placeholder="Model"
              value={form.model}
              onChange={(e) => setForm({ ...form, model: e.target.value })}
            />
          </div>
          <Input
            placeholder="Budget range"
            value={form.budgetRange}
            onChange={(e) => setForm({ ...form, budgetRange: e.target.value })}
          />
          <Input
            placeholder="Total budget"
            value={form.totalBudget}
            onChange={(e) => setForm({ ...form, totalBudget: e.target.value })}
          />
          <textarea
            className="w-full border rounded-md px-3 py-2 min-h-[100px]"
            placeholder="Notes (must-haves, timeline…)"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Sending…" : "Submit import request"}
          </Button>
        </form>
      </div>
    </div>
  );
}
