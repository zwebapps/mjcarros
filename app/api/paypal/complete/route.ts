import { NextRequest, NextResponse } from "next/server";
import { backupOrderToS3, logOrderCreation } from "@/lib/order-backup";
import { sendMail } from "@/lib/mail";
import { generateOrderConfirmationEmail } from "@/lib/email-templates";
import { generateOrderNumber } from "@/lib/order-number-generator";
import { db } from "@/lib/db";
import { prisma } from "@/lib/prisma";
import { legacyMongoFilter } from "@/lib/id-resolve";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const raw = await req.text();
    try {
      console.log("[PAYPAL_COMPLETE_RECEIVED]", raw ? JSON.parse(raw) : {});
    } catch {
      console.log("[PAYPAL_COMPLETE_RECEIVED_RAW]", { bodyLength: raw?.length || 0 });
    }

    const { items, email } = raw ? JSON.parse(raw) : { items: [], email: "" };

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Items are required" }, { status: 400 });
    }

    const orderNumber = await generateOrderNumber();

    const itemsCreate = await Promise.all(
      items.map(async (item: { _id?: string; id?: string; title?: string; price?: number }) => {
        const rawId = String(item._id || item.id || "");
        const product = rawId
          ? await prisma.product.findFirst({ where: legacyMongoFilter(rawId) })
          : null;
        return {
          productId: product?.id,
          productName: item.title || product?.title || "Unknown Product",
          quantity: 1,
          price: item.price || product?.price || 0,
        };
      })
    );

    const order = await db.order.create({
      data: {
        orderNumber,
        isPaid: true,
        userEmail: email || "",
        phone: "",
        address: "",
        paymentMethod: "PayPal",
        orderItems: { create: itemsCreate },
      },
    });

    try {
      const productIds: string[] = [];
      for (const it of order.orderItems || []) {
        const row = it as {
          productId?: string;
          product?: { id?: string } | null;
        };
        if (row.product?.id) {
          productIds.push(row.product.id);
          continue;
        }
        if (!row.productId) continue;
        const product = await prisma.product.findFirst({
          where: legacyMongoFilter(String(row.productId)),
        });
        if (product) productIds.push(product.id);
      }
      const uniqueIds = [...new Set(productIds)];
      if (uniqueIds.length > 0) {
        await prisma.product.updateMany({
          where: { id: { in: uniqueIds } },
          data: { sold: true },
        });
      }
    } catch (soldErr) {
      console.warn("[PAYPAL_SET_SOLD_FAIL]", soldErr);
    }

    logOrderCreation(order);
    await backupOrderToS3(order);

    const { subject, html } = generateOrderConfirmationEmail(order, "PayPal");
    const attachments: { filename: string; content: Buffer; contentType: string }[] = [];
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const invoiceRes = await fetch(`${appUrl}/api/orders/${order._id}/invoice`, {
        headers: { Accept: "application/pdf" },
        cache: "no-store",
      });
      if (invoiceRes.ok) {
        const pdfArrayBuffer = await invoiceRes.arrayBuffer();
        attachments.push({
          filename: `invoice-${order._id}.pdf`,
          content: Buffer.from(pdfArrayBuffer),
          contentType: "application/pdf",
        });
      }
    } catch (pdfErr) {
      console.warn("Failed to fetch invoice PDF for attachment:", pdfErr);
    }

    try {
      if (order.userEmail?.trim()) {
        await sendMail(order.userEmail, subject, html, attachments);
      }
    } catch (emailError) {
      console.warn("Failed to send order confirmation email:", emailError);
    }

    return NextResponse.json({
      ok: true,
      orderId: order._id,
      email: order.userEmail,
    });
  } catch (error) {
    console.error("[PAYPAL_COMPLETE_ERROR]", error);
    return NextResponse.json({ error: "Failed to record order" }, { status: 500 });
  }
}
