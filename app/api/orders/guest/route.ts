import { NextRequest, NextResponse } from "next/server";
import { MongoClient, ObjectId } from "mongodb";

import { getMongoDbUri } from "@/lib/mongodb-connection";

const MONGODB_URI = getMongoDbUri();

export async function POST(request: NextRequest) {
  let client;
  
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== 'string' || !/.+@.+\..+/.test(email)) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 }
      );
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

    // Find orders by email
    const orders = await ordersCollection
      .find({ userEmail: email.trim() })
      .sort({ createdAt: -1 })
      .toArray();

    // Fetch products for each order's items
    const ordersWithProducts = await Promise.all(
      orders.map(async (order) => {
        const orderItemsWithProducts = await Promise.all(
          (order.orderItems || []).map(async (item: any) => {
            let product = null;
            try {
              if (item?.productId) {
                if (ObjectId.isValid(item.productId)) {
                  product = await productsCollection.findOne({ _id: new ObjectId(item.productId) });
                } else {
                  // Fallback: some historical data may store string ids or custom id field
                  product = await productsCollection.findOne({ id: String(item.productId) });
                }
              }
            } catch {}
            return {
              ...item,
              product
            };
          })
        );

        return {
          ...order,
          id: order._id.toString(), // Add id field for compatibility
          orderItems: orderItemsWithProducts
        };
      })
    );

    return NextResponse.json(ordersWithProducts);
  } catch (error) {
    console.error("Error fetching guest orders:", error);
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
