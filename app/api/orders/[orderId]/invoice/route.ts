import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const order = await db.order.findUnique({
      where: { id: params.orderId },
      include: { orderItems: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    let y = 800;
    const drawText = (text: string, size = 12) => {
      page.drawText(text, { x: 50, y, size, font, color: rgb(0, 0, 0) });
      y -= size + 8;
    };

    drawText("MJ Carros - Invoice", 18);
    drawText(`Order ID: ${order.id}`);
    drawText(`Created: ${new Date(order.createdAt).toLocaleString()}`);
    drawText(`Status: ${order.isPaid ? 'Paid' : 'Pending'}`);

    y -= 6;
    drawText("Items:", 14);
    order.orderItems.forEach((item) => {
      drawText(`• ${item.productName}  x${item.quantity ?? 1}`);
    });

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
