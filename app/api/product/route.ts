import { NextRequest, NextResponse } from "next/server";
import { MongoClient, ObjectId } from "mongodb";
import { s3Client } from "@/lib/s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { extractTokenFromHeader, verifyToken } from "@/lib/auth";
import { getMongoDbUri } from "@/lib/mongodb-connection";

export const runtime = 'nodejs'; // Force Node.js runtime for JWT compatibility

const MONGODB_URI = getMongoDbUri();

export async function GET(request: NextRequest) {
  let client;
  
  try {
    client = new MongoClient(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    await client.connect();
    const db = client.db('mjcarros');
    const productsCollection = db.collection('products');
    
    const products = await productsCollection.find({}).toArray();
    const withCode = products.map((p:any)=>({
      ...p,
      productCode: p.productCode || `PRD-${p._id.toString().slice(-6).toUpperCase()}`,
      sold: !!p.sold,
    }));
    return NextResponse.json(withCode);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json({ error: "Error fetching products" }, { status: 500 });
  } finally {
    if (client) {
      await client.close();
    }
  }
}

export async function POST(request: NextRequest) {
  let client;
  
  try {
    // Check if user is admin (middleware sets these headers). Fallback to self-verification.
    let userRole = request.headers.get('x-user-role');
    if (!userRole) {
      const token = extractTokenFromHeader(request.headers.get('authorization'));
      const payload = token ? verifyToken(token) : null;
      if (payload) userRole = payload.role;
    }
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
    let sold: boolean = false;
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
      sold = !!parsed.sold;
      // sizes removed
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

      // Merge any pre-uploaded gallery URLs
      const preUrls = Array.isArray(parsed.galleryURLs)
        ? parsed.galleryURLs
        : (Array.isArray(parsed.imageURLs) ? parsed.imageURLs : []);

      const files = formData.getAll('files') as File[];
      for (const file of files) {
        if (!file || !bucket) continue;
        const bytes = Buffer.from(await file.arrayBuffer());
        const key = `products/${Date.now()}-${file.name}`.replace(/\s+/g, '-');
        await s3Client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: bytes, ContentType: file.type || 'application/octet-stream' }));
        if (baseUrl) imageURLs.push(`${baseUrl}/${key}`);
      }

      imageURLs = [...preUrls, ...imageURLs];
    } else {
      const body = await request.json();
      ({ title, description, imageURLs = [], category, categoryId, price, finalPrice, discount, featured, sold, ...extras } = body);
    }

    if (!title || !description || !category || !categoryId || !price) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    client = new MongoClient(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    await client.connect();
    const db = client.db('mjcarros');
    const productsCollection = db.collection('products');
    
    // Pre-generate an ObjectId so we can derive a human-friendly productCode
    const newId = new ObjectId();
    const productCode = `PRD-${newId.toHexString().slice(-6).toUpperCase()}`;

    const productData = {
      _id: newId,
      title,
      description,
      imageURLs,
      category,
      categoryId,
      price,
      finalPrice,
      discount,
      featured: featured || false,
      sold: sold || false,
      productCode,
      ...extras,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await productsCollection.insertOne(productData);
    const newProduct = { ...productData, _id: result.insertedId };

    return NextResponse.json(newProduct);
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Error creating product" },
      { status: 500 }
    );
  } finally {
    if (client) {
      await client.close();
    }
  }
}
