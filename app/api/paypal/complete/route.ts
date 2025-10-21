import { NextRequest, NextResponse } from "next/server";
import { MongoClient, ObjectId } from "mongodb";
import { backupOrderToS3, logOrderCreation } from "@/lib/order-backup";
import { sendMail } from "@/lib/mail";
import { generateOrderConfirmationEmail } from "@/lib/email-templates";
import { generatePDFVoucher } from "@/lib/pdf-voucher-generator";
import { uploadOrderVoucherToS3 } from "@/lib/voucher-s3";
import { generateOrderNumber } from "@/lib/order-number-generator";
import { getMongoDbUri, getMongoDbName } from "@/lib/mongodb-connection";

const MONGODB_URI = getMongoDbUri();

export const runtime = 'nodejs'; // Ensure Node.js runtime for Puppeteer/pdf generation

export async function POST(req: NextRequest) {
  let client;
  
  try {
    const raw = await req.text();
    // Log PayPal complete request BEFORE any processing
    try {
      console.log('[PAYPAL_COMPLETE_RECEIVED]', raw ? JSON.parse(raw) : {});
    } catch {
      console.log('[PAYPAL_COMPLETE_RECEIVED_RAW]', { bodyLength: raw?.length || 0 });
    }

    const { items, email } = raw ? JSON.parse(raw) : { items: [], email: '' };

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Items are required" }, { status: 400 });
    }

    // Connect to MongoDB
    client = new MongoClient(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    await client.connect();
    const db = client.db(getMongoDbName());
    const ordersCollection = db.collection('orders');
    const productsCollection = db.collection('products');

    // Generate order number
    const orderNumber = await generateOrderNumber();
    
    // Fetch product details for each item
    const orderItemsWithProducts = await Promise.all(
      items.map(async (item: any) => {
        const product = await productsCollection.findOne({ 
          _id: new ObjectId(item._id || item.id) 
        });
        
        // If product not found, create a default product object
        const productData = product ? {
          _id: product._id.toString(),
          title: product.title || item.title || 'Unknown Product',
          description: product.description || '',
          price: product.price || item.price || 0,
          category: product.category || 'Unknown',
          modelName: product.modelName || '',
          year: product.year || new Date().getFullYear(),
          mileage: product.mileage || 0,
          fuelType: product.fuelType || 'Unknown',
          color: product.color || 'Unknown',
          condition: product.condition || 'Used',
          imageURLs: product.imageURLs || []
        } : {
          _id: item._id || item.id,
          title: item.title || 'Unknown Product',
          description: '',
          price: item.price || 0,
          category: 'Unknown',
          modelName: '',
          year: new Date().getFullYear(),
          mileage: 0,
          fuelType: 'Unknown',
          color: 'Unknown',
          condition: 'Used',
          imageURLs: []
        };
        
        return {
          productId: item._id || item.id,
          productName: item.title || 'Unknown Product',
          quantity: 1,
          price: item.price || 0,
          product: productData
        };
      })
    );
    
    const orderData = {
      orderNumber: orderNumber,
      isPaid: true,
      userEmail: email || "",
      orderItems: orderItemsWithProducts,
      phone: "",
      address: "",
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await ordersCollection.insertOne(orderData);
    const order = { 
      ...orderData, 
      _id: result.insertedId.toString(),
      id: result.insertedId.toString(),
      paymentMethod: 'PayPal'
    };

    // Mark purchased products as sold
    try {
      const itemIds = (order.orderItems || []).map((it: any) => it.productId).filter((pid: any) => pid);
      if (itemIds.length > 0) {
        await productsCollection.updateMany(
          { _id: { $in: itemIds.map((pid: string) => new ObjectId(pid)) } },
          { $set: { sold: true, updatedAt: new Date() } }
        );
      }
    } catch (soldErr) {
      console.warn('[PAYPAL_SET_SOLD_FAIL]', soldErr);
    }

    // Log order creation
    logOrderCreation(order);

    // Backup order to S3
    await backupOrderToS3(order);

    // Generate professional email and attach PDF voucher (fallback if generation fails)
    const { subject, html } = generateOrderConfirmationEmail(order, 'PayPal');
    const attachments: any[] = [];
    // Fetch the same invoice PDF via internal API and attach to email
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const invoiceRes = await fetch(`${appUrl}/api/orders/${order._id || order.id}/invoice`, { headers: { Accept: 'application/pdf' }, cache: 'no-store' });
      if (invoiceRes.ok) {
        const pdfArrayBuffer = await invoiceRes.arrayBuffer();
        attachments.push({
          filename: `invoice-${order._id || order.id}.pdf`,
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
      if (order.userEmail && order.userEmail.trim()) {
        await sendMail(order.userEmail, subject, html, attachments);
        console.log(`📧 Professional order confirmation email sent to: ${order.userEmail}`);
      } else {
        console.log('⚠️ No email address provided - skipping email notification');
      }
    } catch (emailError) {
      console.warn('Failed to send order confirmation email:', emailError);
    }

    return NextResponse.json({ 
      ok: true, 
      orderId: order._id || order.id, 
      email: order.userEmail 
    });
  } catch (error) {
    console.error("[PAYPAL_COMPLETE_ERROR]", error);
    return NextResponse.json({ error: "Failed to record order" }, { status: 500 });
  } finally {
    if (client) {
      await client.close();
    }
  }
}