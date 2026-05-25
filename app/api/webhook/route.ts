import Stripe from "stripe";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { backupOrderToS3 } from "@/lib/order-backup";
import { sendMail } from "@/lib/mail";
import { generateOrderConfirmationEmail } from "@/lib/email-templates";
import { db } from "@/lib/db";
import { prisma } from "@/lib/prisma";
import { legacyMongoFilter } from "@/lib/id-resolve";
export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get("Stripe-Signature") as string;

  try {
    const parsed = JSON.parse(body);
    console.log("[STRIPE_WEBHOOK_RECEIVED]", {
      hasSignature: !!signature,
      eventId: parsed?.id,
      eventType: parsed?.type,
      object: parsed?.data?.object?.object,
      sessionId: parsed?.data?.object?.id,
      paymentIntent: parsed?.data?.object?.payment_intent,
      metadata: parsed?.data?.object?.metadata || null,
    });
  } catch {
    console.log("[STRIPE_WEBHOOK_RECEIVED_RAW]", {
      hasSignature: !!signature,
      bodyLength: body?.length || 0,
    });
  }

  let event: Stripe.Event;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2023-10-16" });

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new NextResponse(`Webhook Error: ${message}`, { status: 400 });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  if (event.type === "checkout.session.completed") {
    try {
      const orderId = session?.metadata?.orderId;
      if (!orderId) {
        console.error("Stripe webhook: No order ID in session metadata");
        return new NextResponse("No order ID", { status: 400 });
      }

      const existing = await prisma.order.findFirst({ where: legacyMongoFilter(orderId) });
      if (!existing) {
        console.error(`Order ${orderId} not found`);
        return new NextResponse("Order not found", { status: 404 });
      }

      const sessionPaymentIntentId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : (session.payment_intent as { id?: string } | null)?.id;
      let sessionChargeId: string | undefined;
      try {
        if (sessionPaymentIntentId) {
          const paymentIntent = await stripe.paymentIntents.retrieve(sessionPaymentIntentId, {
            expand: ["latest_charge"],
          });
          const latestCharge = paymentIntent.latest_charge as string | { id?: string } | null;
          if (typeof latestCharge === "string") {
            sessionChargeId = latestCharge;
          } else if (latestCharge?.id) {
            sessionChargeId = latestCharge.id;
          }
        }
      } catch (piErr) {
        console.warn("Failed to retrieve PaymentIntent for transaction id:", piErr);
      }

      await prisma.order.update({
        where: { id: existing.id },
        data: {
          isPaid: true,
          address: session?.customer_details?.address?.line1 || "",
          phone: session?.customer_details?.phone || "",
          userEmail:
            session?.metadata?.email || session?.customer_details?.email || existing.userEmail,
          paymentMethod: "Stripe",
          paymentIntentId: sessionPaymentIntentId || null,
          transactionId: sessionChargeId || sessionPaymentIntentId || null,
          checkoutSessionId: session?.id || null,
        },
      });

      const updatedOrder = await db.order.findUnique({ where: { id: existing.id } });
      if (!updatedOrder) {
        return new NextResponse("Order not found after update", { status: 404 });
      }

      try {
        const productIds: string[] = [];
        for (const it of updatedOrder.orderItems || []) {
          const row = it as {
            productId?: string;
            product?: { id?: string } | null;
          };
          if (row.product?.id) {
            productIds.push(row.product.id);
            continue;
          }
          if (!row.productId) continue;
          const product = await prisma.product.findFirst({
            where: legacyMongoFilter(String(row.productId)),
          });
          if (product) productIds.push(product.id);
        }
        const uniqueIds = [...new Set(productIds)];
        if (uniqueIds.length > 0) {
          await prisma.product.updateMany({
            where: { id: { in: uniqueIds } },
            data: { sold: true },
          });
        }
      } catch (soldErr) {
        console.warn("[STRIPE_SET_SOLD_FAIL]", soldErr);
      }

      await backupOrderToS3(updatedOrder);

      const notifUpdate = await prisma.order.updateMany({
        where: { id: existing.id, notificationSent: false },
        data: { notificationSent: true },
      });
      if (notifUpdate.count === 0) {
        console.log(`Order ${orderId} already notified. Skipping email.`);
        return new NextResponse(null, { status: 200 });
      }

      const { subject, html } = generateOrderConfirmationEmail(updatedOrder, "Stripe");
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const invoiceRes = await fetch(`${appUrl}/api/orders/${orderId}/invoice`, {
        headers: { Accept: "application/pdf" },
        cache: "no-store",
      });
      const attachments: { filename: string; content: Buffer; contentType: string }[] = [];
      if (invoiceRes.ok) {
        const pdfArrayBuffer = await invoiceRes.arrayBuffer();
        attachments.push({
          filename: `invoice-${orderId}.pdf`,
          content: Buffer.from(pdfArrayBuffer),
          contentType: "application/pdf",
        });
      }

      try {
        if (updatedOrder.userEmail?.trim()) {
          const logoBuffer = await fetch(`${appUrl}/logo.png`)
            .then((r) => r.arrayBuffer())
            .then((b) => Buffer.from(b));
          await sendMail(updatedOrder.userEmail, subject, html, [
            { filename: "logo.png", content: logoBuffer, cid: "mjcarros-logo" },
            ...attachments,
          ]);
        }
      } catch (emailError) {
        console.warn("Failed to send order confirmation email:", emailError);
      }
    } catch (e) {
      console.error("Stripe webhook error:", e);
      return new NextResponse("Webhook processing failed", { status: 500 });
    }
  }

  return new NextResponse(null, { status: 200 });
}
