import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { backupOrderToS3, logOrderCreation } from "@/lib/order-backup";
import { sendMail } from "@/lib/mail";
import { generateOrderConfirmationEmail } from "@/lib/email-templates";
import { generatePDFVoucher } from "@/lib/pdf-voucher-generator";
import { uploadOrderVoucherToS3 } from "@/lib/voucher-s3";
import { generateOrderNumber } from "@/lib/order-number-generator";

export async function POST(req: NextRequest) {
  try {
    const { items, email } = await req.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Items are required" }, { status: 400 });
    }

    if (!db) {
      return NextResponse.json({ error: 'Database not found' }, { status: 500 });
    }
    // Generate order number
    const orderNumber = await generateOrderNumber();
    
    const order = await db.order.create({
      data: {
        orderNumber: orderNumber,
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
            product: true
          } 
        }
      },
    });

    // Log order creation
    logOrderCreation(order);

    // Backup order to S3
    await backupOrderToS3(order);

    // Generate professional email and PDF voucher
    const { subject, html } = generateOrderConfirmationEmail(order, 'PayPal');
    const pdfVoucher = await generatePDFVoucher(order);
    
    // Upload voucher to S3
    const voucherUrl = await uploadOrderVoucherToS3(order);
    
    // Create PDF voucher attachment
    const attachments = [
      {
        filename: `voucher-${order.id}.pdf`,
        content: pdfVoucher,
        contentType: 'application/pdf'
      }
    ];
    
    try {
      if (order.userEmail && order.userEmail.trim()) {
        await sendMail(order.userEmail, subject, html, attachments);
        console.log(`📧 Professional order confirmation email with PDF voucher sent to: ${order.userEmail}`);
        if (voucherUrl) {
          console.log(`☁️ Voucher also available at: ${voucherUrl}`);
        }
      } else {
        console.log('⚠️ No email address provided - skipping email notification');
        console.log(`☁️ Voucher available at: ${voucherUrl}`);
      }
    } catch (emailError) {
      console.warn('Failed to send order confirmation email:', emailError);
    }

    return NextResponse.json({ 
      ok: true, 
      orderId: order.id, 
      email: order.userEmail 
    });
  } catch (error) {
    console.error("[PAYPAL_COMPLETE_ERROR]", error);
    return NextResponse.json({ error: "Failed to record order" }, { status: 500 });
  }
}
