import Stripe from "stripe";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get("Stripe-Signature") as string;

  let event: Stripe.Event;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2023-10-16" });

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error: any) {
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  if (event.type === "checkout.session.completed") {
    try {
      await db.order.update({
        where: { id: session?.metadata?.orderId || "" },
        data: {
          isPaid: true,
          address: session?.customer_details?.address?.line1 || "",
          phone: session?.customer_details?.phone || "",
          userEmail: session?.metadata?.email || "",
        },
      });
    } catch (e) {
      // ignore in dev
    }
  }

  return new NextResponse(null, { status: 200 });
}
