import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { items, email } = body;

    if (!items || items.length === 0) {
      return new NextResponse("Items are required", { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: items.map((item: any) => ({
        price_data: {
          currency: "usd",
          product_data: {
            name: item.title,
            images: [item.imageURLs[0] || "/placeholder-image.jpg"],
          },
          unit_amount: item.price * 100,
        },
        quantity: item.quantity,
      })),
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/cart?success=1`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/cart?canceled=1`,
      metadata: {
        email,
      },
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    console.log("[CHECKOUT_ERROR]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
