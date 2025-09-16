import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { MongoClient } from "mongodb";
import { ObjectId } from "mongodb";
import { sendMail } from "@/lib/mail";
import { generateOrderConfirmationEmail } from "@/lib/email-templates";
import { generatePDFVoucher } from "@/lib/pdf-voucher-generator";
import { uploadOrderVoucherToS3 } from "@/lib/voucher-s3";

const stripeSecret = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecret ? new Stripe(stripeSecret, { apiVersion: "2023-10-16" }) : (null as unknown as Stripe);
const MONGODB_URI = process.env.DATABASE_URL || 'mongodb://mjcarros:786Password@mongodb:27017/mjcarros?authSource=mjcarros';

export async function POST(req: NextRequest) {
  let client;
  
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

    client = new MongoClient(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    await client.connect();
    const db = client.db('mjcarros');
    const ordersCollection = db.collection('orders');
    const productsCollection = db.collection('products');

    // Update order as paid and store available customer details
    const updateData = {
      isPaid: true,
      phone: session.customer_details?.phone || "",
      address: session.customer_details?.address ?
        `${session.customer_details.address.line1 || ""} ${session.customer_details.address.line2 || ""} ${session.customer_details.address.city || ""} ${session.customer_details.address.state || ""} ${session.customer_details.address.postal_code || ""} ${session.customer_details.address.country || ""}`.trim() : "",
      userEmail: (session.customer_details?.email || (session.metadata && (session.metadata as any).email) || ""),
      updatedAt: new Date(),
    };

    await ordersCollection.updateOne(
      { _id: new ObjectId(orderId) },
      { $set: updateData }
    );

    // Fetch the updated order with all details
    const updated = await ordersCollection.findOne({ _id: new ObjectId(orderId) });

    if (!updated) {
      return new NextResponse("Order not found", { status: 404 });
    }

    // Fetch products for order items
    const orderItemsWithProducts = await Promise.all(
      (updated.orderItems || []).map(async (item: any) => {
        const product = await productsCollection.findOne({ _id: new ObjectId(item.productId) });
        return {
          ...item,
          product: product
        };
      })
    );

    // Add products to order
    const updatedWithProducts = {
      ...updated,
      orderItems: orderItemsWithProducts,
      userEmail: updated.userEmail || ""
    };

    // Generate professional email and PDF voucher
    const { subject, html } = generateOrderConfirmationEmail(updatedWithProducts as any, 'Stripe');
    const pdfVoucher = await generatePDFVoucher(updatedWithProducts as any);
    
    // Upload voucher to S3
    const voucherUrl = await uploadOrderVoucherToS3(updatedWithProducts as any);
    
    // Create PDF voucher attachment
    const attachments = [
      {
        filename: `voucher-${updatedWithProducts._id || updatedWithProducts._id}.pdf`,
        content: pdfVoucher,
        contentType: 'application/pdf'
      }
    ];
    
    try {
      if (updatedWithProducts.userEmail && updatedWithProducts.userEmail.trim()) {
        await sendMail(updatedWithProducts.userEmail, subject, html, attachments);
        console.log(`📧 Professional order confirmation email with PDF voucher sent to: ${updatedWithProducts.userEmail}`);
        if (voucherUrl) {
          console.log(`☁️ Voucher also available at: ${voucherUrl}`);
        }
      } else {
        console.log('⚠️ No email address provided - skipping email notification');
        console.log(`☁️ Voucher available at: ${voucherUrl}`);
      }
    } catch (emailError) {
      console.warn('Failed to send payment confirmation email:', emailError);
    }

    return NextResponse.json({ 
      ok: true, 
      orderId: updatedWithProducts._id || updatedWithProducts._id, 
      email: updatedWithProducts.userEmail 
    });
  } catch (err) {
    console.error("[ORDERS_CONFIRM_ERROR]", err);
    return new NextResponse("Internal error", { status: 500 });
  } finally {
    if (client) {
      await client.close();
    }
  }
}


