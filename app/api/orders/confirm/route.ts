import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { sendMail } from "@/lib/mail";
import { generateOrderConfirmationEmail } from "@/lib/email-templates";
import { db } from "@/lib/db";
import { prisma } from "@/lib/prisma";
import { legacyMongoFilter } from "@/lib/id-resolve";

const stripeSecret = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecret
  ? new Stripe(stripeSecret, { apiVersion: "2023-10-16" })
  : (null as unknown as Stripe);

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    if (!stripeSecret || !stripe) {
      return new NextResponse("Stripe not configured", { status: 500 });
    }

    const { sessionId, orderId } = await req.json();
    if (!sessionId || !orderId) {
      return new NextResponse("sessionId and orderId are required", { status: 400 });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["payment_intent", "customer_details"],
    });

    if (!session) {
      return new NextResponse("Session not found", { status: 404 });
    }

    if (session.payment_status !== "paid") {
      return new NextResponse("Payment not completed", { status: 409 });
    }

    const metaOrderId = (session.metadata && session.metadata.orderId) || null;
    if (metaOrderId && metaOrderId !== orderId) {
      return new NextResponse("Order mismatch", { status: 409 });
    }

    const existing = await prisma.order.findFirst({ where: legacyMongoFilter(orderId) });
    if (!existing) {
      return new NextResponse("Order not found", { status: 404 });
    }

    const updateResult = await prisma.order.updateMany({
      where: { id: existing.id, notificationSent: false },
      data: {
        isPaid: true,
        phone: session.customer_details?.phone || "",
        address: session.customer_details?.address
          ? `${session.customer_details.address.line1 || ""} ${session.customer_details.address.line2 || ""} ${session.customer_details.address.city || ""} ${session.customer_details.address.state || ""} ${session.customer_details.address.postal_code || ""} ${session.customer_details.address.country || ""}`.trim()
          : "",
        userEmail:
          session.customer_details?.email ||
          (session.metadata && session.metadata.email) ||
          existing.userEmail,
        notificationSent: true,
      },
    });

    if (updateResult.count === 0) {
      const row = await db.order.findUnique({ where: { id: existing.id } });
      return new NextResponse(
        JSON.stringify({ ok: true, email: row?.userEmail, message: "Already notified" }),
        { status: 200 }
      );
    }

    const updated = await db.order.findUnique({ where: { id: existing.id } });
    if (!updated) {
      return new NextResponse("Order not found", { status: 404 });
    }

    const { subject, html } = generateOrderConfirmationEmail(updated, "Stripe");
    const attachments: { filename: string; content: Buffer; contentType: string }[] = [];
    try {
      const host =
        req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost:3000";
      const proto = req.headers.get("x-forwarded-proto") || "http";
      const origin = process.env.NEXT_PUBLIC_APP_URL || `${proto}://${host}`;
      const fHeaders: Record<string, string> = {
        Accept: "application/pdf",
        origin,
        "x-forwarded-host": host,
        "x-forwarded-proto": proto,
      };
      const invoiceRes = await fetch(`${origin}/api/orders/${orderId}/invoice`, {
        headers: fHeaders,
        cache: "no-store",
      });
      if (invoiceRes.ok) {
        const pdfArrayBuffer = await invoiceRes.arrayBuffer();
        attachments.push({
          filename: `invoice-${orderId}.pdf`,
          content: Buffer.from(pdfArrayBuffer),
          contentType: "application/pdf",
        });
      }
    } catch (e) {
      console.warn("Failed to fetch invoice PDF (confirm route):", e);
    }

    try {
      if (updated.userEmail?.trim()) {
        const logoBuffer = await fetch(
          `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/logo.png`
        )
          .then((r) => r.arrayBuffer())
          .then((b) => Buffer.from(b));
        await sendMail(updated.userEmail, subject, html, [
          { filename: "logo.png", content: logoBuffer, cid: "mjcarros-logo" },
          ...attachments,
        ]);
      }
    } catch (emailError) {
      console.warn("Failed to send payment confirmation email:", emailError);
    }

    return NextResponse.json({
      ok: true,
      orderId: updated._id,
      email: updated.userEmail,
    });
  } catch (err) {
    console.error("[ORDERS_CONFIRM_ERROR]", err);
    return new NextResponse("Internal error", { status: 500 });
  }
}
