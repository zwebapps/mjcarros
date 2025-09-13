import Stripe from "stripe";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { backupOrderToS3, logOrderCreation } from "@/lib/order-backup";
import { sendMail } from "@/lib/mail";

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
      const orderId = session?.metadata?.orderId;
      if (!orderId) {
        console.error("❌ Stripe webhook: No order ID in session metadata");
        return new NextResponse("No order ID", { status: 400 });
      }

      console.log(`💳 Stripe payment completed for order: ${orderId}`);
      if (!db) {
        return new NextResponse("Database not found", { status: 500 });
      }
      // Update order with payment details
      const updatedOrder = await db.order.update({
        where: { id: orderId },
        data: {
          isPaid: true,
          address: session?.customer_details?.address?.line1 || "",
          phone: session?.customer_details?.phone || "",
          userEmail: session?.metadata?.email || session?.customer_details?.email || "",
        },
        include: {
          orderItems: { 
            include: { 
              product: {
                select: {
                  id: true,
                  title: true,
                  price: true,
                  modelName: true,
                  year: true,
                  color: true,
                  mileage: true,
                  fuelType: true,
                  imageURLs: true
                }
              }
            } 
          }
        },
      });

      // Log payment completion
      console.log(`✅ Order ${orderId} payment confirmed via Stripe`);
      console.log(`👤 Customer: ${updatedOrder.userEmail}`);
      console.log(`💰 Amount: $${session?.amount_total ? (session.amount_total / 100).toFixed(2) : 'N/A'}`);
      console.log(`💳 Payment Method: Stripe`);

      // Backup updated order to S3
      await backupOrderToS3(updatedOrder);

      // Send payment confirmation email
      const subject = `Payment Confirmed - Order ${orderId}`;
      const html = `
        <div>
          <h2>🎉 Payment Confirmed!</h2>
          <p>Your payment has been successfully processed.</p>
          <p><strong>Order ID:</strong> ${orderId}</p>
          <p><strong>Payment Method:</strong> Stripe</p>
          <p><strong>Amount:</strong> $${session?.amount_total ? (session.amount_total / 100).toFixed(2) : 'N/A'}</p>
          <p>We will process your order and contact you shortly.</p>
        </div>
      `;
      
      try {
        await sendMail(updatedOrder.userEmail, subject, html);
        console.log(`📧 Payment confirmation email sent to: ${updatedOrder.userEmail}`);
      } catch (emailError) {
        console.warn('Failed to send payment confirmation email:', emailError);
      }

    } catch (e) {
      console.error("❌ Stripe webhook error:", e);
      return new NextResponse("Webhook processing failed", { status: 500 });
    }
  }

  return new NextResponse(null, { status: 200 });
}
