import Stripe from "stripe";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { MongoClient, ObjectId } from "mongodb";
import { backupOrderToS3, logOrderCreation } from "@/lib/order-backup";
import { sendMail } from "@/lib/mail";
import { generateOrderConfirmationEmail } from "@/lib/email-templates";
import { generatePDFVoucher } from "@/lib/pdf-voucher-generator";
import { uploadOrderVoucherToS3 } from "@/lib/voucher-s3";
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
      console.log(`💰 Amount: $${session?.amount_total ? (session.amount_total / 100).toFixed(2) : 'N/A'}`);
      console.log(`💳 Payment Method: Stripe`);

      // Backup updated order to S3
      await backupOrderToS3(updatedOrderWithProducts);

      // Generate professional email and PDF voucher
      const { subject, html } = generateOrderConfirmationEmail(updatedOrderWithProducts as any, 'Stripe');
      const pdfVoucher = await generatePDFVoucher(updatedOrderWithProducts as any);
      
      // Upload voucher to S3
      const voucherUrl = await uploadOrderVoucherToS3(updatedOrderWithProducts as any);
      
      // Create PDF voucher attachment
      const attachments = [
        {
          filename: `voucher-${(updatedOrder as any).id || orderId}.pdf`,
          content: pdfVoucher,
          contentType: 'application/pdf'
        }
      ];
      
      try {
        if (updatedOrderWithProducts.userEmail && updatedOrderWithProducts.userEmail.trim()) {
          await sendMail(updatedOrderWithProducts.userEmail, subject, html, attachments);
          console.log(`📧 Professional order confirmation email with PDF voucher sent to: ${updatedOrderWithProducts.userEmail}`);
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
    } finally {
      if (client) {
        await client.close();
      }
    }
  }

  return new NextResponse(null, { status: 200 });
}
