import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { items, email } = await req.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Items are required" }, { status: 400 });
    }

    const order = await db.order.create({
      data: {
        isPaid: true,
        userEmail: email || "",
        orderItems: {
          create: items.map((item: any) => ({
            productId: item.id,
            productName: item.title,
          })),
        },
      },
      include: { orderItems: true },
    });

    return NextResponse.json({ ok: true, orderId: order.id });
  } catch (error) {
    console.error("[PAYPAL_COMPLETE_ERROR]", error);
    return NextResponse.json({ error: "Failed to record order" }, { status: 500 });
  }
}
