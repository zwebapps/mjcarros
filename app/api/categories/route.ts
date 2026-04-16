import { NextRequest, NextResponse } from "next/server";

export const runtime = 'nodejs'; // Force Node.js runtime for JWT compatibility
import { MongoClient, ObjectId } from "mongodb";
import { extractTokenFromHeader, verifyToken } from "@/lib/auth";
import { getMongoDbUri, getMongoDbName } from "@/lib/mongodb-connection";
import { writeBufferToPublicUploads } from "@/lib/public-uploads";

const MONGODB_URI = getMongoDbUri();

function slugifyCategory(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9_-]/g, "");
}

export async function GET(request: NextRequest) {
  let client;
  
  try {
    client = new MongoClient(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    await client.connect();
    const db = client.db(getMongoDbName());
    const categoriesCollection = db.collection('categories');
    
    const categories = await categoriesCollection.find({}).sort({ createdAt: -1 }).toArray();
    return NextResponse.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json({ error: "Error fetching categories" }, { status: 500 });
  } finally {
    if (client) {
      await client.close();
    }
  }
}

export async function POST(request: NextRequest) {
  let client;
  
  try {
    // Check if user is admin (middleware sets headers); fallback to verifying JWT
    let userRole = request.headers.get('x-user-role');
    if (!userRole) {
      const token = extractTokenFromHeader(request.headers.get('authorization') ?? undefined);
      const payload = token ? verifyToken(token) : null;
      userRole = payload?.role || null as any;
    }
    if (userRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const contentType = request.headers.get("content-type") || "";
    let billboard = "";
    let billboardId = "";
    let category = "";
    let categorySizes: any[] = [];
    let uploadedImageUrl: string | null = null;

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const file = form.get("file") as File | null;
      billboard = String(form.get("billboard") || "");
      billboardId = String(form.get("billboardId") || "");
      category = String(form.get("category") || "");
      const rawSizes = form.get("categorySizes");
      if (rawSizes) {
        try {
          categorySizes = JSON.parse(String(rawSizes));
        } catch {
          categorySizes = [];
        }
      }
      if (file) {
        const bytes = Buffer.from(await file.arrayBuffer());
        const safeExt = (file.name.split(".").pop() || "jpg").replace(/[^a-z0-9]/gi, "").toLowerCase();
        const slug = slugifyCategory(category);
        const rel = `category/${slug || Date.now()}.${safeExt || "jpg"}`;
        uploadedImageUrl = await writeBufferToPublicUploads(rel, bytes);
      }
    } else {
      const body = await request.json();
      ({ billboard, billboardId, category, categorySizes } = body || {});
    }

    if (!billboard || !billboardId || !category) {
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
    const db = client.db(getMongoDbName());
    const categoriesCollection = db.collection('categories');
    const billboardsCollection = db.collection('billboards');

    // If an image was uploaded with the category, update the selected billboard imageURL to local uploads.
    if (uploadedImageUrl && ObjectId.isValid(billboardId)) {
      await billboardsCollection.updateOne(
        { _id: new ObjectId(billboardId) },
        { $set: { imageURL: uploadedImageUrl, updatedAt: new Date() } }
      );
    }
    
    const categoryData = {
      billboard,
      billboardId,
      category,
      categorySizes: categorySizes || [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await categoriesCollection.insertOne(categoryData);
    const newCategory = { ...categoryData, _id: result.insertedId };

    return NextResponse.json(newCategory);
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: "Error creating category" },
      { status: 500 }
    );
  } finally {
    if (client) {
      await client.close();
    }
  }
}
