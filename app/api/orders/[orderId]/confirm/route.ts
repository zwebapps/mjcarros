import { NextRequest, NextResponse } from "next/server";
import { sendMail } from "@/lib/mail";
import { generateOrderConfirmationEmail } from "@/lib/email-templates";
import { db } from "@/lib/db";
import { prisma } from "@/lib/prisma";
import { legacyMongoFilter } from "@/lib/id-resolve";

export async function POST(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const { orderId } = params;

    if (!orderId) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
    }

    const existing = await prisma.order.findFirst({ where: legacyMongoFilter(orderId) });
    if (!existing) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const updateResult = await prisma.order.updateMany({
      where: { id: existing.id, notificationSent: false },
      data: { isPaid: true, notificationSent: true },
    });

    if (updateResult.count === 0) {
      return NextResponse.json({ error: "Order not found or already notified" }, { status: 404 });
    }

    const updatedOrder = await db.order.findUnique({ where: { id: existing.id } });
    if (!updatedOrder) {
      return NextResponse.json({ error: "Order not found after update" }, { status: 404 });
    }

    const { subject, html } = generateOrderConfirmationEmail(updatedOrder, "Stripe");
    const attachments: { filename: string; content: Buffer; contentType: string }[] = [];
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const invoiceRes = await fetch(`${appUrl}/api/orders/${updatedOrder._id}/invoice`, {
        headers: { Accept: "application/pdf" },
        cache: "no-store",
      });
      if (invoiceRes.ok) {
        const pdfArrayBuffer = await invoiceRes.arrayBuffer();
        attachments.push({
          filename: `invoice-${updatedOrder._id}.pdf`,
          content: Buffer.from(pdfArrayBuffer),
          contentType: "application/pdf",
        });
      }
    } catch (pdfErr) {
      console.warn("Failed to fetch invoice PDF for attachment:", pdfErr);
    }

    try {
      if (updatedOrder.userEmail?.trim()) {
        await sendMail(updatedOrder.userEmail, subject, html, attachments);
      }
    } catch (emailError) {
      console.warn("Failed to send payment confirmation email:", emailError);
    }

    return NextResponse.json({
      success: true,
      orderId: updatedOrder._id,
      email: updatedOrder.userEmail,
      message: "Order confirmed and email sent",
    });
  } catch (err) {
    console.error("[ORDERS_CONFIRM_ERROR]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
