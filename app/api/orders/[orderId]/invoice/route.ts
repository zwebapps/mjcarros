import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { readFile } from "fs/promises";
import path from "path";

export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const order = await db.order.findUnique({
      where: { id: params.orderId },
      include: {
        orderItems: {
          include: { product: true },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Load logo
    let logoImage: any = null;
    try {
      const logoPath = path.join(process.cwd(), "public", "logo.png");
      const logoBytes = await readFile(logoPath);
      logoImage = await pdfDoc.embedPng(logoBytes);
    } catch {}

    const formatCurrency = (n: number) => new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" }).format(n || 0);

    let y = 800;
    const drawText = (text: string, size = 12, x = 50) => {
      page.drawText(text, { x, y, size, font, color: rgb(0, 0, 0) });
      y -= size + 8;
    };

    // Header
    if (logoImage) {
      const logoWidth = 90;
      const logoHeight = (logoImage.height / logoImage.width) * logoWidth;
      page.drawImage(logoImage, { x: 455, y: 780, width: logoWidth, height: logoHeight });
    }
    drawText("MJ Carros", 20);
    drawText("Invoice", 16);

    y -= 6;
    drawText(`Order ID: ${order.id}`);
    drawText(`Date: ${new Date(order.createdAt).toLocaleString()}`);
    drawText(`Status: ${order.isPaid ? "Paid" : "Pending"}`);

    y -= 12;
    // Customer & Delivery details
    drawText("Bill To:", 14);
    drawText(order.userEmail || "N/A");
    if (order.phone) drawText(`Phone: ${order.phone}`);
    if (order.address) {
      const lines = String(order.address).split(/\n|,\s*/).filter(Boolean);
      lines.slice(0, 3).forEach((line) => drawText(line));
    }

    y -= 10;
    // Items table header
    const tableStartY = y;
    const colX = { item: 50, qty: 360, unit: 420, total: 500 };
    page.drawText("Item", { x: colX.item, y, size: 12, font });
    page.drawText("Qty", { x: colX.qty, y, size: 12, font });
    page.drawText("Unit", { x: colX.unit, y, size: 12, font });
    page.drawText("Total", { x: colX.total, y, size: 12, font });
    y -= 14;

    let grandTotal = 0;
    order.orderItems.forEach((item) => {
      const unit = (item.product?.finalPrice ?? item.product?.price ?? 0) as number;
      const qty = item.quantity ?? 1;
      const rowTotal = unit * qty;
      grandTotal += rowTotal;
      page.drawText(item.productName, { x: colX.item, y, size: 11, font });
      page.drawText(String(qty), { x: colX.qty, y, size: 11, font });
      page.drawText(formatCurrency(unit), { x: colX.unit, y, size: 11, font });
      page.drawText(formatCurrency(rowTotal), { x: colX.total, y, size: 11, font });
      y -= 14;
    });

    // Totals
    y = Math.max(y, tableStartY - 14);
    y -= 10;
    page.drawText("Subtotal:", { x: colX.unit, y, size: 12, font });
    page.drawText(formatCurrency(grandTotal), { x: colX.total, y, size: 12, font });
    y -= 16;
    page.drawText("Total:", { x: colX.unit, y, size: 14, font });
    page.drawText(formatCurrency(grandTotal), { x: colX.total, y, size: 14, font });

    y -= 30;
    drawText("Thank you for your purchase!", 12);
    drawText("MJ Carros • www.mjcarros.com", 10);

    const pdfBytes = await pdfDoc.save();
    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename=invoice-${order.id}.pdf`,
      },
    });
  } catch (error) {
    console.error("Invoice generation error:", error);
    return NextResponse.json({ error: "Failed to generate invoice" }, { status: 500 });
  }
}
