import { NextRequest, NextResponse } from "next/server";
import { MongoClient, ObjectId } from "mongodb";
import { generateOrderNumber } from "@/lib/order-number-generator";
import { extractTokenFromHeader, verifyToken } from "@/lib/auth";
import { sendMail } from "@/lib/mail";
import { backupOrderToS3, logOrderCreation } from "@/lib/order-backup";
import { getMongoDbUri } from '@/lib/mongodb-connection';

export const runtime = 'nodejs'; // Force Node.js runtime for JWT compatibility

const MONGODB_URI = getMongoDbUri();

export async function GET(request: NextRequest) {
  let client;
  
  try {
    let userEmail = request.headers.get('x-user-email');
    let userRole = request.headers.get('x-user-role');

    // If middleware didn't inject headers, verify JWT here
    if (!userEmail || !userRole) {
      const token = extractTokenFromHeader(request.headers.get('authorization'));
      const payload = token ? verifyToken(token) : null;
      if (payload) {
        userEmail = payload.email;
        userRole = payload.role;
      }
    }

    console.log('MONGODB_URI>>>>', MONGODB_URI);

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
    
    // Helper function to enrich orders with product details
    const enrichOrdersWithProducts = async (orders: any[]) => {
      return Promise.all(orders.map(async (order) => {
        const enrichedOrderItems = await Promise.all(
          (order.orderItems || []).map(async (item: any) => {
            let product = null;
            
            // Only try to fetch product if productId is a valid ObjectId
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
        
        return {
          ...order,
          id: order._id.toString(),
          orderItems: enrichedOrderItems
        };
      }));
    };

    // Admin: return all orders with product details
    if (userRole === 'ADMIN') {
      const orders = await ordersCollection.find({}).sort({ createdAt: -1 }).toArray();
      const enrichedOrders = await enrichOrdersWithProducts(orders);
      return NextResponse.json(enrichedOrders);
    }

    // Authenticated user: return own orders with product details
    if (userEmail) {
      const orders = await ordersCollection.find({ userEmail }).sort({ createdAt: -1 }).toArray();
      const enrichedOrders = await enrichOrdersWithProducts(orders);
      return NextResponse.json(enrichedOrders);
    }

    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Error fetching orders" },
      { status: 500 }
    );
  } finally {
    if (client) {
      await client.close();
    }
  }
}

export async function POST(request: NextRequest) {
  let client;
  
  try {
    const body = await request.json();
    const { orderItems, phone, address, userEmail } = body;

    if (!orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
      return NextResponse.json(
        { error: "Order items are required" },
        { status: 400 }
      );
    }

    // Require phone and email
    const emailValid = typeof userEmail === 'string' && /.+@.+\..+/.test(userEmail);
    if (!phone || typeof phone !== 'string' || phone.trim().length < 5) {
      return NextResponse.json(
        { error: "Phone is required" },
        { status: 400 }
      );
    }
    if (!emailValid) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 }
      );
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
    
    // Generate order number
    const orderNumber = await generateOrderNumber();
    
    const orderData = {
        orderNumber: orderNumber,
        phone: phone.trim(),
        address: (address || "").trim(),
        userEmail: userEmail.trim(),
        orderItems: orderItems.map((item: any) => ({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity || 1,
          price: item.price || 0
        })),
        isPaid: false,
        paymentMethod: 'Stripe',
        createdAt: new Date(),
        updatedAt: new Date()
      };

    const result = await ordersCollection.insertOne(orderData);
    const newOrder = { 
      ...orderData, 
      _id: result.insertedId,
      id: result.insertedId.toString() // Add id field for compatibility
    };

    // Log order creation to console
    logOrderCreation(newOrder);

    // Backup order to S3
    await backupOrderToS3(newOrder);

    // Send confirmation email to customer
    const subject = `Your MJ Carros order ${newOrder._id}`;
    const itemsHtml = newOrder.orderItems.map((i) => `<li>${i.productName}</li>`).join('');
    const html = `
      <div>
        <h2>Thank you for your order!</h2>
        <p>Order ID: ${newOrder._id}</p>
        <ul>${itemsHtml}</ul>
        <p>We will contact you shortly.</p>
      </div>
    `;
    try { await sendMail(newOrder.userEmail, subject, html); } catch (e) { console.warn('sendMail failed', e); }

    return NextResponse.json(newOrder);
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { error: "Error creating order" },
      { status: 500 }
    );
  } finally {
    if (client) {
      await client.close();
    }
  }
}
