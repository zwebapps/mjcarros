import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/db";

const stripeSecret = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecret ? new Stripe(stripeSecret, { apiVersion: "2023-10-16" }) : (null as unknown as Stripe);

export async function POST(req: NextRequest) {
  try {
    if (!stripeSecret || !stripe) {
      return new NextResponse("Stripe is not configured", { status: 500 });
    }

    const body = await req.json();
    const { items, email } = body as { items: any[]; email?: string };

    if (!items || items.length === 0) {
      return new NextResponse("Items are required", { status: 400 });
    }

    const origin = process.env.NEXT_PUBLIC_APP_URL || req.headers.get("origin") || "http://localhost:3000";

    // Create a pending order
    const order = await db.order.create({
      data: {
        isPaid: false,
        userEmail: email || "",
        orderItems: {
          create: items.map((item: any) => ({
            productId: item.id,
            productName: item.title,
          })),
        },
      },
    });

    const lineItems = items.map((item: any) => {
      const price = Math.round(Number(item.price) * 100);
      const image = Array.isArray(item.imageURLs) && item.imageURLs[0] && /^https?:\/\//.test(item.imageURLs[0])
        ? [item.imageURLs[0]]
        : undefined;

      return {
        price_data: {
          currency: "eur",
          product_data: {
            name: item.title,
            ...(image ? { images: image } : {}),
          },
          unit_amount: price,
        },
        quantity: item.quantity || 1,
      } as Stripe.Checkout.SessionCreateParams.LineItem;
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      // Include Stripe's {CHECKOUT_SESSION_ID} token so we can verify server-side without webhooks
      success_url: `${origin}/cart?success=1&orderId=${order.id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cart?canceled=1`,
      metadata: { email: email || "", orderId: order.id },
    });

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.log("[CHECKOUT_ERROR]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
