import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { s3Client } from "@/lib/s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";

export async function GET(request: NextRequest) {
  try {
    const products = await db.product.findMany();
    return NextResponse.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json({ error: "Error fetching products" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if user is admin (middleware sets these headers)
    const userRole = request.headers.get('x-user-role');
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const contentType = request.headers.get('content-type') || '';
    let title = '';
    let description = '';
    let category = '';
    let categoryId = '';
    let price: number = 0;
    let finalPrice: number | undefined = undefined;
    let discount: number | undefined = undefined;
    let featured: boolean = false;
    let productSizes: any[] | undefined = undefined;
    let imageURLs: string[] = [];
    let extras: any = {};

    const bucket = process.env.AWS_BUCKET_NAME || process.env.NEXT_PUBLIC_AWS_BUCKET_NAME;
    const region = process.env.NEXT_PUBLIC_AWS_S3_REGION || process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION;
    const baseUrl = (process.env.NEXT_PUBLIC_S3_BASE_URL || (bucket && region ? `https://${bucket}.s3.${region}.amazonaws.com` : '')).replace(/\/$/, '');

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const raw = String(formData.get('requestData') || '{}');
      const parsed = JSON.parse(raw || '{}');
      title = parsed.title;
      description = parsed.description;
      category = parsed.category;
      categoryId = parsed.categoryId;
      price = Number(parsed.price || 0);
      finalPrice = parsed.finalPrice ? Number(parsed.finalPrice) : undefined;
      discount = parsed.discount ? Number(parsed.discount) : undefined;
      featured = !!parsed.featured;
      productSizes = parsed.sizes?.map((s: any) => ({ sizeId: s.id, name: s.name })) || [];
      // Car attributes
      extras = {
        modelName: parsed.modelName || "",
        year: parsed.year ? Number(parsed.year) : 0,
        stockQuantity: parsed.stockQuantity ? Number(parsed.stockQuantity) : 0,
        color: parsed.color || "",
        fuelType: parsed.fuelType || "",
        transmission: parsed.transmission || "",
        mileage: parsed.mileage ? Number(parsed.mileage) : null,
        condition: parsed.condition || "new",
      };

      const files = formData.getAll('files') as File[];
      for (const file of files) {
        if (!file || !bucket) continue;
        const bytes = Buffer.from(await file.arrayBuffer());
        const key = `products/${Date.now()}-${file.name}`.replace(/\s+/g, '-');
        await s3Client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: bytes, ContentType: file.type || 'application/octet-stream' }));
        if (baseUrl) imageURLs.push(`${baseUrl}/${key}`);
      }
    } else {
      const body = await request.json();
      ({ title, description, imageURLs = [], category, categoryId, price, finalPrice, discount, featured, productSizes, ...extras } = body);
    }

    if (!title || !description || !category || !categoryId || !price) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const newProduct = await db.product.create({
      data: {
        title,
        description,
        imageURLs,
        category,
        categoryId,
        price,
        finalPrice,
        discount,
        featured: featured || false,
        ...extras,
        productSizes: {
          create: productSizes || [],
        },
      },
      include: {
        productSizes: {
          include: {
            size: true,
          },
        },
      },
    });

    return NextResponse.json(newProduct);
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Error creating product" },
      { status: 500 }
    );
  }
}
