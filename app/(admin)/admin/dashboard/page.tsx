"use client";

import React from "react";
import TitleHeader from "../../_components/title-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, Package, Users, TrendingUp, DollarSign, ShoppingCart } from "lucide-react";
import { useQueries } from "@tanstack/react-query";
import axios from "axios";
import { Overview } from "@/components/overview";

const DashboardPage = () => {
  const [orderQuery, productQuery, graphQuery] = useQueries({
    queries: [
      {
        queryKey: ["Sales count"],
        queryFn: async () => {
          try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
            const { data } = await axios.get("/api/orders", { headers: token ? { Authorization: `Bearer ${token}` } : undefined });
            return data;
          } catch (error) {
            console.error("Error fetching orders:", error);
            return [];
          }
        },
      },
      {
        queryKey: ["Stock products"],
        queryFn: async () => {
          try {
            const response = await axios.get("/api/product");
            return response.data;
          } catch (error) {
            console.error("Error fetching products:", error);
            return [];
          }
        },
      },
      {
        queryKey: ["graph data"],
        queryFn: async () => {
          try {
            const response = await axios.get("/api/graph");
            return response.data;
          } catch (error) {
            console.error("Error fetching graph data:", error);
            // Return mock data for now
            return [
              { name: "Jan", total: 1200 },
              { name: "Feb", total: 1800 },
              { name: "Mar", total: 1400 },
              { name: "Apr", total: 2200 },
              { name: "May", total: 1900 },
              { name: "Jun", total: 2400 },
            ];
          }
        },
      },
    ],
  });

  const totalSales = orderQuery?.data?.length || 0;
  const totalProducts = productQuery?.data?.length || 0;
  const totalRevenue = totalSales * 150; // Mock calculation
  const totalOrders = orderQuery?.data?.length || 0;

  return (
    <div className="p-4 mt-2 w-full max-w-none">
      <TitleHeader title="Dashboard" description="Overview of your store" />
      
      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pl-6 pb-3">
            <div className="text-2xl font-bold">+{totalSales}</div>
            <p className="text-xs text-muted-foreground">
              +20.1% from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Products In Stock</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pl-6 pb-3">
            <div className="text-2xl font-bold">{totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              +5 new products this week
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pl-6 pb-3">
            <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +12.5% from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pl-6 pb-3">
            <div className="text-2xl font-bold">{totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              {totalOrders > 0 ? `${totalOrders} pending` : "No pending orders"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sales Overview Graph */}
      <Card className="col-span-4 mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Sales Overview Graph
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Monitor sales growth and trends through interactive graphs
          </p>
        </CardHeader>
        <CardContent>
          <Overview data={graphQuery.data} />
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Product Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Add, Edit, and Delete Products efficiently from the admin panel
            </p>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• Manage product inventory</p>
              <p>• Update product details</p>
              <p>• Control product visibility</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Manage user accounts, roles, and permissions
            </p>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• View all users</p>
              <p>• Manage admin roles</p>
              <p>• Monitor user activity</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Order Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Track and manage customer orders and fulfillment
            </p>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• View order details</p>
              <p>• Update order status</p>
              <p>• Process payments</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
