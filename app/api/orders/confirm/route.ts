import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/db";

const stripeSecret = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecret ? new Stripe(stripeSecret, { apiVersion: "2023-10-16" }) : (null as unknown as Stripe);

export async function POST(req: NextRequest) {
  try {
    if (!stripeSecret || !stripe) {
      return new NextResponse("Stripe not configured", { status: 500 });
    }

    const { sessionId, orderId } = await req.json();
    if (!sessionId || !orderId) {
      return new NextResponse("sessionId and orderId are required", { status: 400 });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ["payment_intent", "customer_details"] });

    if (!session) {
      return new NextResponse("Session not found", { status: 404 });
    }

    if (session.payment_status !== "paid") {
      return new NextResponse("Payment not completed", { status: 409 });
    }

    // Optional: ensure the session belongs to the order
    const metaOrderId = (session.metadata && (session.metadata as any).orderId) || null;
    if (metaOrderId && metaOrderId !== orderId) {
      return new NextResponse("Order mismatch", { status: 409 });
    }

    // Update order as paid and store available customer details
    const updated = await db.order.update({
      where: { id: orderId },
      data: {
        isPaid: true,
        phone: session.customer_details?.phone || "",
        address: session.customer_details?.address ?
          `${session.customer_details.address.line1 || ""} ${session.customer_details.address.line2 || ""} ${session.customer_details.address.city || ""} ${session.customer_details.address.state || ""} ${session.customer_details.address.postal_code || ""} ${session.customer_details.address.country || ""}`.trim() : "",
        userEmail: (session.customer_details?.email || (session.metadata && (session.metadata as any).email) || ""),
      },
    });

    return NextResponse.json({ ok: true, orderId: updated.id });
  } catch (err) {
    console.error("[ORDERS_CONFIRM_ERROR]", err);
    return new NextResponse("Internal error", { status: 500 });
  }
}


