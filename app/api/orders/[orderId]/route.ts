import { NextRequest, NextResponse } from "next/server";
import { extractTokenFromHeader, verifyToken } from "@/lib/auth";
import { sendMail } from "@/lib/mail";
import { generateOrderConfirmationEmail } from "@/lib/email-templates";
import { db } from "@/lib/db";
import { prisma } from "@/lib/prisma";
import { legacyMongoFilter } from "@/lib/id-resolve";

export const runtime = "nodejs";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const token = extractTokenFromHeader(request.headers.get("authorization") || undefined);
    const payload = token ? verifyToken(token) : null;
    if (!payload || payload.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { orderId } = params;
    if (!orderId) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
    }

    const existing = await prisma.order.findFirst({ where: legacyMongoFilter(orderId) });
    if (!existing) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    await prisma.order.delete({ where: { id: existing.id } });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[ORDER_DELETE_ERROR]", e);
    return NextResponse.json({ error: "Error deleting order" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const token = extractTokenFromHeader(request.headers.get("authorization") || undefined);
    const payload = token ? verifyToken(token) : null;
    if (!payload || payload.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { orderId } = params;
    if (!orderId) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const { action, isPaid, phone, userEmail, address, paymentMethod } = body || {};
    const markPaid = action === "markPaid" || isPaid === true;

    const existing = await prisma.order.findFirst({
      where: legacyMongoFilter(orderId),
      include: {
        orderItems: { include: { product: true } },
      },
    });
    if (!existing) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const setData: Record<string, unknown> = {};
    if (typeof phone === "string") setData.phone = phone.trim();
    if (typeof userEmail === "string") setData.userEmail = userEmail.trim();
    if (typeof address === "string") setData.address = address.trim();
    if (typeof paymentMethod === "string") setData.paymentMethod = paymentMethod;
    if (markPaid) {
      setData.isPaid = true;
      if (!paymentMethod) setData.paymentMethod = "Manual";
      setData.notificationSent = false;
    } else if (typeof isPaid === "boolean") {
      setData.isPaid = isPaid;
      if (!isPaid) setData.notificationSent = false;
    }

    await prisma.order.update({
      where: { id: existing.id },
      data: setData,
    });

    const updatedOrder = await db.order.findUnique({ where: { id: existing.id } });
    if (!updatedOrder) {
      return NextResponse.json({ error: "Order not found after update" }, { status: 404 });
    }

    if (!existing.isPaid && (markPaid || isPaid === true)) {
      const { subject, html } = generateOrderConfirmationEmail(updatedOrder, "Stripe");
      const attachments: { filename: string; content: Buffer; contentType: string }[] = [];
      try {
        const host =
          request.headers.get("x-forwarded-host") ||
          request.headers.get("host") ||
          "localhost:3000";
        const proto = request.headers.get("x-forwarded-proto") || "http";
        const origin = process.env.NEXT_PUBLIC_APP_URL || `${proto}://${host}`;
        const fHeaders: Record<string, string> = {
          Accept: "application/pdf",
          origin,
          "x-forwarded-host": host,
          "x-forwarded-proto": proto,
        };
        const invoiceRes = await fetch(
          `${origin}/api/orders/${updatedOrder._id}/invoice`,
          { headers: fHeaders, cache: "no-store" }
        );
        if (invoiceRes.ok) {
          const pdfArrayBuffer = await invoiceRes.arrayBuffer();
          attachments.push({
            filename: `invoice-${updatedOrder._id}.pdf`,
            content: Buffer.from(pdfArrayBuffer),
            contentType: "application/pdf",
          });
        }
      } catch {
        /* ignore invoice fetch errors */
      }

      try {
        if (updatedOrder.userEmail?.trim()) {
          await sendMail(updatedOrder.userEmail, subject, html, attachments);
          await prisma.order.update({
            where: { id: existing.id },
            data: { notificationSent: true },
          });
        }
      } catch (e) {
        console.warn("[ORDER_MANUAL_EMAIL_FAIL]", e);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[ORDER_PATCH_ERROR]", e);
    return NextResponse.json({ error: "Error updating order" }, { status: 500 });
  }
}
