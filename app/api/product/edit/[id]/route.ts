import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { s3Client } from "@/lib/s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { extractTokenFromHeader, verifyToken } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!db) {
      return NextResponse.json({ error: 'Database not found' }, { status: 500 });
    }
    const product = await db.product.findUnique({
      where: { id: params.id },
    });
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    return NextResponse.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json({ error: "Error fetching product" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Admin guard with JWT fallback
    let userRole = request.headers.get('x-user-role');
    if (!userRole) {
      const token = extractTokenFromHeader(request.headers.get('authorization') ?? undefined);
      const payload = token ? verifyToken(token) : null;
      userRole = payload?.role || null as any;
    }
    if (userRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    const formData = await request.formData();
    const name = String(formData.get("name") || "");
    const price = Number(formData.get("price") || 0);
    const discountRaw = formData.get("discount");
    const discount = discountRaw !== null && String(discountRaw).length > 0 ? Number(discountRaw) : null;
    const description = String(formData.get("description") || "");
    const category = String(formData.get("category") || "");
    const isFeatured = String(formData.get("isFeatured") || "false") === "true";
    const productSizesRaw = String(formData.get("productSizes") || "[]");
    // New fields
    const modelName = String(formData.get("modelName") || "");
    const year = Number(formData.get("year") || 0);
    const stockQuantity = Number(formData.get("stockQuantity") || 0);
    const color = String(formData.get("color") || "");
    const fuelType = String(formData.get("fuelType") || "");
    const transmission = String(formData.get("transmission") || "");
    const mileageRaw = formData.get("mileage");
    const mileage = mileageRaw !== null && String(mileageRaw).length > 0 ? Number(mileageRaw) : null;
    const condition = String(formData.get("condition") || "");

    let categoryIdUpdate: string | undefined = undefined;
    if (category) {
      if (!db) {
        return NextResponse.json({ error: 'Database not found' }, { status: 500 });
      }
      const cat = await db.category.findFirst({ where: { category } });
      if (cat) categoryIdUpdate = cat.id;
    }

    // Optional file uploads
    const bucket = process.env.AWS_BUCKET_NAME || process.env.NEXT_PUBLIC_AWS_BUCKET_NAME;
    const region = process.env.NEXT_PUBLIC_AWS_S3_REGION || process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION;
    const baseUrl = (process.env.NEXT_PUBLIC_S3_BASE_URL || (bucket && region ? `https://${bucket}.s3.${region}.amazonaws.com` : '')).replace(/\/$/, '');
    // Load existing product to append gallery images
    if (!db) {
      return NextResponse.json({ error: 'Database not found' }, { status: 500 });
    }
    const existing = await db.product.findUnique({ where: { id: params.id } });
    const newFiles = formData.getAll('image') as File[];
    let newUrls: string[] = [];
    for (const file of newFiles) {
      if (!file || !bucket) continue;
      const bytes = Buffer.from(await file.arrayBuffer());
      const key = `products/${Date.now()}-${file.name}`.replace(/\s+/g, '-');
      await s3Client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: bytes, ContentType: file.type || 'application/octet-stream' }));
      if (baseUrl) newUrls.push(`${baseUrl}/${key}`);
    }

    // Decide final gallery URLs (append new uploads)
    const combinedUrls = newUrls.length && existing ? [...existing.imageURLs, ...newUrls] : (newUrls.length ? newUrls : undefined);

    // Update main product fields
    const updated = await db.product.update({
      where: { id: params.id },
      data: {
        title: name || undefined,
        price: price || undefined,
        discount: discount === null ? undefined : discount,
        description: description || undefined,
        category: category || undefined,
        ...(categoryIdUpdate ? { categoryId: categoryIdUpdate } : {}),
        featured: isFeatured,
        modelName,
        year,
        stockQuantity,
        color,
        fuelType,
        transmission,
        mileage: mileage === null ? undefined : mileage,
        condition,
        ...(combinedUrls ? { imageURLs: combinedUrls } : {}),
      },
    });

    // sizes removed

    const refreshed = await db.product.findUnique({ where: { id: params.id } });

    return NextResponse.json(refreshed || updated);
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json({ error: "Error updating product" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!db) {
      return NextResponse.json({ error: 'Database not found' }, { status: 500 });
    }
    const deleted = await db.product.delete({ where: { id: params.id } });
    return NextResponse.json(deleted);
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json({ error: "Error deleting product" }, { status: 500 });
  }
}
