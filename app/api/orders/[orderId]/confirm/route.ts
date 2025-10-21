import { NextRequest, NextResponse } from "next/server";
import { MongoClient, ObjectId } from "mongodb";
import { sendMail } from "@/lib/mail";
import { generateOrderConfirmationEmail } from "@/lib/email-templates";
import { getMongoDbUri, getMongoDbName } from "@/lib/mongodb-connection";

export async function POST(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  let client;
  
  try {
    const { orderId } = params;
    
    if (!orderId || !ObjectId.isValid(orderId)) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
    }

    const MONGODB_URI = getMongoDbUri();
    client = new MongoClient(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    await client.connect();
    const db = client.db(getMongoDbName());
    const ordersCollection = db.collection('orders');
    const productsCollection = db.collection('products');

            // Atomically set notificationSent to prevent duplicates
            const updateResult = await ordersCollection.updateOne(
              { _id: new ObjectId(orderId), notificationSent: { $ne: true } },
              { $set: { isPaid: true, updatedAt: new Date(), notificationSent: true } }
            );

    if (updateResult.matchedCount === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Fetch the updated order with all details
    const updatedOrder = await ordersCollection.findOne({ _id: new ObjectId(orderId) });

    if (!updatedOrder) {
      return NextResponse.json({ error: "Order not found after update" }, { status: 404 });
    }

    // Fetch products for order items
    const orderItemsWithProducts = await Promise.all(
      (updatedOrder.orderItems || []).map(async (item: any) => {
        let product = null;
        if (item.productId && ObjectId.isValid(item.productId)) {
          try {
            product = await productsCollection.findOne({ _id: new ObjectId(item.productId) });
          } catch (error) {
            console.error(`Error fetching product ${item.productId}:`, error);
          }
        }
        return {
          ...item,
          product: product ? {
            _id: product._id.toString(),
            title: product.title,
            description: product.description,
            price: product.price,
            category: product.category,
            imageURLs: product.imageURLs || []
          } : null
        };
      })
    );

    // Add products to order
    const updatedOrderWithProducts = {
      ...updatedOrder,
      id: updatedOrder._id.toString(),
      orderItems: orderItemsWithProducts,
      userEmail: updatedOrder.userEmail || ""
    };

    // Generate professional email and attach PDF voucher (fallback if generation fails)
    const { subject, html } = generateOrderConfirmationEmail(updatedOrderWithProducts as any, 'Stripe');
    const attachments: any[] = [];
    // Fetch the same invoice PDF via internal API and attach to email
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const invoiceRes = await fetch(`${appUrl}/api/orders/${updatedOrderWithProducts.id}/invoice`, { headers: { Accept: 'application/pdf' }, cache: 'no-store' });
      if (invoiceRes.ok) {
        const pdfArrayBuffer = await invoiceRes.arrayBuffer();
        attachments.push({
          filename: `invoice-${updatedOrderWithProducts.id}.pdf`,
          content: Buffer.from(pdfArrayBuffer),
          contentType: 'application/pdf',
        });
      } else {
        console.warn('⚠️ Invoice fetch failed:', invoiceRes.status, invoiceRes.statusText);
      }
    } catch (pdfErr) {
      console.warn('⚠️ Failed to fetch invoice PDF for attachment:', pdfErr);
    }
    
            try {
      if (updatedOrderWithProducts.userEmail && updatedOrderWithProducts.userEmail.trim()) {
                await sendMail(updatedOrderWithProducts.userEmail, subject, html, attachments);
        console.log(`📧 Professional order confirmation email sent to: ${updatedOrderWithProducts.userEmail}`);
      } else {
        console.log('⚠️ No email address provided - skipping email notification');
      }
    } catch (emailError) {
      console.warn('Failed to send payment confirmation email:', emailError);
    }

    return NextResponse.json({ 
      success: true, 
      orderId: updatedOrderWithProducts.id, 
      email: updatedOrderWithProducts.userEmail,
      message: "Order confirmed and email sent"
    });
  } catch (err) {
    console.error("[ORDERS_CONFIRM_ERROR]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  } finally {
    if (client) {
      await client.close();
    }
  }
}
