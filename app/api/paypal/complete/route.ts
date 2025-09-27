import { NextRequest, NextResponse } from "next/server";
import { MongoClient, ObjectId } from "mongodb";
import { backupOrderToS3, logOrderCreation } from "@/lib/order-backup";
import { sendMail } from "@/lib/mail";
import { generateOrderConfirmationEmail } from "@/lib/email-templates";
import { generatePDFVoucher } from "@/lib/pdf-voucher-generator";
import { uploadOrderVoucherToS3 } from "@/lib/voucher-s3";
import { generateOrderNumber } from "@/lib/order-number-generator";
import { getMongoDbUri } from "@/lib/mongodb-connection";

const MONGODB_URI = getMongoDbUri();

export async function POST(req: NextRequest) {
  let client;
  
  try {
    const { items, email } = await req.json();

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
    const db = client.db('mjcarros');
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

    // Log order creation
    logOrderCreation(order);

    // Backup order to S3
    await backupOrderToS3(order);

    // Generate professional email (skip PDF generation for now)
    const { subject, html } = generateOrderConfirmationEmail(order, 'PayPal');
    
    // Skip PDF generation since Chrome is not available
    console.log('⚠️ PDF generation skipped - Chrome not available');
    const attachments: any[] = [];
    
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