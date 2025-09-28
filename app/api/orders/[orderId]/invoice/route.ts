import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import { ObjectId } from "mongodb";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { readFile } from "fs/promises";
import path from "path";

import { getMongoDbUri } from "@/lib/mongodb-connection";

const MONGODB_URI = getMongoDbUri();

export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  let client;
  
  try {
    // Check if orderId is valid
    if (!params.orderId || params.orderId === 'undefined') {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
    }

    client = new MongoClient(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    await client.connect();
    const db = client.db('mjcarros');
    const ordersCollection = db.collection('orders');
    const productsCollection = db.collection('products');
    
    // Find the order
    const order = await ordersCollection.findOne({ _id: new ObjectId(params.orderId) });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Fetch products for order items
    const orderItemsWithProducts = await Promise.all(
      (order.orderItems || []).map(async (item: any) => {
        const product = await productsCollection.findOne({ _id: new ObjectId(item.productId) });
        return {
          ...item,
          product: product
        };
      })
    );

    // Add products to order
    const orderWithProducts = {
      ...order,
      orderItems: orderItemsWithProducts,
      address: order.address || "",
      phone: order.phone || "",
      createdAt: order.createdAt || new Date()
    };

    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage([595.28, 841.89]); // A4
    const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const orange = rgb(0.98, 0.51, 0.27);

    // Load logo (optional)
    let logoImage: any = null;
    try {
      const logoPath = path.join(process.cwd(), "public", "logo.png");
      const logoBytes = await readFile(logoPath);
      logoImage = await pdfDoc.embedPng(logoBytes);
    } catch {}

    // Load car image from the first product (supports PNG and JPEG)
    let carImage: any = null;
    try {
      const firstProduct = orderWithProducts.orderItems[0]?.product;
      if (firstProduct?.imageURLs?.[0]) {
        let imageUrl = String(firstProduct.imageURLs[0] || "");
        // Improve Unsplash rendering by adding sizing if missing
        if (imageUrl.includes('images.unsplash.com') && !imageUrl.includes('?')) {
          imageUrl = `${imageUrl}?w=1200&h=800&fit=crop&auto=format`;
        }
        const response = await fetch(imageUrl, { cache: 'no-store' });
        if (response.ok) {
          const contentType = response.headers.get('content-type') || '';
          const imageBuffer = await response.arrayBuffer();
          const imageBytes = new Uint8Array(imageBuffer);
          try {
            if (contentType.includes('png')) {
              carImage = await pdfDoc.embedPng(imageBytes);
            } else {
              // Default to JPEG when content type is jpeg/jpg or unknown
              carImage = await pdfDoc.embedJpg(imageBytes);
            }
          } catch (embedErr) {
            // Fallback: try the other format once
            try {
              carImage = await pdfDoc.embedPng(imageBytes);
            } catch {
              try {
                carImage = await pdfDoc.embedJpg(imageBytes);
              } catch {}
            }
          }
        }
      }
    } catch (error) {
      console.warn('Failed to load car image:', error);
    }

    const formatCurrency = (n: number) =>
      new Intl.NumberFormat("en-IE", {
        style: "currency",
        currency: "EUR",
      }).format(n || 0);

    // Helpers
    const draw = (
      text: string,
      x: number,
      y: number,
      size = 12,
      isBold = false
    ) => {
      page.drawText(text, {
        x,
        y,
        size,
        font: isBold ? bold : regular,
        color: rgb(0, 0, 0),
      });
    };
    const line = (
      x: number,
      y: number,
      w: number,
      h = 1,
      color = orange
    ) => {
      page.drawRectangle({ x, y, width: w, height: h, color });
    };
    const box = (x: number, y: number, w: number, h: number) => {
      page.drawRectangle({
        x,
        y,
        width: w,
        height: h,
        color: rgb(0.95, 0.95, 0.95),
      });
    };
    const rightAlign = (
      text: string,
      rightX: number,
      y: number,
      size = 10,
      isBold = false
    ) => {
      const font = isBold ? bold : regular;
      const width = font.widthOfTextAtSize(text, size);
      page.drawText(text, {
        x: rightX - width,
        y,
        size,
        font,
        color: rgb(0, 0, 0),
      });
    };

    // Header band
    line(0, 820, 595.28, 4, orange);

    // Logo (placed before the title on the left)
    let titleX = 30;
    if (logoImage) {
      const logoW = 48;
      const logoH = (logoImage.height / logoImage.width) * logoW;
      page.drawImage(logoImage, { x: 30, y: 760, width: logoW, height: logoH });
      titleX = 30 + logoW + 12; // add spacing after logo
    }

    // Title
    draw("VEHICLE", titleX, 785, 26, true);
    draw("PURCHASE ORDER", titleX, 766, 14, true);
    draw(`# ${(orderWithProducts._id || '').toString().slice(0, 8)}`, titleX, 750, 12);

    // Car image (if available)
    if (carImage) {
      const carImageW = 120;
      const carImageH = (carImage.height / carImage.width) * carImageW;
      const carImageX = 595.28 - carImageW - 30; // Right side
      const carImageY = 750 - carImageH;
      page.drawImage(carImage, { 
        x: carImageX, 
        y: carImageY, 
        width: carImageW, 
        height: carImageH 
      });
    }

    // Two-column info panels (start under car image)
    const leftX = 30,
      rightX = 325;
    let infoY = 660;

    draw("JOHN DOE", leftX, infoY, 10, true);
    draw("COMPANY NAME", rightX, infoY, 10, true);

    infoY -= 22;
    box(leftX, infoY, 240, 16);
    draw("Purchaser Name", leftX + 6, infoY + 4, 9);
    box(rightX, infoY, 240, 16);
    draw("MJ Carros", rightX + 6, infoY + 4, 9);

    infoY -= 22;
    box(leftX, infoY, 240, 16);
    draw(
      (orderWithProducts.address || "").split(/\n/)[0] || "Address",
      leftX + 6,
      infoY + 4,
      9
    );
    box(rightX, infoY, 240, 16);
    draw("www.mjcarros.com", rightX + 6, infoY + 4, 9);

    infoY -= 22;
    box(leftX, infoY, 240, 16);
    draw(orderWithProducts.phone || "Phone", leftX + 6, infoY + 4, 9);
    box(rightX, infoY, 240, 16);
    draw("Sales", rightX + 6, infoY + 4, 9);

    // Vehicle Information (moved lower to avoid overlaps with top panels)
    line(30, 570, 535, 2, orange);
    draw("VEHICLE INFORMATION", 200, 576, 12, true);

    // Helpers for labels
    const label = (text: string, x: number, y: number) => {
      page.drawText(text, { x, y, size: 8.5, font: regular, color: rgb(0.45, 0.45, 0.45) });
    };

    const product = orderWithProducts.orderItems[0]?.product as any;
    const makeVal = (product?.category || "").toString();
    const yearVal = product?.year && product.year > 0 ? String(product.year) : "";
    const colorVal = product?.color || "";
    const modelVal = product?.modelName || product?.title || "";
    const mileageVal = product?.mileage != null ? String(product.mileage) : "";
    const fuelVal = product?.fuelType || "";
    const vinVal = product?.id || product?._id?.toString() || "";
    const deliveryVal = orderWithProducts.createdAt ? new Date(orderWithProducts.createdAt).toLocaleDateString() : "";

    // Layout positions (lowered) and vertical spacing
    const fieldH = 18; // height of value boxes
    const rowGap = 36; // vertical gap between rows (larger to avoid overlap)
    const r1 = 520; // first row baseline
    const r2 = r1 - rowGap; // second row
    const r3 = r2 - rowGap; // third row
    const left = 30; const mid = 210; const right = 380;

    // Row 1 labels
    label("Make", left, r1 + fieldH + 2);
    label("Year", mid, r1 + fieldH + 2);
    label("Colour", right, r1 + fieldH + 2);
    // Row 1 values
    box(left, r1, 160, fieldH); draw(makeVal.toUpperCase(), left + 6, r1 + 4, 9);
    box(mid, r1, 150, fieldH); draw(yearVal, mid + 6, r1 + 4, 9);
    box(right, r1, 185, fieldH); draw(colorVal, right + 6, r1 + 4, 9);

    // Row 2 labels
    label("Model", left, r2 + fieldH + 2);
    label("Mileage", mid, r2 + fieldH + 2);
    label("Fuel Type", right, r2 + fieldH + 2);
    // Row 2 values
    box(left, r2, 160, fieldH); draw(modelVal, left + 6, r2 + 4, 9);
    box(mid, r2, 150, fieldH); draw(mileageVal, mid + 6, r2 + 4, 9);
    box(right, r2, 185, fieldH); draw(fuelVal, right + 6, r2 + 4, 9);

    // Row 3 labels
    label("Vehicle ID Number", left, r3 + fieldH + 2);
    label("Delivery Date", mid, r3 + fieldH + 2);
    // Row 3 values
    box(left, r3, 160, fieldH); draw(vinVal, left + 6, r3 + 4, 9);
    box(mid, r3, 150, fieldH); draw(deliveryVal, mid + 6, r3 + 4, 9);

    // Vehicle Price (compute relative to info section bottom to avoid overlap)
    const infoBottomY = r3; // bottom edge y of the last row boxes
    const priceBandY = infoBottomY - 80; // increased gap below info section
    line(30, priceBandY, 535, 2, orange);
    draw("VEHICLE PRICE", 230, priceBandY + 6, 12, true);

    // Items and amounts with wrapping and separators to avoid overlap (moved lower)
    const wrapText = (text: string, maxWidth: number, size = 10) => {
      const words = String(text || '').split(/\s+/);
      const lines: string[] = [];
      let current = '';
      for (const w of words) {
        const trial = current ? current + ' ' + w : w;
        if (regular.widthOfTextAtSize(trial, size) <= maxWidth) current = trial;
        else { if (current) lines.push(current); current = w; }
      }
      if (current) lines.push(current);
      return lines;
    };
    let y = priceBandY - 30; // start items further below the price band
    draw("VEHICLE AND ACCESSORIES", 30, y, 9, true);
    rightAlign("AMOUNT", 565, y, 9, true);
    y -= 18;

    let subtotal = 0;
    for (const item of orderWithProducts.orderItems) {
      const unit =
        (item.product?.finalPrice ?? item.product?.price ?? 0) as number;
      const qty = item.quantity ?? 1;
      const rowTotal = unit * qty;
      subtotal += rowTotal;

      const maxNameWidth = 520 - 30 - 80; // keep space for amount
      const nameLines = wrapText(item.productName || 'Item', maxNameWidth, 10);
      rightAlign(formatCurrency(rowTotal), 565, y, 10);
      for (let i = 0; i < nameLines.length; i++) {
        draw(nameLines[i], 30, y, 10);
        y -= 14;
      }
      y -= 4; // gap
      line(30, y + 2, 535, 1, rgb(0.9,0.9,0.9));
      if (y < 200) {
        page = pdfDoc.addPage([595.28, 841.89]);
        y = 800;
        line(30, y, 535, 2, orange); y -= 6; draw("VEHICLE PRICE", 230, y, 12, true); y -= 14;
        draw("VEHICLE AND ACCESSORIES", 30, y, 9, true); rightAlign("AMOUNT", 565, y, 9, true); y -= 18;
      }
    }

    const tax = 0;
    const dealerFee = 0;
    const totalSale = subtotal + tax + dealerFee;
    const downPayment = 0;
    const balanceDue = totalSale - downPayment;

    // Extra gap before totals
    y -= 20;
    draw("TOTAL:", 430, y, 10, true);
    rightAlign(formatCurrency(subtotal), 565, y, 10);
    y -= 14;
    draw("TAX:", 430, y, 10);
    rightAlign(formatCurrency(tax), 565, y, 10);
    y -= 14;
    draw("DEALER FEE:", 430, y, 10);
    rightAlign(formatCurrency(dealerFee), 565, y, 10);
    y -= 14;
    draw("TOTAL SALE PRICE:", 400, y, 10, true);
    rightAlign(formatCurrency(totalSale), 565, y, 10, true);
    y -= 18;
    draw("TOTAL DOWN PAYMENT:", 380, y, 10);
    rightAlign(formatCurrency(downPayment), 565, y, 10);
    y -= 14;
    draw("BALANCE DUE:", 430, y, 10, true);
    rightAlign(formatCurrency(balanceDue), 565, y, 10, true);

    // Signatures
    line(30, 160, 180, 1, rgb(0.8, 0.8, 0.8));
    draw("PURCHASER SIGNATURE", 30, 150, 9);
    line(210, 160, 180, 1, rgb(0.8, 0.8, 0.8));
    draw("AUTHORIZED PERSON SIGNATURE", 210, 150, 9);
    line(390, 160, 175, 1, rgb(0.8, 0.8, 0.8));
    draw("DATE", 390, 150, 9);

    // Footer - company name and contact details
    page.drawRectangle({ x: 0, y: 0, width: 595.28, height: 70, color: orange });
    const white = rgb(1, 1, 1);
    const siteName = (process.env.NEXT_PUBLIC_SITE_NAME || 'MJ Carros').toUpperCase();
    const siteAddr1 = process.env.NEXT_PUBLIC_SITE_ADDRESS1 || '178 Expensive Avenue';
    const siteCity = process.env.NEXT_PUBLIC_SITE_CITY || 'Philadelphia, 20100 PH';
    const sitePhone = process.env.NEXT_PUBLIC_SITE_PHONE || '+1 (555) 000-0000';
    const siteEmail = process.env.NEXT_PUBLIC_SITE_EMAIL || 'info@mjcarros.com';
    const siteWeb = process.env.NEXT_PUBLIC_SITE_WEB || 'www.mjcarros.com';

    // Right-aligned block in footer
    const footerRightX = 580;
    page.drawText(siteName, { x: footerRightX - bold.widthOfTextAtSize(siteName, 12), y: 48, size: 12, font: bold, color: white });
    page.drawText(siteAddr1, { x: footerRightX - regular.widthOfTextAtSize(siteAddr1, 9), y: 34, size: 9, font: regular, color: white });
    page.drawText(siteCity, { x: footerRightX - regular.widthOfTextAtSize(siteCity, 9), y: 22, size: 9, font: regular, color: white });
    const contactLine = `${sitePhone}  •  ${siteEmail}  •  ${siteWeb}`;
    page.drawText(contactLine, { x: footerRightX - regular.widthOfTextAtSize(contactLine, 9), y: 10, size: 9, font: regular, color: white });

    const pdfBytes = await pdfDoc.save();
    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename=invoice-${orderWithProducts._id}.pdf`,
      },
    });
  } catch (error) {
    console.error("Invoice generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate invoice" },
      { status: 500 }
    );
  } finally {
    if (client) {
      await client.close();
    }
  }
}
