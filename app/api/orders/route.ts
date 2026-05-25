import { NextRequest, NextResponse } from "next/server";
import { generateOrderNumber } from "@/lib/order-number-generator";
import { extractTokenFromHeader, verifyToken } from "@/lib/auth";
import { backupOrderToS3, logOrderCreation } from "@/lib/order-backup";
import { db } from "@/lib/db";
import { prisma } from "@/lib/prisma";
import { legacyMongoFilter } from "@/lib/id-resolve";

export const runtime = "nodejs";

async function buildOrderItemsCreate(
  items: Array<{
    productId?: string;
    productName: string;
    quantity?: number;
    price?: number;
  }>
) {
  return Promise.all(
    items.map(async (item) => {
      let productId: string | undefined;
      if (item.productId) {
        const product = await prisma.product.findFirst({
          where: legacyMongoFilter(String(item.productId)),
        });
        productId = product?.id;
      }
      return {
        productId,
        productName: item.productName,
        quantity: item.quantity || 1,
        price: item.price || 0,
      };
    })
  );
}

export async function GET(request: NextRequest) {
  try {
    let userEmail = request.headers.get("x-user-email");
    let userRole = request.headers.get("x-user-role");

    if (!userEmail || !userRole) {
      const token = extractTokenFromHeader(request.headers.get("authorization"));
      const payload = token ? verifyToken(token) : null;
      if (payload) {
        userEmail = payload.email;
        userRole = payload.role;
      }
    }

    if (userRole === "ADMIN") {
      const orders = await db.order.findMany();
      return NextResponse.json(orders);
    }

    if (userEmail) {
      const orders = await db.order.findMany({ where: { userEmail } });
      return NextResponse.json(orders);
    }

    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json({ error: "Error fetching orders" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderItems, phone, address, userEmail } = body;

    if (!orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
      return NextResponse.json({ error: "Order items are required" }, { status: 400 });
    }

    const emailValid = typeof userEmail === "string" && /.+@.+\..+/.test(userEmail);
    if (!phone || typeof phone !== "string" || phone.trim().length < 5) {
      return NextResponse.json({ error: "Phone is required" }, { status: 400 });
    }
    if (!emailValid) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }

    const orderNumber = await generateOrderNumber();
    const itemsCreate = await buildOrderItemsCreate(orderItems);

    const newOrder = await db.order.create({
      data: {
        orderNumber,
        phone: phone.trim(),
        address: (address || "").trim(),
        userEmail: userEmail.trim(),
        isPaid: false,
        paymentMethod: "Stripe",
        orderItems: { create: itemsCreate },
      },
    });

    logOrderCreation(newOrder);
    await backupOrderToS3(newOrder);

    return NextResponse.json(newOrder);
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json({ error: "Error creating order" }, { status: 500 });
  }
}
