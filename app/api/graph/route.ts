import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Check if user is admin (middleware sets these headers)
    const userRole = request.headers.get('x-user-role');
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get counts for dashboard
    const [totalProducts, totalCategories, totalOrders, totalUsers] = await Promise.all([
      prisma.product.count(),
      prisma.category.count(),
      prisma.order.count(),
      prisma.user.count(),
    ]);

    // Get recent orders
    const recentOrders = await prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
      },
    });

    // Get products by category
    const productsByCategory = await prisma.product.groupBy({
      by: ['category'],
      _count: {
        id: true,
      },
    });

    return NextResponse.json({
      counts: {
        products: totalProducts,
        categories: totalCategories,
        orders: totalOrders,
        users: totalUsers,
      },
      recentOrders,
      productsByCategory,
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json(
      { error: "Error fetching dashboard data" },
      { status: 500 }
    );
  }
}
