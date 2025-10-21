import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { MongoClient } from "mongodb";
import { generateOrderNumber } from "@/lib/order-number-generator";
import { getMongoDbUri, getMongoDbName } from "@/lib/mongodb-connection";

const MONGODB_URI = getMongoDbUri();

const stripeSecret = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecret ? new Stripe(stripeSecret, { apiVersion: "2023-10-16" }) : (null as unknown as Stripe);

export async function POST(req: NextRequest) {
  let client;
  
  try {
    if (!stripeSecret || !stripe) {
      return NextResponse.json({ error: "Stripe is not configured" }, { status: 500 });
    }

    const body = await req.json();
    const { items, email } = body as { items: any[]; email?: string };

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Items are required" }, { status: 400 });
    }

    // Use external URL for Stripe redirects
    const origin = process.env.STRIPE_REDIRECT_URL || process.env.NEXT_PUBLIC_APP_URL || req.headers.get("origin") || "http://localhost:3000";

    // Connect to MongoDB
    client = new MongoClient(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    await client.connect();
    const db = client.db(getMongoDbName());
    const ordersCollection = db.collection('orders');

    // Generate order number
    const orderNumber = await generateOrderNumber();
    
    // Create a pending order
    const orderData = {
        orderNumber: orderNumber,
        isPaid: false,
        userEmail: email || "",
        orderItems: items.map((item: any) => ({
          productId: item._id || item.id,
          productName: item.title,
          quantity: 1,
          price: item.price
        })),
        phone: "",
        address: "",
        createdAt: new Date(),
        updatedAt: new Date()
      };

    const result = await ordersCollection.insertOne(orderData);
    const order = { ...orderData, _id: result.insertedId };

    const lineItems = items.map((item: any) => {
      const price = Math.round(Number(item.price) * 100);
      const image = Array.isArray(item.imageURLs) && item.imageURLs[0] && /^https?:\/\//.test(item.imageURLs[0])
        ? [item.imageURLs[0]]
        : undefined;

      return {
        price_data: {
          currency: "eur",
          product_data: {
            name: item.title,
            ...(image ? { images: image } : {}),
          },
          unit_amount: price,
        },
        quantity: item.quantity || 1,
      } as Stripe.Checkout.SessionCreateParams.LineItem;
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      // Include Stripe's {CHECKOUT_SESSION_ID} token so we can verify server-side without webhooks
      success_url: `${origin}/cart?success=1&orderId=${order._id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cart?canceled=1`,
      metadata: { email: email || "", orderId: String(order._id) },
    });

    // Store checkout session id on order for traceability
    try {
      await ordersCollection.updateOne({ _id: order._id }, { $set: { checkoutSessionId: session.id, updatedAt: new Date() } });
    } catch (e) {
      console.warn('[CHECKOUT_STORE_SESSION_ID_FAIL]', e);
    }

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.log("[CHECKOUT_ERROR]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  } finally {
    if (client) {
      await client.close();
    }
  }
}
