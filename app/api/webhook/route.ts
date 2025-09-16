import Stripe from "stripe";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ObjectId } from "mongodb";
import { backupOrderToS3, logOrderCreation } from "@/lib/order-backup";
import { sendMail } from "@/lib/mail";
import { generateOrderConfirmationEmail } from "@/lib/email-templates";
import { generatePDFVoucher } from "@/lib/pdf-voucher-generator";
import { uploadOrderVoucherToS3 } from "@/lib/voucher-s3";

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
        where: { _id: new ObjectId(orderId ) },
        data: {
          isPaid: true,
          address: session?.customer_details?.address?.line1 || "",
          phone: session?.customer_details?.phone || "",
          userEmail: session?.metadata?.email || session?.customer_details?.email || "",
        },
        include: {
          orderItems: { 
            include: { 
              product: true
            } 
          }
        },
      });

      // Log payment completion
      console.log(`✅ Order ${orderId} payment confirmed via Stripe`);
      console.log(`👤 Customer: ${(updatedOrder as any).userEmail}`);
      console.log(`💰 Amount: $${session?.amount_total ? (session.amount_total / 100).toFixed(2) : 'N/A'}`);
      console.log(`💳 Payment Method: Stripe`);

      // Backup updated order to S3
      await backupOrderToS3(updatedOrder);

      // Generate professional email and PDF voucher
      const { subject, html } = generateOrderConfirmationEmail(updatedOrder as any, 'Stripe');
      const pdfVoucher = await generatePDFVoucher(updatedOrder as any);
      
      // Upload voucher to S3
      const voucherUrl = await uploadOrderVoucherToS3(updatedOrder as any);
      
      // Create PDF voucher attachment
      const attachments = [
        {
          filename: `voucher-${(updatedOrder as any).id || orderId}.pdf`,
          content: pdfVoucher,
          contentType: 'application/pdf'
        }
      ];
      
      try {
        if ((updatedOrder as any).userEmail && (updatedOrder as any).userEmail.trim()) {
          await sendMail((updatedOrder as any).userEmail, subject, html, attachments);
          console.log(`📧 Professional order confirmation email with PDF voucher sent to: ${(updatedOrder as any).userEmail}`);
          if (voucherUrl) {
            console.log(`☁️ Voucher also available at: ${voucherUrl}`);
          }
        } else {
          console.log('⚠️ No email address provided - skipping email notification');
          console.log(`☁️ Voucher available at: ${voucherUrl}`);
        }
      } catch (emailError) {
        console.warn('Failed to send order confirmation email:', emailError);
      }

    } catch (e) {
      console.error("❌ Stripe webhook error:", e);
      return new NextResponse("Webhook processing failed", { status: 500 });
    }
  }

  return new NextResponse(null, { status: 200 });
}
