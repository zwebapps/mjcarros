import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { backupOrderToS3, logOrderCreation } from "@/lib/order-backup";
import { sendMail } from "@/lib/mail";

export async function POST(req: NextRequest) {
  try {
    const { items, email } = await req.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Items are required" }, { status: 400 });
    }

    const order = await db.order.create({
      data: {
        isPaid: true,
        userEmail: email || "",
        orderItems: {
          create: items.map((item: any) => ({
            productId: item.id,
            productName: item.title,
          })),
        },
      },
      include: { 
        orderItems: { 
          include: { 
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                make: true,
                model: true,
                year: true,
                colour: true,
                mileage: true,
                fuelType: true,
                vin: true,
                deliveryDate: true,
                images: true
              }
            }
          } 
        },
        user: true
      },
    });

    // Log order creation
    logOrderCreation(order);

    // Backup order to S3
    await backupOrderToS3(order);

    // Send order confirmation email
    const subject = `Order Confirmed - ${order.id}`;
    const itemsHtml = order.orderItems.map((i) => `<li>${i.productName}</li>`).join('');
    const html = `
      <div>
        <h2>🎉 Order Confirmed!</h2>
        <p>Your order has been successfully placed and paid via PayPal.</p>
        <p><strong>Order ID:</strong> ${order.id}</p>
        <p><strong>Payment Method:</strong> PayPal</p>
        <p><strong>Items:</strong></p>
        <ul>${itemsHtml}</ul>
        <p>We will process your order and contact you shortly.</p>
      </div>
    `;
    
    try {
      await sendMail(order.userEmail, subject, html);
      console.log(`📧 Order confirmation email sent to: ${order.userEmail}`);
    } catch (emailError) {
      console.warn('Failed to send order confirmation email:', emailError);
    }

    return NextResponse.json({ ok: true, orderId: order.id });
  } catch (error) {
    console.error("[PAYPAL_COMPLETE_ERROR]", error);
    return NextResponse.json({ error: "Failed to record order" }, { status: 500 });
  }
}
