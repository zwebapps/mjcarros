import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import { s3Client } from "@/lib/s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { extractTokenFromHeader, verifyToken } from "@/lib/auth";
import { ObjectId } from "mongodb";
import { getMongoDbUri } from "@/lib/mongodb-connection";

export const runtime = 'nodejs'; // Force Node.js runtime for JWT compatibility

const MONGODB_URI = getMongoDbUri();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    const product = await productsCollection.findOne({
      _id: new ObjectId(params.id)
    });
    
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    
    // Add id field for compatibility
    const productWithId = {
      ...product,
      id: product._id.toString()
    };
    
    return NextResponse.json(productWithId);
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json({ error: "Error fetching product" }, { status: 500 });
  } finally {
    if (client) {
      await client.close();
    }
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  let client;
  
  try {
    // Admin guard with JWT
    const authHeader = request.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized - No token provided' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 });
    }

    if (decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }

    client = new MongoClient(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    await client.connect();
    const db = client.db('mjcarros');
    const productsCollection = db.collection('products');
    const categoriesCollection = db.collection('categories');
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
      const cat = await categoriesCollection.findOne({ category });
      if (cat) categoryIdUpdate = cat._id.toString();
    }

    // Optional file uploads
    const bucket = process.env.AWS_BUCKET_NAME || process.env.NEXT_PUBLIC_AWS_BUCKET_NAME;
    const region = process.env.NEXT_PUBLIC_AWS_S3_REGION || process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION;
    const baseUrl = (process.env.NEXT_PUBLIC_S3_BASE_URL || (bucket && region ? `https://${bucket}.s3.${region}.amazonaws.com` : '')).replace(/\/$/, '');
    // Load existing product to append gallery images
    const existing = await productsCollection.findOne({ _id: new ObjectId(params.id) });
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
    const combinedUrls = newUrls.length && existing ? [...(existing.imageURLs || []), ...newUrls] : (newUrls.length ? newUrls : undefined);

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date()
    };

    if (name) updateData.title = name;
    if (price) updateData.price = price;
    if (discount !== null) updateData.discount = discount;
    if (description) updateData.description = description;
    if (category) updateData.category = category;
    if (categoryIdUpdate) updateData.categoryId = categoryIdUpdate;
    updateData.featured = isFeatured;
    if (modelName) updateData.modelName = modelName;
    if (year) updateData.year = year;
    if (stockQuantity) updateData.stockQuantity = stockQuantity;
    if (color) updateData.color = color;
    if (fuelType) updateData.fuelType = fuelType;
    if (transmission) updateData.transmission = transmission;
    if (mileage !== null) updateData.mileage = mileage;
    if (condition) updateData.condition = condition;
    if (combinedUrls) updateData.imageURLs = combinedUrls;

    // Update main product fields
    const result = await productsCollection.updateOne(
      { _id: new ObjectId(params.id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Get the updated product
    const refreshed = await productsCollection.findOne({ _id: new ObjectId(params.id) });
    
    if (!refreshed) {
      return NextResponse.json({ error: "Product not found after update" }, { status: 404 });
    }

    // Add id field for compatibility
    const productWithId = {
      ...refreshed,
      id: refreshed._id.toString()
    };

    return NextResponse.json(productWithId);
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json({ error: "Error updating product" }, { status: 500 });
  } finally {
    if (client) {
      await client.close();
    }
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    const result = await productsCollection.deleteOne({ _id: new ObjectId(params.id) });
    
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    
    return NextResponse.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json({ error: "Error deleting product" }, { status: 500 });
  } finally {
    if (client) {
      await client.close();
    }
  }
}
