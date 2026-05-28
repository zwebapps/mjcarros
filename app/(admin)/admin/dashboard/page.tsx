"use client";

import React from "react";
import TitleHeader from "../../_components/title-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowUpRight,
  Building2,
  CreditCard,
  Globe,
  Package,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useQueries } from "@tanstack/react-query";
import axios from "axios";
import { Overview } from "@/components/overview";
import { useNotifications } from "@/hooks/use-notifications";

const DashboardPage = () => {
  const headers = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const [statsQuery, orderQuery, productQuery] = useQueries({
    queries: [
      {
        queryKey: ["admin-stats"],
        queryFn: async () => {
          const { data } = await axios.get("/api/stats", { headers: headers() });
          return data as {
            totalRevenue: number;
            paidOrders: number;
            totalProducts: number;
            importLeads: number;
            escrowHeldAmount: number;
            escrowHeldCount: number;
            graph: { name: string; total: number }[];
          };
        },
      },
      {
        queryKey: ["Sales count"],
        queryFn: async () => {
          const { data } = await axios.get("/api/orders", { headers: headers() });
          return data;
        },
      },
      {
        queryKey: ["Stock products"],
        queryFn: async () => {
          const response = await axios.get("/api/product");
          return response.data;
        },
      },
    ],
  });

  const stats = statsQuery.data;
  const paidOrders = stats?.paidOrders ?? orderQuery?.data?.length ?? 0;
  const totalProducts = stats?.totalProducts ?? productQuery?.data?.length ?? 0;
  const totalRevenue = stats?.totalRevenue ?? 0;
  const graphData = stats?.graph ?? [];
  const importLeads = stats?.importLeads ?? 0;
  const escrowHeld = stats?.escrowHeldAmount ?? 0;
  const escrowHeldCount = stats?.escrowHeldCount ?? 0;
  const { data: notifications } = useNotifications(true);
  const recent = (notifications ?? []).slice(0, 6);

  return (
    <div className="w-full max-w-none space-y-6">
      <TitleHeader title="Dashboard" description="Performance, imports, and escrow at a glance" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Card className="admin-card flux-shadow flux-glow">
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Revenue</CardTitle>
            <div className="rounded-xl border border-primary/15 bg-primary/10 p-2 text-primary">
              <Wallet className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              €{totalRevenue.toLocaleString("de-DE")}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Paid orders only (computed from items)</p>
          </CardContent>
        </Card>

        <Card className="admin-card flux-shadow flux-glow">
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Paid orders</CardTitle>
            <div className="rounded-xl border border-primary/15 bg-primary/10 p-2 text-primary">
              <CreditCard className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{paidOrders}</div>
            <p className="mt-1 text-xs text-muted-foreground">Stripe + PayPal confirmations</p>
          </CardContent>
        </Card>

        <Card className="admin-card flux-shadow flux-glow">
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Inventory</CardTitle>
            <div className="rounded-xl border border-primary/15 bg-primary/10 p-2 text-primary">
              <Package className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalProducts}</div>
            <p className="mt-1 text-xs text-muted-foreground">Vehicles in catalog</p>
          </CardContent>
        </Card>

        <Card className="admin-card flux-shadow flux-glow">
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Import leads</CardTitle>
            <div className="rounded-xl border border-primary/15 bg-primary/10 p-2 text-primary">
              <Globe className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{importLeads}</div>
            <p className="mt-1 text-xs text-muted-foreground">Germany → Portugal pipeline</p>
          </CardContent>
        </Card>

        <Card className="admin-card flux-shadow flux-glow">
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Escrow held</CardTitle>
            <div className="rounded-xl border border-primary/15 bg-primary/10 p-2 text-primary">
              <Building2 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              €{escrowHeld.toLocaleString("de-DE")}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{escrowHeldCount} deposits held</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 admin-card flux-shadow">
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Revenue overview
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">Monthly revenue from paid orders</p>
            </div>
            <div className="text-xs text-muted-foreground">Last 12 months</div>
          </CardHeader>
          <CardContent>
            <Overview data={graphData} />
          </CardContent>
        </Card>

        <Card className="admin-card flux-shadow">
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">Latest notifications and events</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {recent.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                No activity yet.
              </div>
            ) : (
              recent.map((n) => (
                <div
                  key={n.id}
                  className="flex items-start gap-3 rounded-xl border border-border/70 bg-background p-3 transition hover:bg-muted/40 flux-glow"
                >
                  <div className="mt-0.5 h-2 w-2 rounded-full bg-primary/80" />
                  <div className="min-w-0">
                    <p className="text-sm text-foreground line-clamp-2">{n.message}</p>
                    <p className="text-xs text-muted-foreground">{n.type}</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <a
          href="/admin/imports"
          className="group admin-card p-4 flux-shadow transition hover:-translate-y-0.5 hover:shadow-md flux-glow"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm font-semibold text-foreground">Manage import pipeline</div>
              <div className="mt-1 text-sm text-muted-foreground">Assign dealers and track progress</div>
            </div>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground transition group-hover:text-primary" />
          </div>
        </a>

        <a
          href="/admin/dealers"
          className="group admin-card p-4 flux-shadow transition hover:-translate-y-0.5 hover:shadow-md flux-glow"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm font-semibold text-foreground">Dealers</div>
              <div className="mt-1 text-sm text-muted-foreground">Partners and verification</div>
            </div>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground transition group-hover:text-primary" />
          </div>
        </a>

        <a
          href="/admin/products"
          className="group admin-card p-4 flux-shadow transition hover:-translate-y-0.5 hover:shadow-md flux-glow"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm font-semibold text-foreground">Vehicles</div>
              <div className="mt-1 text-sm text-muted-foreground">Catalog and inventory</div>
            </div>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground transition group-hover:text-primary" />
          </div>
        </a>

        <a
          href="/admin/payments"
          className="group admin-card p-4 flux-shadow transition hover:-translate-y-0.5 hover:shadow-md flux-glow"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm font-semibold text-foreground">Payments & escrow</div>
              <div className="mt-1 text-sm text-muted-foreground">Deposits and releases</div>
            </div>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground transition group-hover:text-primary" />
          </div>
        </a>
      </div>
    </div>
  );
};

export default DashboardPage;
