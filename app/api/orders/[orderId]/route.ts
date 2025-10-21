import { NextRequest, NextResponse } from "next/server";
import { MongoClient, ObjectId } from "mongodb";
import { extractTokenFromHeader, verifyToken } from "@/lib/auth";
import { getMongoDbUri, getMongoDbName } from "@/lib/mongodb-connection";
import { sendMail } from "@/lib/mail";
import { generateOrderConfirmationEmail } from "@/lib/email-templates";

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
    const db = client.db(getMongoDbName());
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

export async function PATCH(
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

    const body = await request.json().catch(() => ({}));
    const { action, isPaid, phone, userEmail, address, paymentMethod } = body || {};
    const markPaid = action === 'markPaid' || isPaid === true;

    client = new MongoClient(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    await client.connect();
    const db = client.db(getMongoDbName());
    const ordersCollection = db.collection('orders');
    const productsCollection = db.collection('products');

    // Load existing to compare state
    const existing = await ordersCollection.findOne({ _id: new ObjectId(orderId) });
    if (!existing) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Build update
    const setData: any = { updatedAt: new Date() };
    if (typeof phone === 'string') setData.phone = phone.trim();
    if (typeof userEmail === 'string') setData.userEmail = userEmail.trim();
    if (typeof address === 'string') setData.address = address.trim();
    if (typeof paymentMethod === 'string') setData.paymentMethod = paymentMethod;
    if (markPaid) {
      setData.isPaid = true;
      if (!setData.paymentMethod) setData.paymentMethod = 'Manual';
      // allow email to be sent
      setData.notificationSent = false;
    } else if (typeof isPaid === 'boolean') {
      setData.isPaid = isPaid;
      if (!isPaid) setData.notificationSent = false; // reset flag if marking unpaid
    }

    const updateResult = await ordersCollection.updateOne(
      { _id: new ObjectId(orderId) },
      { $set: setData }
    );

    if (updateResult.matchedCount === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const updatedOrder = await ordersCollection.findOne({ _id: new ObjectId(orderId) });
    if (!updatedOrder) {
      return NextResponse.json({ error: 'Order not found after update' }, { status: 404 });
    }

    // Enrich items with product details
    const orderItemsWithProducts = await Promise.all(
      (updatedOrder.orderItems || []).map(async (item: any) => {
        let product = null;
        if (item.productId && ObjectId.isValid(item.productId)) {
          product = await productsCollection.findOne({ _id: new ObjectId(item.productId) });
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

    const updatedOrderWithProducts: any = {
      ...updatedOrder,
      id: updatedOrder._id.toString(),
      orderItems: orderItemsWithProducts,
      userEmail: updatedOrder.userEmail || ''
    };

    // Send confirmation only if transitioning to paid
    if (!existing.isPaid && (markPaid || isPaid === true)) {
      const { subject, html } = generateOrderConfirmationEmail(updatedOrderWithProducts, 'Stripe');
      const attachments: any[] = [];
      try {
        const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'localhost:3000';
        const proto = request.headers.get('x-forwarded-proto') || 'http';
        const origin = process.env.NEXT_PUBLIC_APP_URL || `${proto}://${host}`;
        const fHeaders: any = { Accept: 'application/pdf', origin, 'x-forwarded-host': host, 'x-forwarded-proto': proto };
        const invoiceRes = await fetch(`${origin}/api/orders/${updatedOrderWithProducts.id}/invoice`, { headers: fHeaders, cache: 'no-store' });
        if (invoiceRes.ok) {
          const pdfArrayBuffer = await invoiceRes.arrayBuffer();
          attachments.push({ filename: `invoice-${updatedOrderWithProducts.id}.pdf`, content: Buffer.from(pdfArrayBuffer), contentType: 'application/pdf' });
        }
      } catch {}

      try {
        if (updatedOrderWithProducts.userEmail && updatedOrderWithProducts.userEmail.trim()) {
          await sendMail(updatedOrderWithProducts.userEmail, subject, html, attachments);
          await ordersCollection.updateOne({ _id: new ObjectId(orderId) }, { $set: { notificationSent: true } });
        }
      } catch (e) {
        console.warn('[ORDER_MANUAL_EMAIL_FAIL]', e);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[ORDER_PATCH_ERROR]', e);
    return NextResponse.json({ error: 'Error updating order' }, { status: 500 });
  } finally {
    if (client) await client.close();
  }
}


