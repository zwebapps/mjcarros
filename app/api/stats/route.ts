import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";
import { isAdminRole } from "@/lib/roles";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth || !isAdminRole(auth.role)) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const [orders, products, imports, escrowsHeld, usersByRole] = await Promise.all([
    prisma.order.findMany({
      where: { isPaid: true },
      include: { orderItems: true },
    }),
    prisma.product.count(),
    prisma.importRequest.count(),
    prisma.escrow.aggregate({
      where: { status: "HELD" },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.user.groupBy({
      by: ["role"],
      _count: true,
    }),
  ]);

  const revenue = orders.reduce((sum, o) => {
    const orderTotal = o.orderItems.reduce(
      (t, i) => t + (i.price || 0) * (i.quantity || 1),
      0
    );
    return sum + orderTotal;
  }, 0);

  const monthlyMap = new Map<string, number>();
  for (const o of orders) {
    const key = o.createdAt.toLocaleString("en-US", { month: "short" });
    const total = o.orderItems.reduce(
      (t, i) => t + (i.price || 0) * (i.quantity || 1),
      0
    );
    monthlyMap.set(key, (monthlyMap.get(key) || 0) + total);
  }

  const graph = Array.from(monthlyMap.entries()).map(([name, total]) => ({
    name,
    total: Math.round(total),
  }));

  return NextResponse.json({
    totalRevenue: Math.round(revenue * 100) / 100,
    paidOrders: orders.length,
    totalProducts: products,
    importLeads: imports,
    escrowHeldAmount: escrowsHeld._sum.amount ?? 0,
    escrowHeldCount: escrowsHeld._count,
    usersByRole: usersByRole.map((u) => ({
      role: u.role,
      count: u._count,
    })),
    graph: graph.length ? graph : [
      { name: "Jan", total: 0 },
      { name: "Feb", total: 0 },
      { name: "Mar", total: 0 },
    ],
  });
}
