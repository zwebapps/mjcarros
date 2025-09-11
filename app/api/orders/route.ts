import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { extractTokenFromHeader, verifyToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    let userEmail = request.headers.get('x-user-email');
    let userRole = request.headers.get('x-user-role');

    // If middleware didn't inject headers, verify JWT here
    if (!userEmail || !userRole) {
      const token = extractTokenFromHeader(request.headers.get('authorization'));
      const payload = token ? verifyToken(token) : null;
      if (payload) {
        userEmail = payload.email;
        userRole = payload.role;
      }
    }

    // Admin: return all orders (with customer name)
    if (userRole === 'ADMIN') {
      const orders = await db.order.findMany({
        include: { orderItems: { include: { product: true } } },
        orderBy: { createdAt: 'desc' },
      });
      const emails = Array.from(new Set(orders.map((o) => o.userEmail).filter(Boolean)));
      const users = await db.user.findMany({ where: { email: { in: emails as string[] } }, select: { email: true, name: true } });
      const emailToName = new Map(users.map((u) => [u.email, u.name]));
      const enriched = orders.map((o: any) => ({ ...o, customerName: emailToName.get(o.userEmail || '') || '' }));
      return NextResponse.json(enriched);
    }

    // Authenticated user: return own orders
    if (userEmail) {
      const orders = await db.order.findMany({
        where: { userEmail },
        include: { orderItems: { include: { product: true } } },
        orderBy: { createdAt: 'desc' },
      });
      // For customer view, returning as-is is fine; optionally attach their own name
      return NextResponse.json(orders);
    }

    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Error fetching orders" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderItems, phone, address, userEmail } = body;

    if (!orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
      return NextResponse.json(
        { error: "Order items are required" },
        { status: 400 }
      );
    }

    // Require phone and email
    const emailValid = typeof userEmail === 'string' && /.+@.+\..+/.test(userEmail);
    if (!phone || typeof phone !== 'string' || phone.trim().length < 5) {
      return NextResponse.json(
        { error: "Phone is required" },
        { status: 400 }
      );
    }
    if (!emailValid) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 }
      );
    }

    const newOrder = await db.order.create({
      data: {
        phone: phone.trim(),
        address: (address || "").trim(),
        userEmail: userEmail.trim(),
        orderItems: {
          create: orderItems.map((item: any) => ({
            productId: item.productId,
            productName: item.productName,
          })),
        },
      },
      include: {
        orderItems: { include: { product: true } },
      },
    });

    return NextResponse.json(newOrder);
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { error: "Error creating order" },
      { status: 500 }
    );
  }
}
