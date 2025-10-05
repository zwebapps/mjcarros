import Stripe from "stripe";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { MongoClient, ObjectId } from "mongodb";
import { backupOrderToS3, logOrderCreation } from "@/lib/order-backup";
import { sendMail } from "@/lib/mail";
import { generateOrderConfirmationEmail } from "@/lib/email-templates";
import { getMongoDbUri } from "@/lib/mongodb-connection";

const MONGODB_URI = getMongoDbUri();

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
    let client;
    
    try {
      const orderId = session?.metadata?.orderId;
      if (!orderId) {
        console.error("❌ Stripe webhook: No order ID in session metadata");
        return new NextResponse("No order ID", { status: 400 });
      }

      console.log(`💳 Stripe payment completed for order: ${orderId}`);
      
      // Connect to MongoDB
      client = new MongoClient(MONGODB_URI, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });
      
      await client.connect();
      const db = client.db('mjcarros');
      const ordersCollection = db.collection('orders');
      const productsCollection = db.collection('products');
      
      // Update order with payment details
      const updateResult = await ordersCollection.updateOne(
        { _id: new ObjectId(orderId) },
        {
          $set: {
            isPaid: true,
            address: session?.customer_details?.address?.line1 || "",
            phone: session?.customer_details?.phone || "",
            userEmail: session?.metadata?.email || session?.customer_details?.email || "",
            updatedAt: new Date()
          }
        }
      );

      if (updateResult.matchedCount === 0) {
        console.error(`❌ Order ${orderId} not found`);
        return new NextResponse("Order not found", { status: 404 });
      }

      // Get the updated order with items
      const updatedOrder = await ordersCollection.findOne({ _id: new ObjectId(orderId) });
      
      if (!updatedOrder) {
        return new NextResponse("Order not found after update", { status: 404 });
      }

      // Fetch product details for order items
      const orderItemsWithProducts = await Promise.all(
        (updatedOrder.orderItems || []).map(async (item: any) => {
          const product = await productsCollection.findOne({ _id: new ObjectId(item.productId) });
          return {
            ...item,
            product: product ? {
              _id: product._id.toString(),
              title: product.title,
              description: product.description,
              price: product.price,
              category: product.category,
              modelName: product.modelName,
              year: product.year,
              mileage: product.mileage,
              fuelType: product.fuelType,
              color: product.color,
              condition: product.condition,
              imageURLs: product.imageURLs
            } : null
          };
        })
      );

      const updatedOrderWithProducts = {
        ...updatedOrder,
        id: updatedOrder._id.toString(),
        orderItems: orderItemsWithProducts,
        userEmail: updatedOrder.userEmail || ""
      };

      // Log payment completion
      console.log(`✅ Order ${orderId} payment confirmed via Stripe`);
      console.log(`👤 Customer: ${(updatedOrder as any).userEmail}`);
      console.log(`💰 Amount: €${session?.amount_total ? (session.amount_total / 100).toFixed(2) : 'N/A'}`);
      console.log(`💳 Payment Method: Stripe`);

      // Backup updated order to S3
      await backupOrderToS3(updatedOrderWithProducts);

      // Atomically set notificationSent if not set to prevent duplicate notifications
      const notifUpdate = await ordersCollection.updateOne(
        { _id: new ObjectId(orderId), notificationSent: { $ne: true } },
        { $set: { notificationSent: true } }
      );
      if (notifUpdate.modifiedCount === 0) {
        console.log(`ℹ️ Order ${orderId} already notified. Skipping email.`);
        await backupOrderToS3(updatedOrderWithProducts);
        return new NextResponse(null, { status: 200 });
      }

      // Generate professional email and attach the same invoice PDF
      const { subject, html } = generateOrderConfirmationEmail(updatedOrderWithProducts as any, 'Stripe');
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const invoiceRes = await fetch(`${appUrl}/api/orders/${orderId}/invoice`, { headers: { Accept: 'application/pdf' }, cache: 'no-store' });
      const attachments: any[] = [];
      if (invoiceRes.ok) {
        const pdfArrayBuffer = await invoiceRes.arrayBuffer();
        attachments.push({ filename: `invoice-${orderId}.pdf`, content: Buffer.from(pdfArrayBuffer), contentType: 'application/pdf' });
      } else {
        console.warn('⚠️ Invoice fetch failed for webhook attachment:', invoiceRes.status, invoiceRes.statusText);
      }
      
      try {
        if (updatedOrderWithProducts.userEmail && updatedOrderWithProducts.userEmail.trim()) {
          const logoBuffer = await fetch(`${appUrl}/logo.png`).then(r=>r.arrayBuffer()).then(b=>Buffer.from(b));
          await sendMail(updatedOrderWithProducts.userEmail, subject, html, [
            { filename: 'logo.png', content: logoBuffer, cid: 'mjcarros-logo' },
            ...attachments
          ]);
          console.log(`📧 Professional order confirmation email with invoice sent to: ${updatedOrderWithProducts.userEmail}`);
        } else {
          console.log('⚠️ No email address provided - skipping email notification');
        }
      } catch (emailError) {
        console.warn('Failed to send order confirmation email:', emailError);
      }

    } catch (e) {
      console.error("❌ Stripe webhook error:", e);
      return new NextResponse("Webhook processing failed", { status: 500 });
    } finally {
      if (client) {
        await client.close();
      }
    }
  }

  return new NextResponse(null, { status: 200 });
}
