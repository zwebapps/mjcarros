import { NextRequest, NextResponse } from "next/server";
import { MongoClient, ObjectId } from "mongodb";
import { extractTokenFromHeader, verifyToken } from "@/lib/auth";
import { getMongoDbUri } from "@/lib/mongodb-connection";

export const runtime = 'nodejs';

const MONGODB_URI = getMongoDbUri();

export async function DELETE(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  let client: MongoClient | null = null;
  try {
    // Admin auth
    const token = extractTokenFromHeader(request.headers.get('authorization') || undefined);
    const payload = token ? verifyToken(token) : null;
    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { orderId } = params;
    if (!orderId || !ObjectId.isValid(orderId)) {
      return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 });
    }

    client = new MongoClient(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    await client.connect();
    const db = client.db('mjcarros');
    const ordersCollection = db.collection('orders');

    const result = await ordersCollection.deleteOne({ _id: new ObjectId(orderId) });
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[ORDER_DELETE_ERROR]', e);
    return NextResponse.json({ error: 'Error deleting order' }, { status: 500 });
  } finally {
    if (client) await client.close();
  }
}


