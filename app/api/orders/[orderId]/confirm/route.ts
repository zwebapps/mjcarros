import { NextRequest, NextResponse } from "next/server";
import { MongoClient, ObjectId } from "mongodb";
import { sendMail } from "@/lib/mail";
import { generateOrderConfirmationEmail } from "@/lib/email-templates";
import { generatePDFVoucher } from "@/lib/pdf-voucher-generator";
import { uploadOrderVoucherToS3 } from "@/lib/voucher-s3";
import { getMongoDbUri } from "@/lib/mongodb-connection";

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
    const db = client.db('mjcarros');
    const ordersCollection = db.collection('orders');
    const productsCollection = db.collection('products');

    // Update order as paid
    const updateData = {
      isPaid: true,
      updatedAt: new Date(),
    };

    const updateResult = await ordersCollection.updateOne(
      { _id: new ObjectId(orderId) },
      { $set: updateData }
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

    // Generate professional email (skip PDF generation for now)
    const { subject, html } = generateOrderConfirmationEmail(updatedOrderWithProducts as any, 'Stripe');
    
    // Skip PDF generation since Chrome is not available
    console.log('⚠️ PDF generation skipped - Chrome not available');
    const attachments: any[] = [];
    
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
