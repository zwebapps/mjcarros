import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { generateOrderNumber } from "@/lib/order-number-generator";
import { db } from "@/lib/db";
import { prisma } from "@/lib/prisma";
import { legacyMongoFilter } from "@/lib/id-resolve";
const stripeSecret = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecret
  ? new Stripe(stripeSecret, { apiVersion: "2023-10-16" })
  : (null as unknown as Stripe);

export async function POST(req: NextRequest) {
  try {
    if (!stripeSecret || !stripe) {
      return NextResponse.json({ error: "Stripe is not configured" }, { status: 500 });
    }

    const body = await req.json();
    const { items, email } = body as { items: Record<string, unknown>[]; email?: string };

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Items are required" }, { status: 400 });
    }

    const origin =
      process.env.STRIPE_REDIRECT_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      req.headers.get("origin") ||
      "http://localhost:3000";

    const orderNumber = await generateOrderNumber();

    const itemsCreate = await Promise.all(
      items.map(async (item) => {
        const rawId = String(item._id || item.id || "");
        const product = rawId
          ? await prisma.product.findFirst({ where: legacyMongoFilter(rawId) })
          : null;
        return {
          productId: product?.id,
          productName: String(item.title || "Item"),
          quantity: Number(item.quantity) || 1,
          price: Number(item.price) || 0,
        };
      })
    );

    const order = await db.order.create({
      data: {
        orderNumber,
        isPaid: false,
        userEmail: email || "",
        phone: "",
        address: "",
        orderItems: { create: itemsCreate },
      },
    });

    const orderApiId = order._id;

    const lineItems = items.map((item) => {
      const price = Math.round(Number(item.price) * 100);
      const image =
        Array.isArray(item.imageURLs) &&
        item.imageURLs[0] &&
        /^https?:\/\//.test(String(item.imageURLs[0]))
          ? [String(item.imageURLs[0])]
          : undefined;

      return {
        price_data: {
          currency: "eur",
          product_data: {
            name: String(item.title),
            ...(image ? { images: image } : {}),
          },
          unit_amount: price,
        },
        quantity: Number(item.quantity) || 1,
      } as Stripe.Checkout.SessionCreateParams.LineItem;
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${origin}/cart?success=1&orderId=${orderApiId}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cart?canceled=1`,
      metadata: { email: email || "", orderId: orderApiId },
    });

    try {
      const existing = await prisma.order.findFirst({ where: { id: order.id } });
      if (existing) {
        await prisma.order.update({
          where: { id: existing.id },
          data: { checkoutSessionId: session.id },
        });
      }
    } catch (e) {
      console.warn("[CHECKOUT_STORE_SESSION_ID_FAIL]", e);
    }

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.log("[CHECKOUT_ERROR]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
