import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateOrderNumber } from "@/lib/order-number-generator";
import { extractTokenFromHeader, verifyToken } from "@/lib/auth";
import { sendMail } from "@/lib/mail";
import { backupOrderToS3, logOrderCreation } from "@/lib/order-backup";

export async function GET(request: NextRequest) {
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
    if (!db) {
      return NextResponse.json({ error: 'Database not found' }, { status: 500 });
    }
    // Admin: return all orders
    if (userRole === 'ADMIN') {
      const orders = await db.order.findMany({
        include: { orderItems: { include: { product: true } } },
        orderBy: { createdAt: 'desc' },
      });
      return NextResponse.json(orders);
    }

    // Authenticated user: return own orders
    if (userEmail) {
      const orders = await db.order.findMany({
        where: { userEmail },
        include: { orderItems: { include: { product: true } } },
        orderBy: { createdAt: 'desc' },
      });
      return NextResponse.json(orders);
    }

    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Error fetching orders" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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
    if (!db) {
      return NextResponse.json({ error: 'Database not found' }, { status: 500 });
    }
    
    // Generate order number
    const orderNumber = await generateOrderNumber();
    
    const newOrder = await db.order.create({
      data: {
        orderNumber: orderNumber,
        phone: phone.trim(),
        address: (address || "").trim(),
        userEmail: userEmail.trim(),
        orderItems: {
          create: orderItems.map((item: any) => ({
            productId: item.productId,
            productName: item.productName,
          })),
        },
      },
      include: {
        orderItems: { 
          include: { 
            product: {
              select: {
                id: true,
                title: true,
                price: true,
                modelName: true,
                year: true,
                color: true,
                mileage: true,
                fuelType: true,
                imageURLs: true
              }
            }
          } 
        }
      },
    });

    // Log order creation to console
    logOrderCreation(newOrder);

    // Backup order to S3
    await backupOrderToS3(newOrder);

    // Send confirmation email to customer
    const subject = `Your MJ Carros order ${newOrder.id}`;
    const itemsHtml = newOrder.orderItems.map((i) => `<li>${i.productName}</li>`).join('');
    const html = `
      <div>
        <h2>Thank you for your order!</h2>
        <p>Order ID: ${newOrder.id}</p>
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
  }
}
